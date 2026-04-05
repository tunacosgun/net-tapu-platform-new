import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  FadeInDown,
  FadeIn,
  interpolateColor,
} from 'react-native-reanimated';
import apiClient from '../../api/client';
import { useTheme } from '../../theme';
import { formatPrice, resolveImageUrl } from '../../lib/format';
import { StatusBadge, SkeletonAuctionCard } from '../../components/ui';
import { SPRING, TIMING } from '../../lib/animations';
import type { Auction } from '../../types';

type TabKey = 'active' | 'upcoming' | 'ended';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/* ── Pulsating Dot ── */
function PulsatingDot() {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.8, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.8], [0.6, 0]),
  }));

  return (
    <View style={pStyles.container}>
      <Animated.View style={[pStyles.outerDot, outerStyle]} />
      <View style={pStyles.innerDot} />
    </View>
  );
}
const pStyles = StyleSheet.create({
  container: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  outerDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff' },
  innerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
});

/* ── Real-time Countdown with animated color ── */
function CountdownTimer({ endDate, style }: { endDate: string; style?: any }) {
  const { colors: c } = useTheme();
  const [text, setText] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'warning' | 'danger'>('normal');
  const colorProgress = useSharedValue(0);

  useEffect(() => {
    const target = urgency === 'danger' ? 2 : urgency === 'warning' ? 1 : 0;
    colorProgress.value = withTiming(target, TIMING.normal);
  }, [urgency, colorProgress]);

  useEffect(() => {
    const tick = () => {
      const ms = new Date(endDate).getTime() - Date.now();
      if (ms <= 0) { setText('Bitti'); setUrgency('normal'); return; }
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      if (d > 0) setText(`${d}g ${h}s ${m}dk`);
      else if (h > 0) setText(`${h}s ${m}dk ${s}sn`);
      else setText(`${m}dk ${s}sn`);
      setUrgency(ms < 3600000 ? 'danger' : ms < 86400000 ? 'warning' : 'normal');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  const dotStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      colorProgress.value,
      [0, 1, 2],
      [c.success, c.warning, c.error],
    ),
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      colorProgress.value,
      [0, 1, 2],
      [c.success, c.warning, c.error],
    ),
  }));

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      colorProgress.value,
      [0, 1, 2],
      [c.success + '15', c.warning + '15', c.error + '15'],
    ),
  }));

  return (
    <Animated.View style={[{
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    }, bgStyle, style]}>
      <Animated.View style={[{ width: 6, height: 6, borderRadius: 3 }, dotStyle]} />
      <Animated.Text style={[{ fontSize: 12, fontWeight: '700' }, textStyle]}>{text}</Animated.Text>
    </Animated.View>
  );
}

/* ── Live Glow Border ── */
function LiveGlowCard({ isLive, borderColor, children, style }: {
  isLive: boolean; borderColor: string; children: React.ReactNode; style: any[];
}) {
  const glowOpacity = useSharedValue(0.25);

  useEffect(() => {
    if (isLive) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 1200 }),
          withTiming(0.25, { duration: 1200 }),
        ),
        -1,
        false,
      );
    }
  }, [isLive, glowOpacity]);

  const glowStyle = useAnimatedStyle(() => {
    if (!isLive) return {};
    return {
      borderColor: borderColor,
      borderWidth: 1.5,
      shadowColor: borderColor,
      shadowOpacity: glowOpacity.value,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 0 },
    };
  });

  return (
    <Animated.View style={[...style, glowStyle]}>
      {children}
    </Animated.View>
  );
}

