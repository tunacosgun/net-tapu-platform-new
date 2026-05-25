import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  FadeInUp, FadeIn, SlideInLeft, useAnimatedProps,
  interpolateColor, interpolate, Layout,
} from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import apiClient from '../../api/client';
import { useTheme } from '../../theme';
import { ParcelCard } from '../../components/parcel/ParcelCard';
import { ParcelFilterSheet, type ParcelFilters } from '../../components/parcel/ParcelFilterSheet';
import { SPRING } from '../../lib/animations';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import type { Parcel, PaginatedResponse } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SortOption = 'newest' | 'price_asc' | 'price_desc';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

function AnimatedListItem({ children, index }: { children: React.ReactNode; index: number }) {
  return (
    <Animated.View entering={FadeInUp.delay(index * 50).springify().damping(18).stiffness(200)}>
      {children}
    </Animated.View>
  );
}

function SortChipBar({
  options,
  active,
  onSelect,
  colors,
  isDark,
}: {
  options: { key: SortOption; label: string }[];
  active: SortOption;
  onSelect: (k: SortOption) => void;
  colors: any;
  isDark: boolean;
}) {
  const underlineX = useSharedValue(0);
  const chipWidths = useRef<number[]>([]);
  const chipOffsets = useRef<number[]>([]);

  useEffect(() => {
    const idx = options.findIndex((o) => o.key === active);
    if (chipOffsets.current[idx] !== undefined) {
      underlineX.value = withSpring(chipOffsets.current[idx], SPRING.snappy);
    }
  }, [active]);

  const underlineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: underlineX.value }],
  }));

  return (
    <View style={styles.sortRow}>
      {options.map((opt, i) => {
        const isActive = active === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onSelect(opt.key)}
            activeOpacity={0.7}
            onLayout={(e) => {
              chipWidths.current[i] = e.nativeEvent.layout.width;
              chipOffsets.current[i] = e.nativeEvent.layout.x;
              // update position if this is the active chip
              if (isActive) {
                underlineX.value = withSpring(e.nativeEvent.layout.x, SPRING.snappy);
              }
            }}
            style={[styles.sortChip, {
              backgroundColor: isActive ? (colors.primaryBg) : 'transparent',
              borderColor: isActive ? colors.primary : (isDark ? colors.borderLight : colors.border),
            }]}
          >
            <Text style={[styles.sortChipText, {
              color: isActive ? colors.primary : colors.textSecondary,
              fontWeight: isActive ? '700' : '400',
            }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MapButton({ onPress, colors, isDark }: { onPress: () => void; colors: any; isDark: boolean }) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.92, SPRING.snappy); }}
        onPressOut={() => { scale.value = withSpring(1, SPRING.snappy); }}
        style={[styles.mapButton, {
          backgroundColor: isDark ? colors.surface : '#fff',
          shadowColor: isDark ? '#000' : '#94a3b8',
        }]}
        activeOpacity={0.7}
      >
        <Ionicons name="navigate-outline" size={16} color={colors.primary} />
        <Text style={[styles.mapButtonText, { color: colors.primary }]}>Harita</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ParcelsListScreen() {
  const navigation = useNavigation<Nav>();
  const theme = useTheme();
  const isDark = theme.isDark;
  const c = theme.colors;
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [filters, setFilters] = useState<ParcelFilters>({});
  const [filterOpen, setFilterOpen] = useState(false);

  // Search bar focus animation
  const searchFocus = useSharedValue(0);

  const searchBarAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: interpolate(searchFocus.value, [0, 1], [1, 1.02]) }],
    borderWidth: interpolate(searchFocus.value, [0, 1], [0, 1.5]),
    borderColor: interpolateColor(searchFocus.value, [0, 1], ['transparent', c.primary]),
  }));

  const sortConfig: Record<SortOption, { sortBy: string; sortOrder: string; label: string; icon: string }> = {
    newest: { sortBy: 'createdAt', sortOrder: 'DESC', label: 'En Yeni', icon: 'time-outline' },
    price_asc: { sortBy: 'price', sortOrder: 'ASC', label: 'Fiyat \u2191', icon: 'trending-up-outline' },
    price_desc: { sortBy: 'price', sortOrder: 'DESC', label: 'Fiyat \u2193', icon: 'trending-down-outline' },
  };

  const fetchParcels = useCallback(async (p: number, reset = false) => {
    setLoading(true);
    try {
      const sc = sortConfig[sort];
      const params: Record<string, any> = {
        page: p, limit: 12, status: 'active', sortBy: sc.sortBy, sortOrder: sc.sortOrder,
      };
      if (search) params.search = search;
      // Apply filters
      for (const [k, v] of Object.entries(filters)) {
        if (v && String(v).trim()) params[k] = v;
      }
      const { data } = await apiClient.get<PaginatedResponse<Parcel>>('/parcels', { params });
      setParcels((prev) => reset ? data.data : [...prev, ...data.data]);
      setTotalPages(data.meta.totalPages);
      if (!hasLoaded) setHasLoaded(true);
    } catch {} finally { setLoading(false); }
  }, [search, sort, filters]);

  useEffect(() => { setPage(1); fetchParcels(1, true); }, [fetchParcels]);

  function loadMore() {
    if (page < totalPages && !loading) {
      const next = page + 1;
      setPage(next);
      fetchParcels(next);
    }
  }

  function handleSearch() {
    setSearch(searchInput);
    setPage(1);
  }

  const sortOptions = (Object.keys(sortConfig) as SortOption[]).map((key) => ({
    key, label: sortConfig[key].label,
  }));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      {/* Header */}
      <Animated.View entering={SlideInLeft.duration(400).springify().damping(20)} style={styles.titleBar}>
        <Text style={[styles.screenTitle, { color: c.text }]}>İlanlar</Text>
        <MapButton onPress={() => navigation.navigate('ParcelMap')} colors={c} isDark={isDark} />
      </Animated.View>

      {/* Search */}
      <View style={[styles.searchSection, { flexDirection: 'row', alignItems: 'center' }]}>
        <Animated.View style={[
          styles.searchBar,
          { flex: 1, backgroundColor: isDark ? c.surface : '#fff', shadowColor: isDark ? '#000' : '#94a3b8' },
          searchBarAnimStyle,
        ]}>
          <Ionicons name="search-outline" size={18} color={c.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            placeholder="İl, ilçe veya ilan ara..."
            placeholderTextColor={c.textMuted}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            onFocus={() => { searchFocus.value = withSpring(1, SPRING.smooth); }}
            onBlur={() => { searchFocus.value = withSpring(0, SPRING.smooth); }}
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchInput(''); setSearch(''); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={c.textMuted} />
            </TouchableOpacity>
          )}
        </Animated.View>
        <TouchableOpacity
          onPress={() => setFilterOpen(true)}
          activeOpacity={0.7}
          style={{
            marginLeft: 10,
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: isDark ? c.surface : '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Ionicons name="options-outline" size={22} color={c.text} />
          {Object.values(filters).filter((v) => v && String(v).trim()).length > 0 && (
            <View style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: c.primary,
            }} />
          )}
        </TouchableOpacity>
      </View>

      <ParcelFilterSheet
        visible={filterOpen}
        initial={filters}
        onClose={() => setFilterOpen(false)}
        onApply={(f) => { setFilters(f); setPage(1); }}
      />

      {/* Sort */}
      <SortChipBar options={sortOptions} active={sort} onSelect={setSort} colors={c} isDark={isDark} />

      <FlashList
        data={parcels}
        estimatedItemSize={200}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={hasLoaded && page === 1 ? index : 0}>
            <View style={{ paddingHorizontal: 20 }}>
              <ParcelCard parcel={item} onPress={() => navigation.navigate('ParcelDetail', { id: item.id })} />
            </View>
          </AnimatedListItem>
        )}
        keyExtractor={(item) => item.id}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        ListFooterComponent={loading ? <ActivityIndicator style={{ padding: 20 }} color={c.primary} /> : null}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}>
            <Animated.View
              entering={FadeIn.springify().damping(16).stiffness(140)}
              style={[styles.emptyIconWrap, { backgroundColor: isDark ? c.surface : '#f8fafc' }]}
            >
              <Ionicons name="search-outline" size={36} color={c.textMuted} />
            </Animated.View>
            <Animated.Text
              entering={FadeIn.delay(100).springify().damping(16)}
              style={[styles.emptyTitle, { color: c.text }]}
            >
              İlan bulunamadı
            </Animated.Text>
            <Animated.Text
              entering={FadeIn.delay(200).springify().damping(16)}
              style={[styles.emptyDesc, { color: c.textSecondary }]}
            >
              Farklı arama kriterleri deneyebilirsiniz
            </Animated.Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  titleBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12,
  },
  screenTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  mapButton: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  mapButtonText: { fontSize: 14, fontWeight: '500' },
  searchSection: { paddingHorizontal: 20, marginBottom: 12 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    paddingHorizontal: 14, height: 48, gap: 10,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '400', padding: 0 },
  sortRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  sortChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, borderWidth: 1,
  },
  sortChipText: { fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 12 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptyDesc: { fontSize: 14, fontWeight: '400', textAlign: 'center', lineHeight: 20 },
});
