import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import apiClient from '../../api/client';
import { useTheme } from '../../theme';
import { EmptyState } from '../../components/ui/EmptyState';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type SavedSearch = {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  notifyOnMatch: boolean;
  createdAt: string;
};

const FILTER_LABELS: Record<string, string> = {
  city: 'Şehir', district: 'İlçe', neighborhood: 'Mahalle',
  parcelType: 'Tür', categoryId: 'Kategori',
  minPrice: 'Min ₺', maxPrice: 'Max ₺',
  minArea: 'Min m²', maxArea: 'Max m²',
  zoningStatus: 'İmar', roadAccess: 'Yol',
  isFeatured: 'Öne Çıkan', search: 'Anahtar',
};

export function SavedSearchesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors: c, isDark } = useTheme();
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const { data } = await apiClient.get<SavedSearch[]>('/saved-searches');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function toggleNotify(item: SavedSearch) {
    try {
      await apiClient.patch(`/saved-searches/${item.id}`, { notifyOnMatch: !item.notifyOnMatch });
      setItems((arr) => arr.map((x) => x.id === item.id ? { ...x, notifyOnMatch: !x.notifyOnMatch } : x));
    } catch {
      Alert.alert('Hata', 'Bildirim ayarı güncellenemedi.');
    }
  }

  async function handleDelete(item: SavedSearch) {
    Alert.alert(
      'Aramayı Sil',
      `"${item.name}" aramasını silmek istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/saved-searches/${item.id}`);
              setItems((arr) => arr.filter((x) => x.id !== item.id));
            } catch {
              Alert.alert('Hata', 'Silme başarısız.');
            }
          },
        },
      ],
    );
  }

  function applySearch(item: SavedSearch) {
    navigation.navigate('MainTabs' as never, {
      screen: 'Parcels',
      params: { savedFilters: item.filters },
    } as never);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={26} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>Kayıtlı Aramalar</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? null : items.length === 0 ? (
        <EmptyState
          icon="bookmark-outline"
          title="Henüz kayıtlı arama yok"
          description="Arsalar ekranında filtre uygulayıp 'Aramayı Kaydet' ile kayıt oluşturabilirsiniz."
          actionLabel="Arsaları Keşfet"
          onAction={() => navigation.navigate('MainTabs' as never)}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={c.primary} />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInUp.delay(index * 50).springify().damping(18)}>
              <View style={[styles.card, { backgroundColor: isDark ? c.surface : '#fff', shadowColor: '#94a3b8' }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.cardDate, { color: c.textMuted }]}>
                      {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="trash-outline" size={20} color={c.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.chipRow}>
                  {Object.entries(item.filters || {}).slice(0, 6).map(([k, v]) => (
                    <View key={k} style={[styles.chip, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                      <Text style={[styles.chipTxt, { color: c.textMuted }]}>{FILTER_LABELS[k] || k}: </Text>
                      <Text style={[styles.chipTxt, { color: c.text, fontWeight: '600' }]} numberOfLines={1}>{String(v)}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.row}>
                  <View style={styles.notifyRow}>
                    <Ionicons name="notifications-outline" size={16} color={c.textMuted} />
                    <Text style={[styles.notifyTxt, { color: c.textMuted }]}>Yeni ilanda bildirim</Text>
                    <Switch
                      value={item.notifyOnMatch}
                      onValueChange={() => toggleNotify(item)}
                      trackColor={{ false: '#cbd5e1', true: c.primary }}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => applySearch(item)}
                    style={[styles.applyBtn, { backgroundColor: c.primary }]}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="search" size={16} color="#fff" />
                    <Text style={styles.applyTxt}>Aramayı Uygula</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  card: { padding: 16, borderRadius: 14, marginBottom: 12, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardDate: { fontSize: 12, marginTop: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  chip: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, marginRight: 6, marginBottom: 6, maxWidth: '100%' },
  chipTxt: { fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  notifyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  notifyTxt: { fontSize: 12, flex: 1, marginLeft: 6, marginRight: 6 },
  applyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  applyTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