/* ── Shimmer Image ── */
function ShimmerImage({ uri, fallbackColor, mutedColor }: {
  uri: string | null; fallbackColor: string; mutedColor: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (!loaded && uri) {
      shimmer.value = withRepeat(
        withTiming(1, { duration: 1200 }),
        -1,
        true,
      );
    }
  }, [loaded, uri, shimmer]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: loaded ? 0 : interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  if (!uri) {
    return (
      <View style={[styles.image, { backgroundColor: fallbackColor, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="business-outline" size={36} color={mutedColor} />
      </View>
    );
  }

  return (
    <View>
      <Animated.View style={[styles.image, { backgroundColor: fallbackColor, position: 'absolute', top: 0, left: 0, right: 0 }, shimmerStyle]} />
      <Image
        source={{ uri }}
        style={styles.image}
        resizeMode="cover"
        onLoad={() => { setLoaded(true); shimmer.value = 0; }}
      />
    </View>
  );
}

/* ── Auction Card ── */
function AuctionCard({ item, index, onPress, colors: c, isDark, shadows }: {
  item: Auction; index: number; onPress: () => void;
  colors: any; isDark: boolean; shadows: any;
}) {
  const imageUri = item.parcel?.images?.[0] ? resolveImageUrl(item.parcel.images[0]) : null;
  const endDate = item.extendedUntil || item.scheduledEnd;
  const isLive = item.status === 'live';
  const scale = useSharedValue(1);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.97, SPRING.snappy);
  };
  const onPressOut = () => {
    scale.value = withSpring(1, SPRING.bouncy);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(400).springify().damping(18)}
      style={pressStyle}
    >
      <LiveGlowCard
        isLive={isLive}
        borderColor={c.statusLive}
        style={[styles.card, {
          backgroundColor: c.card,
          borderColor: isLive ? c.statusLive + '25' : c.border,
        }, shadows.md]}
      >
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.85}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
        >
          {/* Cover Image */}
          <View style={styles.imageWrap}>
            <ShimmerImage
              uri={imageUri}
              fallbackColor={isDark ? c.surface : c.skeleton}
              mutedColor={c.textMuted}
            />
            {/* Gradient overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.5)']}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 }}
            />
            {/* Status badge */}
            <View style={styles.imageOverlay}>
              <StatusBadge status={item.status} size="sm" />
            </View>
            {/* CANLI badge with pulsating dot */}
            {isLive && (
              <View style={styles.liveTag}>
                <PulsatingDot />
                <Text style={styles.liveText}>CANLI</Text>
              </View>
            )}
            {/* Timer on image */}
            {endDate && (
              <View style={styles.timerOnImage}>
                <Ionicons name="time-outline" size={12} color="#fff" />
                <CountdownTimer endDate={endDate} style={{ backgroundColor: 'transparent', paddingHorizontal: 0, paddingVertical: 0 }} />
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={2}>
              {item.parcel?.title || item.title || `İhale #${item.id.slice(0, 8)}`}
            </Text>

            {item.parcel?.city && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Ionicons name="location-outline" size={12} color={c.textMuted} />
                <Text style={{ fontSize: 13, color: c.textMuted }}>
                  {item.parcel.city}{item.parcel.district ? `, ${item.parcel.district}` : ''}
                </Text>
              </View>
            )}

            <View style={styles.cardFooter}>
              <View>
                <Text style={[styles.priceLabel, { color: c.textMuted }]}>
                  {isLive ? 'Güncel Fiyat' : item.status === 'scheduled' ? 'Başlangıç' : 'Son Fiyat'}
                </Text>
                <Text style={[styles.priceVal, { color: c.primary }]}>
                  {formatPrice(item.currentPrice || item.startingPrice)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.metaBadge, { backgroundColor: isDark ? c.surface : c.infoBg }]}>
                  <Ionicons name="hammer-outline" size={13} color={c.textMuted} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: c.textSecondary }}>{item.bidCount}</Text>
                </View>
                <View style={[styles.metaBadge, { backgroundColor: isDark ? c.surface : c.infoBg }]}>
                  <Ionicons name="people-outline" size={13} color={c.textMuted} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: c.textSecondary }}>{item.participantCount}</Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </LiveGlowCard>
    </Animated.View>
  );
}

/* ── Empty State with spring bounce ── */
function EmptyState({ tab, colors: c, isDark }: { tab: TabKey; colors: any; isDark: boolean }) {
  return (
    <View style={styles.empty}>
      <Animated.View
        entering={FadeIn.delay(100).springify().damping(10).stiffness(120)}
        style={[styles.emptyIconWrap, { backgroundColor: isDark ? c.surface : c.skeleton }]}
      >
        <Ionicons name="flash-outline" size={36} color={c.textMuted} />
      </Animated.View>
      <Animated.Text
        entering={FadeInDown.delay(200).duration(400)}
        style={[styles.emptyTitle, { color: c.text }]}
      >
        {tab === 'active' ? 'Aktif ihale yok' : tab === 'upcoming' ? 'Yaklaşan ihale yok' : 'Biten ihale yok'}
      </Animated.Text>
      <Animated.Text
        entering={FadeInDown.delay(300).duration(400)}
        style={{ fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 20 }}
      >
        {tab === 'active' ? 'Şu an aktif bir ihale bulunmuyor' : tab === 'upcoming' ? 'Yaklaşan ihale planlandığında burada görünecek' : 'Henüz tamamlanmış ihale yok'}
      </Animated.Text>
    </View>
  );
}

