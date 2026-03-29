import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../../api/client';
import { useTheme } from '../../theme';
import { formatPrice, resolveImageUrl } from '../../lib/format';
import { StatusBadge, SkeletonAuctionCard } from '../../components/ui';
import type { Auction } from '../../types';

type TabKey = 'active' | 'upcoming' | 'ended';

/* ── Pulsating Dot ── */
function PulsatingDot() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.8, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View style={pStyles.container}>
      <Animated.View style={[pStyles.outerDot, { transform: [{ scale: pulse }], opacity: pulse.interpolate({ inputRange: [1, 1.8], outputRange: [0.6, 0] }) }]} />
      <View style={pStyles.innerDot} />
    </View>
  );
}
const pStyles = StyleSheet.create({
  container: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  outerDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff' },
  innerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
});

/* ── Real-time Countdown ── */
function CountdownTimer({ endDate, style }: { endDate: string; style?: any }) {
  const { colors: c } = useTheme();
  const [text, setText] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'warning' | 'danger'>('normal');

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

  const colorMap = { normal: c.success, warning: c.warning, danger: c.error };

  return (
    <View style={[{
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: colorMap[urgency] + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    }, style]}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colorMap[urgency] }} />
      <Text style={{ fontSize: 12, fontWeight: '700', color: colorMap[urgency] }}>{text}</Text>
    </View>
  );
}

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
      setAuctions(data.data || data);
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

  function renderAuction({ item }: { item: Auction }) {
    const imageUri = item.parcel?.images?.[0] ? resolveImageUrl(item.parcel.images[0]) : null;
    const endDate = item.extendedUntil || item.scheduledEnd;
    const isLive = item.status === 'live';
    const scale = useRef(new Animated.Value(1)).current;

    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          style={[styles.card, {
            backgroundColor: c.card,
            borderColor: isLive ? c.statusLive + '25' : c.border,
          }, shadows.md]}
          onPress={() => navigation.navigate('LiveAuction', { id: item.id })}
          activeOpacity={0.85}
          onPressIn={() => Animated.spring(scale, { toValue: 0.97, friction: 8, tension: 100, useNativeDriver: true }).start()}
          onPressOut={() => Animated.spring(scale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }).start()}
        >
          {/* Cover Image */}
          <View style={styles.imageWrap}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={[styles.image, { backgroundColor: isDark ? c.surface : c.skeleton, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="business-outline" size={36} color={c.textMuted} />
              </View>
            )}
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
                  {isLive ? 'Güncel Fiyat' : tab === 'upcoming' ? 'Başlangıç' : 'Son Fiyat'}
                </Text>
                <Text style={[styles.priceVal, { color: c.primary }]}>
                  {formatPrice(item.currentPrice || item.startingPrice)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {/* Bid count */}
                <View style={[styles.metaBadge, { backgroundColor: isDark ? c.surface : c.infoBg }]}>
                  <Ionicons name="hammer-outline" size={13} color={c.textMuted} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: c.textSecondary }}>{item.bidCount}</Text>
                </View>
                {/* Participant count */}
                <View style={[styles.metaBadge, { backgroundColor: isDark ? c.surface : c.infoBg }]}>
                  <Ionicons name="people-outline" size={13} color={c.textMuted} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: c.textSecondary }}>{item.participantCount}</Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.titleBar}>
        <Text style={[styles.screenTitle, { color: c.text }]}>
          İhaleler
        </Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: isDark ? c.surface : c.skeleton }]}>
        {tabItems.map((t) => {
          const sel = tab === t.key;
          return (
            <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} activeOpacity={0.7}
              style={[styles.tab, sel && { backgroundColor: isDark ? c.card : c.surface }]}
            >
              <Ionicons name={t.icon as any} size={14} color={sel ? c.primary : c.textMuted} />
              <Text style={{ fontSize: 14, color: sel ? c.text : c.textMuted, fontWeight: sel ? '700' : '500' }}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

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
          ListEmptyComponent={(
            <View style={styles.empty}>
              <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? c.surface : c.skeleton }]}>
                <Ionicons name="flash-outline" size={36} color={c.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: c.text }]}>
                {tab === 'active' ? 'Aktif ihale yok' : tab === 'upcoming' ? 'Yaklaşan ihale yok' : 'Biten ihale yok'}
              </Text>
              <Text style={{ fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 20 }}>
                {tab === 'active' ? 'Şu an aktif bir ihale bulunmuyor' : tab === 'upcoming' ? 'Yaklaşan ihale planlandığında burada görünecek' : 'Henüz tamamlanmış ihale yok'}
              </Text>
            </View>
          )}
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
