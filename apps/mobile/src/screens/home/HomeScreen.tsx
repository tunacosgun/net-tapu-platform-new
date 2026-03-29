import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions, Image, Animated, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../../api/client';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../stores/auth-store';
import { formatPrice, resolveImageUrl } from '../../lib/format';
import { StatusBadge, SkeletonParcelCard, SkeletonAuctionCard } from '../../components/ui';
import { ParcelCard } from '../../components/parcel/ParcelCard';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import type { Parcel, Auction, PaginatedResponse } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width: SCREEN_W } = Dimensions.get('window');

/* ── Pulsating Live Dot ── */
function PulsatingDot({ color = '#fff' }: { color?: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 2, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);
  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: color,
        transform: [{ scale: pulse }],
        opacity: pulse.interpolate({ inputRange: [1, 2], outputRange: [0.5, 0] }),
      }} />
      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color }} />
    </View>
  );
}

/* ── Countdown Timer Hook ── */
function useCountdown(endDate: string | null | undefined) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!endDate) return;
    const tick = () => {
      const ms = new Date(endDate).getTime() - Date.now();
      if (ms <= 0) { setTimeLeft('Bitti'); return; }
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      if (d > 0) setTimeLeft(`${d}g ${h}s ${m}dk`);
      else if (h > 0) setTimeLeft(`${h}s ${m}dk ${s}sn`);
      else setTimeLeft(`${m}dk ${s}sn`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);
  return timeLeft;
}

/* ── Live Auction Card ── */
function LiveAuctionCard({ auction, onPress }: { auction: Auction; onPress: () => void }) {
  const { colors: c, isDark, shadows, borderRadius: br } = useTheme();
  const endDate = auction.extendedUntil || auction.scheduledEnd;
  const timeLeft = useCountdown(endDate);
  const imageUri = auction.parcel?.images?.[0] ? resolveImageUrl(auction.parcel.images[0]) : null;
  const isLive = auction.status === 'live';
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        onPressIn={() => Animated.spring(scale, { toValue: 0.96, friction: 8, tension: 100, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }).start()}
        style={[{
          width: SCREEN_W * 0.78,
          borderRadius: br.lg,
          overflow: 'hidden',
          backgroundColor: c.card,
          borderWidth: 1,
          borderColor: isLive ? c.statusLive + '30' : c.border,
        }, shadows.md]}
      >
        {/* Cover Image */}
        <View style={{ height: 160, position: 'relative' }}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? c.surface : c.skeleton }}>
              <Ionicons name="business-outline" size={36} color={c.textMuted} />
            </View>
          )}
          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 }}
          />
          {/* CANLI Badge */}
          {isLive && (
            <View style={{
              position: 'absolute', top: 12, left: 12,
              flexDirection: 'row', alignItems: 'center', gap: 5,
              backgroundColor: c.statusLive, paddingHorizontal: 10, paddingVertical: 5,
              borderRadius: br.xs,
            }}>
              <PulsatingDot />
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }}>CANLI</Text>
            </View>
          )}
          {/* Timer */}
          {timeLeft ? (
            <View style={{
              position: 'absolute', bottom: 12, left: 12,
              flexDirection: 'row', alignItems: 'center', gap: 5,
              backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5,
              borderRadius: br.xs,
            }}>
              <Ionicons name="time-outline" size={12} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{timeLeft}</Text>
            </View>
          ) : null}
          {/* Bid count */}
          <View style={{
            position: 'absolute', bottom: 12, right: 12,
            flexDirection: 'row', alignItems: 'center', gap: 4,
            backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 5,
            borderRadius: br.xs,
          }}>
            <Ionicons name="hammer-outline" size={11} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{auction.bidCount}</Text>
          </View>
        </View>
        {/* Content */}
        <View style={{ padding: 14, gap: 6 }}>
          <Text style={{ color: c.text, fontSize: 15, fontWeight: '700', letterSpacing: -0.2 }} numberOfLines={1}>
            {auction.parcel?.title || auction.title || `İhale #${auction.id.slice(0, 8)}`}
          </Text>
          {auction.parcel?.city && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="location-outline" size={12} color={c.textMuted} />
              <Text style={{ color: c.textMuted, fontSize: 12 }}>
                {auction.parcel.city}{auction.parcel.district ? `, ${auction.parcel.district}` : ''}
              </Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
            <View>
              <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {isLive ? 'Güncel Fiyat' : 'Başlangıç'}
              </Text>
              <Text style={{ color: c.primary, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 }}>
                {formatPrice(auction.currentPrice || auction.startingPrice)}
              </Text>
            </View>
            <StatusBadge status={auction.status} size="sm" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ── Section Header ── */
function SectionHeader({ title, desc, onSeeAll, live }: {
  title: string; desc?: string; onSeeAll?: () => void; live?: boolean;
}) {
  const { colors: c, borderRadius: br } = useTheme();
  return (
    <View style={S.sectionHeader}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[S.sectionTitle, { color: c.text }]}>{title}</Text>
          {live && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              backgroundColor: c.statusLive, paddingHorizontal: 8, paddingVertical: 4, borderRadius: br.xs,
            }}>
              <PulsatingDot />
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.6 }}>CANLI</Text>
            </View>
          )}
        </View>
        {desc && <Text style={[S.sectionDesc, { color: c.textMuted }]}>{desc}</Text>}
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: c.primary }}>Tümünü Gör</Text>
            <Ionicons name="chevron-forward" size={13} color={c.primary} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ── Main HomeScreen ── */
