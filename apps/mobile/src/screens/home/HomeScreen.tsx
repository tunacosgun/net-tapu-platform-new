import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions, Image, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withDelay, withSequence, withRepeat, interpolate,
  FadeInDown, FadeIn,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../../api/client';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../stores/auth-store';
import { formatPrice, resolveImageUrl } from '../../lib/format';
import { StatusBadge, SkeletonParcelCard } from '../../components/ui';
import { ParcelCard } from '../../components/parcel/ParcelCard';
import { SPRING } from '../../lib/animations';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import type { Parcel, Auction, PaginatedResponse } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width: SCREEN_W } = Dimensions.get('window');
const FLOAT = 16;

/* ── Pulsating Live Dot ── */
function PulsatingDot({ color = '#fff' }: { color?: string }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(2, { duration: 900 }),
        withTiming(1, { duration: 900 }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 2], [0.5, 0]),
  }));

  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{
        position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: color,
      }, pulseStyle]} />
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
  const scale = useSharedValue(1);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={scaleStyle}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        onPressIn={() => { scale.value = withSpring(0.96, SPRING.snappy); }}
        onPressOut={() => { scale.value = withSpring(1, SPRING.bouncy); }}
        style={[{
          width: SCREEN_W * 0.78,
          borderRadius: Platform.select({ ios: 14, default: br.lg }),
          overflow: 'hidden',
          backgroundColor: c.card,
          borderWidth: 1,
          borderColor: isLive ? c.statusLive + '30' : c.border,
        }, shadows.md]}
      >
        {/* Cover Image */}
        <View style={{ height: 176, position: 'relative' }}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? c.surface : c.skeleton }}>
              <Ionicons name="business-outline" size={36} color={c.textMuted} />
            </View>
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.12)', 'transparent', 'rgba(0,0,0,0.65)']}
            locations={[0, 0.45, 1]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          {isLive && (
            <View style={{
              position: 'absolute', top: 14, left: 14,
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: c.statusLive, paddingHorizontal: 12, paddingVertical: 6,
              borderRadius: br.md,
              ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6 }, default: { elevation: 4 } }),
            }}>
              <PulsatingDot />
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>CANLI</Text>
            </View>
          )}
          {timeLeft ? (
            <View style={{
              position: 'absolute', bottom: 14, left: 14,
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 12, paddingVertical: 6,
              borderRadius: br.md,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: 'rgba(255,255,255,0.15)',
            }}>
              <Ionicons name="time-outline" size={14} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{timeLeft}</Text>
            </View>
          ) : null}
          <View style={{
            position: 'absolute', bottom: 14, right: 14,
            flexDirection: 'row', alignItems: 'center', gap: 5,
            backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 6,
            borderRadius: br.md,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: 'rgba(255,255,255,0.15)',
          }}>
            <Ionicons name="hammer-outline" size={13} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{auction.bidCount} teklif</Text>
          </View>
        </View>
        {/* Content */}
        <View style={{ padding: 16, gap: 8 }}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', letterSpacing: -0.3 }} numberOfLines={2}>
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

/* ── Stats strip (uses API totals) ── */
function formatStatNum(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 10000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  if (n >= 1000) return n.toLocaleString('tr-TR');
  return `${n}`;
}