/* ── Tab Bar with sliding indicator ── */
const SCREEN_WIDTH = Dimensions.get('window').width;
const TAB_BAR_WIDTH = SCREEN_WIDTH - 40;
const TAB_WIDTH = TAB_BAR_WIDTH / 3;

function TabBar({ tabItems, tab, setTab, colors: c, isDark }: {
  tabItems: { key: TabKey; label: string; icon: string }[];
  tab: TabKey; setTab: (k: TabKey) => void; colors: any; isDark: boolean;
}) {
  const tabIndex = tabItems.findIndex((t) => t.key === tab);
  const indicatorX = useSharedValue(tabIndex * TAB_WIDTH);

  useEffect(() => {
    indicatorX.value = withSpring(tabIndex * TAB_WIDTH, SPRING.snappy);
  }, [tabIndex, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: TAB_WIDTH,
  }));

  return (
    <View style={[styles.tabBar, { backgroundColor: isDark ? c.surface : c.skeleton }]}>
      <Animated.View
        style={[{
          position: 'absolute', top: 4, bottom: 4, borderRadius: 10,
          backgroundColor: isDark ? c.card : c.surface,
        }, indicatorStyle]}
      />
      {tabItems.map((t) => {
        const sel = tab === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            activeOpacity={0.7}
            style={styles.tab}
          >
            <Ionicons name={t.icon as any} size={14} color={sel ? c.primary : c.textMuted} />
            <Text style={{ fontSize: 14, color: sel ? c.text : c.textMuted, fontWeight: sel ? '700' : '500' }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ── Main Screen ── */
export default function AuctionsListScreen() {
  const navigation = useNavigation<any>();
  const { colors: c, isDark, shadows, borderRadius: br, spacing: sp } = useTheme();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [tab, setTab] = useState<TabKey>('active');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAuctions = useCallback(async () => {
    try {
      const statusMap: Record<TabKey, string> = { active: 'live', upcoming: 'scheduled', ended: 'settled' };
      const { data } = await apiClient.get('/auctions', { params: { status: statusMap[tab], limit: 50 } });
      const items = data?.data || data;
      setAuctions(Array.isArray(items) ? items : []);
    } catch { /* silently fail */ }
    setLoading(false);
  }, [tab]);

  useEffect(() => { setLoading(true); fetchAuctions(); }, [fetchAuctions]);
  const onRefresh = async () => { setRefreshing(true); await fetchAuctions(); setRefreshing(false); };

  const tabItems: { key: TabKey; label: string; icon: string }[] = [
    { key: 'active', label: 'Canlı', icon: 'flash' },
    { key: 'upcoming', label: 'Yaklaşan', icon: 'time-outline' },
    { key: 'ended', label: 'Biten', icon: 'checkmark-circle-outline' },
  ];

  const renderAuction = useCallback(({ item, index }: { item: Auction; index: number }) => (
    <AuctionCard
      item={item}
      index={index}
      onPress={() => navigation.navigate('LiveAuction', { id: item.id })}
      colors={c}
      isDark={isDark}
      shadows={shadows}
    />
  ), [c, isDark, shadows, navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.titleBar}>
        <Text style={[styles.screenTitle, { color: c.text }]}>
          İhaleler
        </Text>
      </View>

      {/* Tabs */}
      <TabBar tabItems={tabItems} tab={tab} setTab={setTab} colors={c} isDark={isDark} />

      {loading ? (
        <View style={{ padding: 20 }}>
          <SkeletonAuctionCard />
          <SkeletonAuctionCard />
          <SkeletonAuctionCard />
        </View>
      ) : (
        <FlatList
          data={auctions}
          renderItem={renderAuction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState tab={tab} colors={c} isDark={isDark} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  titleBar: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  screenTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },

  tabBar: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 8, borderRadius: 14, padding: 4,
    position: 'relative',
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10, gap: 5,
  },

  card: {
    borderRadius: 20, overflow: 'hidden', borderWidth: 1,
  },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 200 },
  imageOverlay: { position: 'absolute', top: 14, left: 14 },
  liveTag: {
    position: 'absolute', top: 14, right: 14, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#dc2626', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, gap: 4,
  },
  liveText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  timerOnImage: {
    position: 'absolute', bottom: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },

  cardContent: { padding: 18 },
  cardTitle: { fontSize: 17, fontWeight: '700', lineHeight: 22, letterSpacing: -0.2 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14 },
  priceLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  priceVal: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },

  metaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8,
  },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
});