export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors: c, isDark, shadows, spacing: sp, borderRadius: br, typography: typo } = useTheme();
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<{ firstName?: string; lastName?: string } | null>(null);
  const [featured, setFeatured] = useState<Parcel[]>([]);
  const [latest, setLatest] = useState<Parcel[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [stats, setStats] = useState({ parcels: 0, auctions: 0, cities: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const bodyAnim = useRef(new Animated.Value(0)).current;
  const bodySlide = useRef(new Animated.Value(24)).current;

  const fetchData = useCallback(async () => {
    try {
      const [featuredRes, latestRes, auctionRes, profileRes] = await Promise.all([
        apiClient.get<PaginatedResponse<Parcel>>('/parcels', { params: { isFeatured: true, limit: 6, status: 'active' } }),
        apiClient.get<PaginatedResponse<Parcel>>('/parcels', { params: { limit: 6, sortBy: 'createdAt', sortOrder: 'DESC', status: 'active' } }),
        apiClient.get<PaginatedResponse<Auction>>('/auctions', { params: { limit: 5 } }).catch(() => ({ data: { data: [], total: 0 } })),
        apiClient.get('/auth/me').catch(() => ({ data: null })),
      ]);
      setFeatured(featuredRes.data.data);
      setLatest(latestRes.data.data);
      const allAuctions = (auctionRes.data as any).data || [];
      setAuctions(allAuctions.filter((a: Auction) => ['live', 'scheduled', 'deposit_open'].includes(a.status)));
      const totalParcels = (featuredRes.data as any).total || featuredRes.data.data.length;
      const totalAuctions = (auctionRes.data as any).total || allAuctions.length;
      const cities = new Set([...featuredRes.data.data, ...latestRes.data.data].map((p: Parcel) => p.city).filter(Boolean));
      setStats({ parcels: totalParcels, auctions: totalAuctions, cities: cities.size });
      if (profileRes.data) setProfile(profileRes.data);
    } catch { /* silently fail */ }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await fetchData();
      if (cancelled) return;
      setLoading(false);
      Animated.sequence([
        Animated.timing(heroAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(bodyAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(bodySlide, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        ]),
      ]).start();
    }
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }

  const userName = profile?.firstName
    ? `${profile.firstName} ${profile.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'Kullanıcı';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 6) return 'İyi geceler';
    if (h < 12) return 'Günaydın';
    if (h < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── HERO with Gradient ── */}
        <Animated.View style={{ opacity: heroAnim }}>
          <LinearGradient
            colors={isDark ? [c.primaryDark, '#052e16', c.background] : [c.primary, c.primaryDark, c.background]}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={{ paddingTop: 8, paddingBottom: sp.sectionGap }}
          >
            {/* Header Row */}
            <View style={S.header}>
              <View style={S.headerLeft}>
                <TouchableOpacity onPress={() => navigation.navigate('Profile' as any)} activeOpacity={0.8}>
                  <LinearGradient
                    colors={[c.primaryLight, c.primary]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={[S.avatar, { borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1.5 }]}
                  >
                    <Text style={S.avatarLetter}>{userName.charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={[S.greeting, { color: 'rgba(255,255,255,0.7)' }]}>{getGreeting()} {'\uD83D\uDC4B'}</Text>
                  <Text style={[S.userName, { color: c.textInverse }]} numberOfLines={1}>{userName}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Notifications')}
                activeOpacity={0.7}
                style={[S.iconBtn, { backgroundColor: 'rgba(255,255,255,0.12)' }]}
              >
                <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.9)" />
                <View style={[S.notifDot, { borderColor: c.primary }]} />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Main', { screen: 'Parcels' } as any)}
              style={[S.searchBar, {
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderColor: 'rgba(255,255,255,0.08)',
              }]}
            >
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" />
              <Text style={{ flex: 1, color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                İl, ilçe veya ada/parsel ara...
              </Text>
              <View style={{
                width: 34, height: 34, borderRadius: br.xs,
                backgroundColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="options-outline" size={16} color="rgba(255,255,255,0.7)" />
              </View>
            </TouchableOpacity>

            {/* Hero Text */}
            <View style={{ paddingHorizontal: sp.screenPadding, marginTop: sp.lg }}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5,
                borderRadius: br.full, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 14,
              }}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: c.primaryLight }} />
                <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' }}>
                  Türkiye'nin Arsa Platformu
                </Text>
              </View>
              <Text style={{
                fontSize: 30, fontWeight: '800', letterSpacing: -0.8, lineHeight: 36,
                color: c.textInverse, marginBottom: 8,
              }}>
                Hayalinizdeki{'\n'}arsayı bulun.
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.6)', lineHeight: 18 }}>
                {stats.parcels > 0
                  ? `${stats.parcels} aktif ilan · ${stats.cities > 0 ? `${stats.cities} şehir` : 'Türkiye geneli'}`
                  : 'Güvenilir emlak yatırımları'}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── BODY ── */}
        <Animated.View style={{ opacity: bodyAnim, transform: [{ translateY: bodySlide }], marginTop: -sp.base }}>

          {/* Quick Actions */}
          <View style={S.actionsRow}>
            {([
              { label: 'İlanlar', icon: 'layers-outline' as const, onPress: () => navigation.navigate('Main', { screen: 'Parcels' } as any), bgColor: isDark ? c.primaryBg : c.primaryBg },
              { label: 'İhaleler', icon: 'flash-outline' as const, onPress: () => navigation.navigate('Main', { screen: 'Auctions' } as any), bgColor: isDark ? c.warningBg : c.warningBg },
              { label: 'Favoriler', icon: 'heart-outline' as const, onPress: () => navigation.navigate('Favorites'), bgColor: isDark ? c.errorBg : c.errorBg },
              { label: 'Harita', icon: 'map-outline' as const, onPress: () => navigation.navigate('ParcelMap'), bgColor: isDark ? c.infoBg : c.infoBg },
            ]).map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={item.onPress}
                activeOpacity={0.7}
                style={[S.actionItem, { backgroundColor: c.card, borderColor: c.border }, shadows.sm]}
              >
                <View style={[S.actionIcon, { backgroundColor: item.bgColor }]}>
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={
                      item.label === 'İlanlar' ? c.primary :
                      item.label === 'İhaleler' ? c.warning :
                      item.label === 'Favoriler' ? c.error :
                      c.info
                    }
                  />
                </View>
                <Text style={{ fontSize: 11, fontWeight: '600', color: c.textSecondary, marginTop: 6 }}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Stats Bar */}
          <View style={[S.statsBar, { backgroundColor: c.card, borderColor: c.border }, shadows.sm]}>
            {([
              { label: 'Aktif İlan', value: stats.parcels, icon: 'layers-outline' as const, color: c.primary },
              { label: 'Canlı İhale', value: stats.auctions, icon: 'flash-outline' as const, color: c.warning },
              { label: 'Farklı İl', value: stats.cities, icon: 'location-outline' as const, color: c.info },
            ]).map((s, i, arr) => (
              <View key={s.label} style={[S.statItem, i < arr.length - 1 && { borderRightWidth: 1, borderRightColor: c.borderLight }]}>
                <Ionicons name={s.icon} size={16} color={s.color} />
                <Text style={{ fontSize: 20, fontWeight: '800', color: c.text, letterSpacing: -0.5 }}>{s.value}</Text>
                <Text style={{ fontSize: 10, fontWeight: '500', color: c.textMuted }}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Canlı İhaleler ── */}
          {loading ? (
            <View style={{ paddingHorizontal: sp.screenPadding, marginBottom: sp.sectionGap }}>
              <SkeletonAuctionCard />
            </View>
          ) : auctions.length > 0 ? (
            <View style={{ marginBottom: sp.sectionGap }}>
              <SectionHeader
                title="Canlı İhaleler"
                desc="Aktif açık artırmalar"
                live
                onSeeAll={() => navigation.navigate('Main', { screen: 'Auctions' } as any)}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: sp.screenPadding, gap: 14 }}
                decelerationRate="fast"
                snapToInterval={SCREEN_W * 0.78 + 14}
                snapToAlignment="start"
              >
                {auctions.map((a) => (
                  <LiveAuctionCard
                    key={a.id}
                    auction={a}
                    onPress={() => navigation.navigate('LiveAuction', { id: a.id })}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* ── Öne Çıkan Arsalar ── */}
          {loading ? (
            <View style={{ paddingHorizontal: sp.screenPadding, marginBottom: sp.sectionGap }}>
              <SkeletonParcelCard />
            </View>
          ) : featured.length > 0 ? (
            <View style={{ marginBottom: sp.sectionGap }}>
              <SectionHeader
                title="Öne Çıkan Arsalar"
                desc="Editör seçimi premium araziler"
                onSeeAll={() => navigation.navigate('Main', { screen: 'Parcels' } as any)}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: sp.screenPadding, gap: 12 }}
                decelerationRate="fast"
                snapToInterval={SCREEN_W * 0.72 + 12}
                snapToAlignment="start"
              >
                {featured.map((item) => (
                  <View key={item.id} style={{ width: SCREEN_W * 0.72 }}>
                    <ParcelCard parcel={item} onPress={() => navigation.navigate('ParcelDetail', { id: item.id })} />
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* ── Son Eklenen Arsalar ── */}
          {loading ? (
            <View style={{ paddingHorizontal: sp.screenPadding, marginBottom: sp.sectionGap }}>
              <SkeletonParcelCard />
              <SkeletonParcelCard />
            </View>
          ) : latest.length > 0 ? (
            <View style={{ marginBottom: sp.sectionGap }}>
              <SectionHeader title="Son Eklenen Arsalar" desc="Yeni eklenen arazi ilanları" />
              <View style={{ paddingHorizontal: sp.screenPadding }}>
                {latest.map((p) => (
                  <ParcelCard key={p.id} parcel={p} onPress={() => navigation.navigate('ParcelDetail', { id: p.id })} compact />
                ))}
              </View>
            </View>
          ) : null}

          {/* ── Trust Strip ── */}
          <View style={[S.trustStrip, { borderTopColor: c.border }]}>
            {([
              { icon: 'shield-checkmark-outline' as const, label: 'Güvenli Ödeme' },
              { icon: 'document-text-outline' as const, label: 'Resmi Tapu' },
              { icon: 'headset-outline' as const, label: '7/24 Destek' },
            ]).map((item) => (
              <View key={item.label} style={{ alignItems: 'center', gap: 6 }}>
                <Ionicons name={item.icon} size={18} color={c.textMuted} />
                <Text style={{ fontSize: 10.5, fontWeight: '600', color: c.textMuted, letterSpacing: 0.2 }}>{item.label}</Text>
              </View>
            ))}
          </View>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─────────── STYLES ─────────── */
const PX = 20;

const S = StyleSheet.create({
  /* Header */
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: PX, paddingTop: 8, paddingBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 17, fontWeight: '700', color: '#fff' },
  greeting: { fontSize: 12, fontWeight: '500', marginBottom: 1 },
  userName: { fontSize: 17, fontWeight: '700', letterSpacing: -0.4 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute', top: 9, right: 9,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#ef4444', borderWidth: 2,
  },

  /* Search */
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 48, borderRadius: 12, paddingHorizontal: 14,
    marginHorizontal: PX, borderWidth: 1,
  },

  /* Quick Actions */
  actionsRow: {
    flexDirection: 'row', paddingHorizontal: PX, gap: 10, marginBottom: 16,
  },
  actionItem: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: 16, borderWidth: 1,
  },
  actionIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Stats */
  statsBar: {
    flexDirection: 'row', marginHorizontal: PX, borderRadius: 16,
    borderWidth: 1, marginBottom: 28, overflow: 'hidden',
  },
  statItem: {
    flex: 1, alignItems: 'center', paddingVertical: 16, gap: 4,
  },

  /* Section headers */
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: PX, marginBottom: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  sectionDesc: { fontSize: 12, fontWeight: '400', marginTop: 2 },

  /* Trust strip */
  trustStrip: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 24, marginHorizontal: PX, marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