function SpotlightParcelCard({ parcel, onPress }: { parcel: Parcel; onPress: () => void }) {
  const { colors: c, isDark, typography: typo } = useTheme();
  const cover = parcel.images?.find((i) => i.isCover) || parcel.images?.[0];
  const uri = cover ? resolveImageUrl(cover) : null;
  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={[
        S.spotlightOuter,
        {
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
          ...Platform.select({
            ios: {
              shadowColor: '#121210',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: isDark ? 0.45 : 0.12,
              shadowRadius: 24,
            },
            default: { elevation: 6 },
          }),
        },
      ]}
    >
      <View style={[S.spotlightInner, { backgroundColor: c.card }]}>
        {uri ? (
          <Image source={{ uri }} style={S.spotlightImage} resizeMode="cover" />
        ) : (
          <View style={[S.spotlightImage, { backgroundColor: isDark ? c.surface : c.skeleton, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="image-outline" size={40} color={c.textMuted} />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(15,23,42,0.2)', 'rgba(15,23,42,0.88)']}
          locations={[0, 0.5, 1]}
          style={S.spotlightGradient}
        />
        <View style={S.spotlightCopy}>
          <View style={[S.spotlightBadge, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <Ionicons name="star" size={12} color="#fbbf24" />
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }}>ÖNE ÇIKAN</Text>
          </View>
          <Text style={[typo.h3, { color: '#fff', marginTop: 10, lineHeight: 24, letterSpacing: -0.4 }]} numberOfLines={2}>
            {parcel.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <Text style={[typo.price, { color: '#fff', fontSize: 20 }]}>{formatPrice(parcel.price)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' }}>İncele</Text>
              <Ionicons name="arrow-forward-circle" size={22} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function HomeStatsStrip({
  parcels, auctions, cities, loading,
}: { parcels: number; auctions: number; cities: number; loading: boolean }) {
  const { colors: c, isDark, typography: typo, borderRadius: br } = useTheme();
  if (loading) {
    return (
      <View style={[S.statsStrip, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.72)' }]}>
        <View style={{ flex: 1, height: 36, backgroundColor: isDark ? c.elevated : c.skeleton, borderRadius: br.sm }} />
      </View>
    );
  }
  const items = [
    { label: 'İlan', value: formatStatNum(parcels), icon: 'layers-outline' as const },
    { label: 'İhale', value: formatStatNum(auctions), icon: 'flash-outline' as const },
    { label: 'Şehir', value: formatStatNum(cities), icon: 'location-outline' as const },
  ];
  return (
    <View
      style={[
        S.statsStrip,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.82)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
        },
      ]}
    >
      {items.map((it, i) => (
        <View
          key={it.label}
          style={[
            S.statsCell,
            i > 0 && {
              borderLeftWidth: StyleSheet.hairlineWidth,
              borderLeftColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)',
            },
          ]}
        >
          <Ionicons name={it.icon} size={14} color={c.primary} style={{ marginBottom: 4 }} />
          <Text style={[typo.h3, { color: c.text, fontSize: 18, letterSpacing: -0.5 }]}>{it.value}</Text>
          <Text style={[typo.caption, { color: c.textMuted, marginTop: 2, fontWeight: '500' }]}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

/* ── Section Header ── */
function SectionHeader({ title, desc, onSeeAll, live }: {
  title: string; desc?: string; onSeeAll?: () => void; live?: boolean;
}) {
  const { colors: c, borderRadius: br } = useTheme();
  return (
    <View style={S.sectionHeader}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <LinearGradient
          colors={[c.primary, c.primaryLight]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={S.sectionAccentBar}
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <Text style={[S.sectionTitle, { color: c.text }]}>{title}</Text>
            {live && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                backgroundColor: c.statusLive, paddingHorizontal: 8, paddingVertical: 4, borderRadius: br.sm,
              }}>
                <PulsatingDot />
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.6 }}>CANLI</Text>
              </View>
            )}
          </View>
          {desc ? <Text style={[S.sectionDesc, { color: c.textMuted }]}>{desc}</Text> : null}
        </View>
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.75} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <View style={[S.seeAllPill, { backgroundColor: c.primaryBg, borderColor: c.primaryMuted }]}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: c.primary }}>Tümü</Text>
            <Ionicons name="arrow-forward" size={14} color={c.primary} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ── Main HomeScreen ── */
export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { colors: c, isDark, shadows, spacing: sp, borderRadius: br, typography: typo } = useTheme();
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<{ firstName?: string; lastName?: string } | null>(null);
  const [featured, setFeatured] = useState<Parcel[]>([]);
  const [latest, setLatest] = useState<Parcel[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [stats, setStats] = useState({ parcels: 0, auctions: 0, cities: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const heroOpacity = useSharedValue(0);
  const bodyOpacity = useSharedValue(0);
  const bodyTranslateY = useSharedValue(24);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    marginTop: -22,
    opacity: bodyOpacity.value,
    transform: [{ translateY: bodyTranslateY.value }],
  }));

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
      // Hero fade in
      heroOpacity.value = withTiming(1, { duration: 450 });
      // Body fade + slide after hero
      bodyOpacity.value = withDelay(450, withTiming(1, { duration: 400 }));
      bodyTranslateY.value = withDelay(450, withSpring(0, { stiffness: 65, damping: 11 }));
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

  const canvas = isDark ? c.background : c.skeleton;
  const surface = c.card;
  const heroGradient = isDark
    ? [c.background, '#1f1f1c', c.surface]
    : [c.primaryBg, '#e5eaca', '#ffffff'];
  const showSpotlight = !loading && featured.length > 0;
  const vitrinList = showSpotlight ? featured.slice(1) : featured;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: canvas }} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(120, insets.bottom + 96) }}
      >
        <Animated.View style={heroStyle}>
          <LinearGradient
            colors={heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingBottom: 32 }}
          >
            <View style={{ paddingHorizontal: PX, paddingTop: Platform.select({ ios: 6, default: 8 }) }}>
              <View style={[S.header, { paddingTop: 2 }]}>
                <TouchableOpacity onPress={() => navigation.navigate('Profile' as any)} activeOpacity={0.85}>
                  <View
                    style={[
                      S.avatar,
                      {
                        backgroundColor: c.primary,
                        borderWidth: 2,
                        borderColor: isDark ? c.elevated : 'rgba(255,255,255,0.9)',
                        ...(Platform.OS === 'ios'
                          ? { ...shadows.sm, shadowColor: c.primary, shadowOpacity: isDark ? 0.4 : 0.28 }
                          : { elevation: 4 }),
                      },
                    ]}
                  >
                    <Text style={S.avatarLetter}>{userName.charAt(0).toUpperCase()}</Text>
                  </View>
                </TouchableOpacity>
                <View style={{ flex: 1, paddingLeft: 14 }}>
                  <Text style={[typo.captionMed, { color: isDark ? c.textMuted : '#6b6b6b' }]}>{getGreeting()}</Text>
                  <Text style={[typo.h3, { color: c.text, marginTop: 3 }]} numberOfLines={1}>{userName}</Text>
                  <Text style={[typo.caption, { color: isDark ? c.textSecondary : '#525252', marginTop: 4 }]}>
                    Arsa ve arazi yatırımınız için hazırız.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Notifications')}
                  style={[
                    S.iconBtnWhite,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)',
                      borderRadius: br.md + 2,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.95)',
                      ...Platform.select({
                        ios: { ...shadows.sm, shadowOpacity: 0.08 },
                        default: { elevation: 0 },
                      }),
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <Ionicons name="notifications-outline" size={22} color={c.text} />
                  <View style={[S.notifDot, { borderColor: isDark ? c.card : '#fff' }]} />
                </TouchableOpacity>
              </View>

              <View
                style={[
                  S.searchShell,
                  {
                    marginTop: 18,
                    borderRadius: Platform.select({ ios: 16, default: 14 }),
                    borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.07)',
                  },
                ]}
              >
                {Platform.OS === 'ios' ? (
                  <BlurView
                    style={StyleSheet.absoluteFill}
                    blurType={isDark ? 'chromeMaterialDark' : 'chromeMaterial'}
                    blurAmount={56}
                    reducedTransparencyFallbackColor={isDark ? 'rgba(30,38,55,0.85)' : 'rgba(255,255,255,0.82)'}
                  />
                ) : (
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      { backgroundColor: isDark ? 'rgba(22,32,48,0.92)' : 'rgba(255,255,255,0.88)' },
                    ]}
                  />
                )}
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => navigation.navigate('Main', { screen: 'Parcels' } as any)}
                  style={S.searchBarInner}
                >
                  <View style={[S.searchIconRing, { backgroundColor: isDark ? c.primaryMuted : 'rgba(22,101,52,0.12)' }]}>
                    <Ionicons name="search" size={18} color={c.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typo.captionMed, { color: c.textMuted }]}>Hızlı arama</Text>
                    <Text style={[typo.body, { color: c.text, marginTop: 2 }]} numberOfLines={1}>
                      İl, ilçe, ada / parsel veya başlık
                    </Text>
                  </View>
                  <View style={[S.searchMicChip, { backgroundColor: isDark ? c.elevated : 'rgba(255,255,255,0.95)' }]}>
                    <Ionicons name="mic-outline" size={18} color={c.primary} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={bodyStyle}>
          <Animated.View entering={FadeInDown.delay(0).duration(400)} style={{ paddingHorizontal: FLOAT }}>
            <HomeStatsStrip
              parcels={stats.parcels}
              auctions={stats.auctions}
              cities={stats.cities}
              loading={loading}
            />
          </Animated.View>

          {!loading && showSpotlight ? (
            <Animated.View entering={FadeInDown.delay(60).duration(400)} style={{ marginHorizontal: FLOAT, marginTop: 22 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, paddingLeft: 2 }}>
                <LinearGradient
                  colors={[c.primary, c.primaryLight]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={S.sectionAccentBar}
                />
                <View>
                  <Text style={[typo.overline, { color: c.primary, marginBottom: 2 }]}>Seçili vitrin</Text>
                  <Text style={[typo.h2, { color: c.text, letterSpacing: -0.4 }]}>Günün fırsatı</Text>
                </View>
              </View>
              <SpotlightParcelCard
                parcel={featured[0]}
                onPress={() => navigation.navigate('ParcelDetail', { id: featured[0].id })}
              />
            </Animated.View>
          ) : null}

          <Animated.View
            entering={FadeInDown.delay(120).duration(400)}
            style={[
              S.floatingSection,
              {
                marginHorizontal: FLOAT,
                marginTop: 22,
                backgroundColor: surface,
                borderColor: c.borderLight,
                ...shadows.sm,
              },
            ]}
          >
            <Text style={[typo.overline, { color: c.textMuted, paddingHorizontal: sp.screenPadding - 4, marginBottom: sp.md }]}>
              Kategoriler
            </Text>
            <View style={S.categoryGrid}>
              {([
                { label: 'Arsa', icon: 'map-outline' as const, color: c.primary, route: 'Parcels' },
                { label: 'Tarla', icon: 'leaf-outline' as const, color: '#8e9d3f', route: 'Parcels' },
                { label: 'Zeytinlik', icon: 'water-outline' as const, color: c.primaryDark, route: 'Parcels' },
                { label: 'İhale', icon: 'flash' as const, color: c.statusLive, route: 'Auctions' },
                { label: 'Harita', icon: 'compass-outline' as const, color: c.primary, route: 'ParcelMap' },
                { label: 'Favoriler', icon: 'heart-outline' as const, color: '#c0392b', route: 'Favorites' },
                { label: 'Projeler', icon: 'business-outline' as const, color: c.accent, route: 'Parcels' },
                { label: 'Tümü', icon: 'grid-outline' as const, color: c.textMuted, route: 'Parcels' },
              ]).map((item, index) => (
                <Animated.View key={item.label} entering={FadeInDown.delay(120 + index * 60).duration(350)} style={S.categoryGridItem}>
                  <TouchableOpacity
                    activeOpacity={0.72}
                    style={{ alignItems: 'center' }}
                    onPress={() =>
                      item.route === 'Favorites' || item.route === 'ParcelMap'
                        ? navigation.navigate(item.route as any)
                        : navigation.navigate('Main', { screen: item.route } as any)
                    }
                  >
                    <View
                      style={[
                        S.categoryIconWrap,
                        {
                          backgroundColor: `${item.color}14`,
                          borderRadius: Platform.select({ ios: 16, default: 26 }),
                          borderWidth: StyleSheet.hairlineWidth,
                          borderColor: `${item.color}22`,
                          ...(Platform.OS === 'ios' ? shadows.sm : {}),
                        },
                      ]}
                    >
                      <Ionicons name={item.icon} size={22} color={item.color} />
                    </View>
                    <Text style={[typo.captionMed, { color: c.text, marginTop: 9, textAlign: 'center' }]}>{item.label}</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* ── Showcase / Vitrin ── */}
          {loading ? (
            <View style={{ paddingHorizontal: FLOAT, marginTop: 16 }}>
              <SkeletonParcelCard />
            </View>
          ) : vitrinList.length > 0 ? (
            <Animated.View
              entering={FadeInDown.delay(180).duration(400)}
              style={[
                S.floatingSection,
                {
                  marginHorizontal: FLOAT,
                  marginTop: 14,
                  backgroundColor: surface,
                  borderColor: c.borderLight,
                  ...shadows.sm,
                },
              ]}
            >
              <SectionHeader
                title="Vitrin"
                onSeeAll={() => navigation.navigate('Main', { screen: 'Parcels' } as any)}
              />
              <View style={S.vitrinGrid}>
                {vitrinList.map((item, index) => (
                  <Animated.View key={item.id} entering={FadeInDown.delay(180 + index * 60).duration(350)} style={S.vitrinGridItem}>
                    <ParcelCard parcel={item} onPress={() => navigation.navigate('ParcelDetail', { id: item.id })} vitrin />
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          ) : null}

          {loading ? null : auctions.length > 0 ? (
            <Animated.View
              entering={FadeInDown.delay(240).duration(400)}
              style={[
                S.floatingSection,
                {
                  marginHorizontal: FLOAT,
                  marginTop: 14,
                  backgroundColor: surface,
                  borderColor: c.borderLight,
                  ...shadows.sm,
                },
              ]}
            >
              <SectionHeader
                title="Canlı İhaleler"
                live
                onSeeAll={() => navigation.navigate('Main', { screen: 'Auctions' } as any)}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 14, paddingBottom: 4 }}
              >
                {auctions.map((a, index) => (
                  <Animated.View key={a.id} entering={FadeInDown.delay(240 + index * 60).duration(350)}>
                    <LiveAuctionCard
                      auction={a}
                      onPress={() => navigation.navigate('LiveAuction', { id: a.id })}
                    />
                  </Animated.View>
                ))}
              </ScrollView>
            </Animated.View>
          ) : null}

          {loading ? (
            <View style={{ paddingHorizontal: FLOAT, marginTop: 16 }}>
              <SkeletonParcelCard />
              <SkeletonParcelCard />
            </View>
          ) : latest.length > 0 ? (
            <Animated.View
              entering={FadeInDown.delay(300).duration(400)}
              style={[
                S.floatingSection,
                {
                  marginHorizontal: FLOAT,
                  marginTop: 14,
                  marginBottom: sp.sectionGap,
                  backgroundColor: surface,
                  borderColor: c.borderLight,
                  ...shadows.sm,
                },
              ]}
            >
              <SectionHeader title="Son Eklenen Arsalar" desc="Yeni eklenen arazi ilanları" />
              <View style={{ paddingHorizontal: 16 }}>
                {latest.map((p, index) => (
                  <Animated.View key={p.id} entering={FadeInDown.delay(300 + index * 60).duration(350)}>
                    <ParcelCard parcel={p} onPress={() => navigation.navigate('ParcelDetail', { id: p.id })} compact />
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          ) : null}

          <Animated.View
            entering={FadeInDown.delay(360).duration(400)}
            style={[
              S.trustCard,
              {
                backgroundColor: surface,
                borderColor: c.borderLight,
                ...shadows.md,
                marginHorizontal: FLOAT,
              },
            ]}
          >
            {([
              { icon: 'shield-checkmark-outline' as const, label: 'Güvenli Ödeme' },
              { icon: 'document-text-outline' as const, label: 'Resmi Tapu' },
              { icon: 'headset-outline' as const, label: '7/24 Destek' },
            ]).map((item) => (
              <View key={item.label} style={S.trustItem}>
                <View style={[S.trustIconCircle, { backgroundColor: isDark ? c.elevated : c.primaryBg }]}>
                  <Ionicons name={item.icon} size={18} color={c.primary} />
                </View>
                <Text style={[typo.captionMed, { color: c.textSecondary, textAlign: 'center', marginTop: 8 }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </Animated.View>

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
    paddingBottom: 12,
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

  /* Search (Vitrin style) */
  iconBtnWhite: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: 20,
  },

  /* Categories Grid */
  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  categoryGridItem: {
    width: '25%', alignItems: 'center', marginBottom: 16,
  },
  categoryIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Vitrin Grid */
  vitrinGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, justifyContent: 'space-between',
  },
  vitrinGridItem: {
    width: '48%', // Leaves space for 2 columns
  },

  /* Section headers */
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.35 },
  sectionDesc: { fontSize: 12, fontWeight: '400', marginTop: 5, lineHeight: 17 },
  sectionAccentBar: {
    width: 4,
    height: 46,
    borderRadius: 2,
    marginTop: 2,
  },
  seeAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },

  floatingSection: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
    paddingBottom: 18,
    overflow: 'hidden',
  },

  searchShell: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#121210',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      default: { elevation: 2 },
    }),
  },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 58,
  },
  searchIconRing: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  searchMicChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  statsStrip: {
    flexDirection: 'row',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statsCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },

  spotlightOuter: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  spotlightInner: {
    height: 210,
    borderRadius: 22,
    overflow: 'hidden',
  },
  spotlightImage: {
    ...StyleSheet.absoluteFillObject,
  },
  spotlightGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  spotlightCopy: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    paddingBottom: 18,
  },
  spotlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  trustCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingVertical: 22,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  trustItem: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  trustIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
