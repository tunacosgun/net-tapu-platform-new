import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../../api/client';
import { useTheme } from '../../theme';

export type ParcelFilters = {
  city?: string;
  district?: string;
  parcelType?: string;
  zoningStatus?: string;
  minPrice?: string;
  maxPrice?: string;
  minArea?: string;
  maxArea?: string;
  categoryId?: string;
};

type CategoryNode = {
  id: string;
  name: string;
  children: CategoryNode[];
};

const PARCEL_TYPES = [
  { value: '', label: 'Tümü' },
  { value: 'arsa', label: 'Arsa' },
  { value: 'tarla', label: 'Tarla' },
  { value: 'bağ', label: 'Bağ' },
  { value: 'bahçe', label: 'Bahçe' },
  { value: 'zeytinlik', label: 'Zeytinlik' },
];

const ZONING_OPTIONS = [
  { value: '', label: 'Tümü' },
  { value: 'İmarlı', label: 'İmarlı' },
  { value: 'İmarsız', label: 'İmarsız' },
  { value: 'Konut İmarlı', label: 'Konut İmarlı' },
  { value: 'Ticari İmarlı', label: 'Ticari İmarlı' },
];

export function ParcelFilterSheet({
  visible,
  initial,
  onClose,
  onApply,
}: {
  visible: boolean;
  initial: ParcelFilters;
  onClose: () => void;
  onApply: (filters: ParcelFilters) => void;
}) {
  const { colors: c, isDark } = useTheme();
  const [filters, setFilters] = useState<ParcelFilters>(initial);
  const [cityResults, setCityResults] = useState<string[]>([]);
  const [districtResults, setDistrictResults] = useState<string[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);

  useEffect(() => setFilters(initial), [initial, visible]);

  useEffect(() => {
    if (!visible) return;
    apiClient.get<CategoryNode[]>('/categories/tree').then((r) => setCategories(r.data)).catch(() => {});
  }, [visible]);

  // City autocomplete
  useEffect(() => {
    if (!visible) return;
    const q = filters.city?.trim() || '';
    apiClient
      .get<string[]>('/locations/cities', { params: { q: q || undefined, limit: 10 } })
      .then((r) => setCityResults(r.data))
      .catch(() => setCityResults([]));
  }, [filters.city, visible]);

  // District autocomplete (depends on selected city)
  useEffect(() => {
    if (!visible || !filters.city) { setDistrictResults([]); return; }
    apiClient
      .get<string[]>('/locations/districts', { params: { city: filters.city, q: filters.district || undefined, limit: 10 } })
      .then((r) => setDistrictResults(r.data))
      .catch(() => setDistrictResults([]));
  }, [filters.city, filters.district, visible]);

  function set<K extends keyof ParcelFilters>(key: K, value: ParcelFilters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function handleApply() {
    onApply(filters);
    onClose();
  }

  function handleClear() {
    const empty: ParcelFilters = {};
    setFilters(empty);
    onApply(empty);
    onClose();
  }

  const activeCount = Object.values(filters).filter((v) => v && String(v).trim()).length;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={26} color={c.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: c.text }]}>Filtrele {activeCount > 0 ? `(${activeCount})` : ''}</Text>
          <TouchableOpacity onPress={handleClear}>
            <Text style={[styles.clearTxt, { color: c.primary }]}>Temizle</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
          {/* Şehir */}
          <Section title="Şehir" color={c.text}>
            <TextInput
              value={filters.city || ''}
              onChangeText={(v) => set('city', v)}
              placeholder="İl yazın..."
              placeholderTextColor={c.textMuted}
              style={[inputStyle(c, isDark)]}
            />
            <View style={styles.chipRow}>
              {cityResults.slice(0, 8).map((city) => (
                <Chip
                  key={city}
                  label={city}
                  active={filters.city === city}
                  onPress={() => set('city', filters.city === city ? '' : city)}
                  colors={c}
                />
              ))}
            </View>
          </Section>

          {/* İlçe */}
          {filters.city && (
            <Section title="İlçe" color={c.text}>
              <View style={styles.chipRow}>
                {districtResults.slice(0, 12).map((d) => (
                  <Chip
                    key={d}
                    label={d}
                    active={filters.district === d}
                    onPress={() => set('district', filters.district === d ? '' : d)}
                    colors={c}
                  />
                ))}
              </View>
            </Section>
          )}

          {/* Kategori */}
          {categories.length > 0 && (
            <Section title="Kategori" color={c.text}>
              <View style={styles.chipRow}>
                {flattenCategories(categories).map((cat) => (
                  <Chip
                    key={cat.id}
                    label={cat.name}
                    active={filters.categoryId === cat.id}
                    onPress={() => set('categoryId', filters.categoryId === cat.id ? '' : cat.id)}
                    colors={c}
                  />
                ))}
              </View>
            </Section>
          )}

          {/* Arazi Türü */}
          <Section title="Arazi Türü" color={c.text}>
            <View style={styles.chipRow}>
              {PARCEL_TYPES.map((t) => (
                <Chip
                  key={t.value}
                  label={t.label}
                  active={(filters.parcelType || '') === t.value}
                  onPress={() => set('parcelType', t.value || undefined)}
                  colors={c}
                />
              ))}
            </View>
          </Section>

          {/* İmar */}
          <Section title="İmar Durumu" color={c.text}>
            <View style={styles.chipRow}>
              {ZONING_OPTIONS.map((z) => (
                <Chip
                  key={z.value}
                  label={z.label}
                  active={(filters.zoningStatus || '') === z.value}
                  onPress={() => set('zoningStatus', z.value || undefined)}
                  colors={c}
                />
              ))}
            </View>
          </Section>

          {/* Fiyat aralığı */}
          <Section title="Fiyat Aralığı (₺)" color={c.text}>
            <View style={styles.row}>
              <TextInput
                value={filters.minPrice || ''}
                onChangeText={(v) => set('minPrice', v.replace(/[^\d]/g, ''))}
                placeholder="Min"
                placeholderTextColor={c.textMuted}
                keyboardType="numeric"
                style={[inputStyle(c, isDark), { flex: 1, marginRight: 8 }]}
              />
              <TextInput
                value={filters.maxPrice || ''}
                onChangeText={(v) => set('maxPrice', v.replace(/[^\d]/g, ''))}
                placeholder="Max"
                placeholderTextColor={c.textMuted}
                keyboardType="numeric"
                style={[inputStyle(c, isDark), { flex: 1 }]}
              />
            </View>
          </Section>

          {/* Alan */}
          <Section title="Alan (m²)" color={c.text}>
            <View style={styles.row}>
              <TextInput
                value={filters.minArea || ''}
                onChangeText={(v) => set('minArea', v.replace(/[^\d]/g, ''))}
                placeholder="Min"
                placeholderTextColor={c.textMuted}
                keyboardType="numeric"
                style={[inputStyle(c, isDark), { flex: 1, marginRight: 8 }]}
              />
              <TextInput
                value={filters.maxArea || ''}
                onChangeText={(v) => set('maxArea', v.replace(/[^\d]/g, ''))}
                placeholder="Max"
                placeholderTextColor={c.textMuted}
                keyboardType="numeric"
                style={[inputStyle(c, isDark), { flex: 1 }]}
              />
            </View>
          </Section>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: c.background, borderTopColor: c.border }]}>
          <TouchableOpacity
            onPress={handleApply}
            style={[styles.applyBtn, { backgroundColor: c.primary }]}
            activeOpacity={0.85}
          >
            <Text style={styles.applyTxt}>Uygula{activeCount > 0 ? ` (${activeCount} filtre)` : ''}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function flattenCategories(nodes: CategoryNode[]): CategoryNode[] {
  const out: CategoryNode[] = [];
  function walk(list: CategoryNode[]) {
    for (const n of list) {
      out.push(n);
      if (n.children?.length) walk(n.children);
    }
  }
  walk(nodes);
  return out.filter((n) => n.name); // skip empties
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</Text>
      {children}
    </View>
  );
}

function Chip({ label, active, onPress, colors }: { label: string; active: boolean; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 18,
        backgroundColor: active ? colors.primary : 'transparent',
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ color: active ? '#fff' : colors.text, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function inputStyle(c: any, isDark: boolean) {
  return {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: isDark ? c.surface : '#fff',
    paddingHorizontal: 14,
    fontSize: 15,
    color: c.text,
  } as const;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 17, fontWeight: '700' },
  clearTxt: { fontSize: 14, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  row: { flexDirection: 'row', alignItems: 'center' },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
  applyBtn: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  applyTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
