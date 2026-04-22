import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, FlatList,
  Dimensions, Share, Alert, Linking, Platform,
  NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
  FadeInRight,
  FadeIn,
  SlideInDown,
  runOnJS,
} from 'react-native-reanimated';
import apiClient from '../../api/client';
import { useTheme } from '../../theme';
import { formatPrice, formatArea, resolveImageUrl, formatDate } from '../../lib/format';
import { StatusBadge } from '../../components/ui';
import { ShimmerPlaceholder } from '../../components/ui';
import { SPRING, TIMING } from '../../lib/animations';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import type { Parcel, ParcelImage } from '../../types';

const { width } = Dimensions.get('window');

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ConsultantInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

function usePressScale() {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn = useCallback(() => {
    'worklet';
    scale.value = withSpring(0.9, SPRING.snappy);
  }, [scale]);
  const onPressOut = useCallback(() => {
    'worklet';
    scale.value = withSpring(1, SPRING.snappy);
  }, [scale]);
  return { animStyle, onPressIn, onPressOut };
}

export default function ParcelDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ParcelDetail'>>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors: c, isDark, shadows, borderRadius: br, spacing: sp, typography: typo } = useTheme();
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [images, setImages] = useState<ParcelImage[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [showStickyPrice, setShowStickyPrice] = useState(false);
  const [consultant, setConsultant] = useState<ConsultantInfo | null>(null);
  const priceSectionY = useRef(0);

  // Reanimated shared values
  const stickyProgress = useSharedValue(0);
  const galleryScrollX = useSharedValue(0);
  const priceScale = useSharedValue(0);
  const heartScale = useSharedValue(1);

  // Press scale hooks for buttons
  const backBtn = usePressScale();
  const shareBtn = usePressScale();
  const favBtn = usePressScale();

  useEffect(() => {
    async function load() {
      try {
        const { data } = await apiClient.get<Parcel>(`/parcels/${route.params.id}`);
        setParcel(data);
        setImages(data.images || []);
        // Animate price in
        priceScale.value = withSpring(1, SPRING.bouncy);
        // Load consultant if assigned
        if (data.assignedConsultant) {
          try {
            const { data: consultantData } = await apiClient.get(`/users/${data.assignedConsultant}`);
            setConsultant(consultantData);
          } catch { /* no consultant data */ }
        }
      } catch { navigation.goBack(); }
    }
    load();
  }, [route.params.id, navigation, priceScale]);

  useEffect(() => {
    stickyProgress.value = withTiming(showStickyPrice ? 1 : 0, TIMING.fast);
  }, [showStickyPrice, stickyProgress]);

  const stickyBarStyle = useAnimatedStyle(() => ({
    opacity: stickyProgress.value,
    transform: [
      { translateY: interpolate(stickyProgress.value, [0, 1], [-72, 0], Extrapolation.CLAMP) },
    ],
  }));

  const priceAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: priceScale.value }],
  }));

  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    setShowStickyPrice(y > priceSectionY.current + 60);
  };

  const handleGalleryScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    galleryScrollX.value = e.nativeEvent.contentOffset.x;
  };

  async function toggleFavorite() {
    if (!parcel) return;
    try {
      if (isFavorite) { await apiClient.delete(`/favorites/${parcel.id}`); }
      else { await apiClient.post('/favorites', { parcelId: parcel.id }); }
      setIsFavorite(!isFavorite);
      // Heart bounce
      heartScale.value = withSpring(1.35, SPRING.bouncy, () => {
        heartScale.value = withSpring(1, SPRING.snappy);
      });
    } catch { /* silently fail */ }
  }

  async function handleShare() {
    if (!parcel) return;
    try {
      await Share.share({
        message: `${parcel.title}\n${parcel.city}, ${parcel.district}\n${formatPrice(parcel.price)}\n\nNetTapu'da görüntüle`,
      });
    } catch { /* silently fail */ }
  }

  function handleWhatsApp() {
    if (!parcel) return;
    const phone = consultant?.phone || '';
    const message = encodeURIComponent(
      `Merhaba, NetTapu'daki ${parcel.title} (${parcel.listingId}) ilanı hakkında bilgi almak istiyorum.`
    );
    const url = phone
      ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`
      : `https://wa.me/?text=${message}`;
    Linking.openURL(url).catch(() => Alert.alert('Hata', 'WhatsApp açılamadı.'));
  }

  function handleCall() {
    const phone = consultant?.phone || '';
    if (!phone) {
      Alert.alert('Bilgi', 'Danışman telefon numarası bulunamadı.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Hata', 'Arama başlatılamadı.'));
  }

  // Animated pagination dot component
  function PaginationDot({ index }: { index: number }) {
    const dotStyle = useAnimatedStyle(() => {
      const scrollPos = galleryScrollX.value / width;
      const dotWidth = interpolate(
        scrollPos,
        [index - 1, index, index + 1],
        [6, 20, 6],
        Extrapolation.CLAMP,
      );
      const opacity = interpolate(
        scrollPos,
        [index - 1, index, index + 1],
        [0.4, 1, 0.4],
        Extrapolation.CLAMP,
      );
      return { width: dotWidth, opacity };
    });

    return (
      <Animated.View
        style={[styles.galleryDot, { backgroundColor: '#fff' }, dotStyle]}
      />
    );
  }

  // Parallax image item
  function ParallaxImage({ item, index: imgIndex }: { item: ParcelImage; index: number }) {
    const parallaxStyle = useAnimatedStyle(() => {
      const inputRange = [(imgIndex - 1) * width, imgIndex * width, (imgIndex + 1) * width];
      const translateX = interpolate(
        galleryScrollX.value,
        inputRange,
        [-30, 0, 30],
        Extrapolation.CLAMP,
      );
      return { transform: [{ translateX }] };
    });

    return (
      <View style={{ width, height: 380, overflow: 'hidden' }}>
        <Animated.Image
          source={{ uri: resolveImageUrl(item) }}
          style={[{ width: width + 60, height: 380, marginLeft: -30 }, parallaxStyle]}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (!parcel) return (
    <View style={[styles.loading, { backgroundColor: c.background }]}>
      <View style={{ padding: 20 }}>
        <ShimmerPlaceholder width={width} height={360} borderRadius={0} />
        <View style={{ marginTop: 20, gap: 10 }}>
          <ShimmerPlaceholder width={width * 0.6} height={20} />
          <ShimmerPlaceholder width={width * 0.8} height={16} />
          <ShimmerPlaceholder width={width * 0.4} height={28} style={{ marginTop: 10 }} />
          <ShimmerPlaceholder width={width - 40} height={120} borderRadius={16} style={{ marginTop: 16 }} />
          <ShimmerPlaceholder width={width - 40} height={200} borderRadius={16} style={{ marginTop: 12 }} />
        </View>
      </View>
    </View>
  );

  const infoRows: { label: string; value: string; icon: string }[] = [
    { label: 'İlan No', value: parcel.listingId, icon: 'barcode-outline' },
    { label: 'İlan Tarihi', value: parcel.listedAt ? formatDate(parcel.listedAt, 'date') : '\u2014', icon: 'calendar-outline' },
    { label: 'Emlak Tipi', value: parcel.landType || '\u2014', icon: 'layers-outline' },
    { label: 'İmar Durumu', value: parcel.zoningStatus || '\u2014', icon: 'construct-outline' },
    { label: 'Alan (m\u00B2)', value: formatArea(parcel.areaM2), icon: 'resize-outline' },
    { label: 'Ada', value: parcel.ada || '\u2014', icon: 'grid-outline' },
    { label: 'Parsel', value: parcel.parsel || '\u2014', icon: 'grid-outline' },
  ];

  const canvas = isDark ? c.background : c.skeleton;
  const galleryTop = Math.max(insets.top, 12) + 6;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: canvas }} edges={['bottom']}>
      {/* Sticky price bar */}
      <Animated.View
        style={[
          styles.stickyBar,
          stickyBarStyle,
          {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: c.borderLight,
            overflow: 'hidden',
          },
          Platform.OS === 'ios' ? shadows.md : { elevation: 6 },
        ]}
      >
        {Platform.OS === 'ios' ? (
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType={isDark ? 'chromeMaterialDark' : 'chromeMaterial'}
            blurAmount={48}
            reducedTransparencyFallbackColor={isDark ? 'rgba(22,32,48,0.96)' : 'rgba(255,255,255,0.96)'}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(26,39,64,0.98)' : 'rgba(255,255,255,0.98)' }]} />
        )}
        <SafeAreaView
          edges={['top']}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: sp.screenPadding,
            paddingVertical: 12,
          }}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={[typo.captionMed, { color: c.textMuted }]} numberOfLines={1}>{parcel.title}</Text>
            <Text style={[typo.price, { color: c.primary, marginTop: 2, fontSize: 21 }]}>
              {formatPrice(parcel.price)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => Alert.alert('Teklif', 'Teklif formu yakında aktif olacak.')}
            style={{
              backgroundColor: c.primary,
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: Platform.select({ ios: br.xl, default: br.md }),
              ...(Platform.OS === 'android' ? { elevation: 2 } : {}),
            }}
            activeOpacity={0.88}
          >
            <Text style={[typo.captionMed, { color: c.textInverse, fontWeight: '700' }]}>Teklif Ver</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={Platform.OS === 'ios'}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Gallery */}
        <View style={styles.gallery}>
          <FlatList
            data={images}
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onScroll={handleGalleryScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => setImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item, index: idx }) => (
              <ParallaxImage item={item} index={idx} />
            )}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={[styles.noImage, { backgroundColor: isDark ? c.surface : c.skeleton }]}>
                <Ionicons name="image-outline" size={48} color={c.textMuted} />
              </View>
            }
          />

          <LinearGradient
            colors={['rgba(0,0,0,0.45)', 'transparent']}
            style={styles.topGradient}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={styles.bottomGradient}
          />

          {/* Animated dot pagination */}
          {images.length > 1 && (
            <View style={styles.dotsRow}>
              {images.map((_, i) => (
                <PaginationDot key={i} index={i} />
              ))}
            </View>
          )}

          {/* Image counter */}
          {images.length > 0 && (
            <View style={styles.imageCounter}>
              <Ionicons name="images-outline" size={12} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>{imageIndex + 1}/{images.length}</Text>
            </View>
          )}

          {/* Back button with press scale */}
          <AnimatedTouchable
            onPress={() => navigation.goBack()}
            onPressIn={backBtn.onPressIn}
            onPressOut={backBtn.onPressOut}
            style={[
              styles.galleryRoundBtn,
              { top: galleryTop, left: 16 },
              Platform.OS === 'android' && { backgroundColor: 'rgba(0,0,0,0.42)' },
              backBtn.animStyle,
            ]}
            activeOpacity={0.85}
          >
            {Platform.OS === 'ios' ? (
              <BlurView
                style={StyleSheet.absoluteFill}
                blurType={isDark ? 'dark' : 'light'}
                blurAmount={28}
                reducedTransparencyFallbackColor="rgba(0,0,0,0.4)"
              />
            ) : null}
            <Ionicons name="chevron-back" size={22} color="#fff" style={styles.galleryRoundBtnIcon} />
          </AnimatedTouchable>

          <View style={[styles.topActions, { top: galleryTop }]}>
            {/* Share button with press scale */}
            <AnimatedTouchable
              onPress={handleShare}
              onPressIn={shareBtn.onPressIn}
              onPressOut={shareBtn.onPressOut}
              style={[
                styles.topActionBtn,
                Platform.OS === 'android' && { backgroundColor: 'rgba(0,0,0,0.42)' },
                shareBtn.animStyle,
              ]}
              activeOpacity={0.85}
            >
              {Platform.OS === 'ios' ? (
                <BlurView
                  style={StyleSheet.absoluteFill}
                  blurType={isDark ? 'dark' : 'light'}
                  blurAmount={28}
                  reducedTransparencyFallbackColor="rgba(0,0,0,0.4)"
                />
              ) : null}
              <Ionicons name="share-outline" size={18} color="#fff" style={styles.galleryRoundBtnIcon} />
            </AnimatedTouchable>

            {/* Favorite button with press scale + heart bounce */}
            <AnimatedTouchable
              onPress={toggleFavorite}
              onPressIn={favBtn.onPressIn}
              onPressOut={favBtn.onPressOut}
              style={[
                styles.topActionBtn,
                isFavorite && { backgroundColor: 'rgba(220,38,38,0.72)' },
                Platform.OS === 'android' && !isFavorite && { backgroundColor: 'rgba(0,0,0,0.42)' },
                favBtn.animStyle,
              ]}
              activeOpacity={0.85}
            >
              {Platform.OS === 'ios' && !isFavorite ? (
                <BlurView
                  style={StyleSheet.absoluteFill}
                  blurType={isDark ? 'dark' : 'light'}
                  blurAmount={28}
                  reducedTransparencyFallbackColor="rgba(0,0,0,0.4)"
                />
              ) : null}
              <Animated.View style={heartAnimStyle}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color="#fff" style={styles.galleryRoundBtnIcon} />
              </Animated.View>
            </AnimatedTouchable>
          </View>
        </View>

        <View style={[styles.contentSheet, { backgroundColor: canvas }]}>
          <View
            style={[
              styles.sheetInner,
              {
                backgroundColor: c.card,
                borderTopLeftRadius: 22,
                borderTopRightRadius: 22,
                ...shadows.md,
              },
            ]}
          >
            <View style={{ paddingHorizontal: sp.screenPadding, paddingTop: 18, paddingBottom: 6 }}>
              <StatusBadge status={parcel.status} />
            </View>

            {/* Price section with scale spring */}
            <Animated.View
              onLayout={(e) => { priceSectionY.current = e.nativeEvent.layout.y; }}
              style={[
                priceAnimStyle,
                {
                  paddingHorizontal: sp.screenPadding,
                  paddingBottom: 20,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: c.borderLight,
                },
              ]}
            >
              <Text style={[typo.priceLarge, { color: c.primary }]}>
                {formatPrice(parcel.price)}
              </Text>
              <Text style={[typo.h3, { color: c.text, marginTop: 8, lineHeight: 24 }]}>
                {parcel.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
                <Ionicons name="location-outline" size={16} color={c.primary} />
                <Text style={[typo.bodySmall, { color: c.textSecondary, fontWeight: '500' }]}>
                  {parcel.city}, {parcel.district}{parcel.neighborhood ? `, ${parcel.neighborhood}` : ''}
                </Text>
              </View>
            </Animated.View>

            {/* Info rows with staggered FadeInRight */}
            <View style={{ paddingVertical: 6 }}>
              <Text style={[typo.overline, { color: c.textMuted, paddingHorizontal: sp.screenPadding, marginBottom: 6, marginTop: 8 }]}>
                İlan bilgileri
              </Text>
              {infoRows.map((row, i, arr) => (
                <Animated.View
                  key={row.label}
                  entering={FadeInRight.delay(i * 40).springify().damping(18).stiffness(200)}
                  style={[
                    styles.detailRowPro,
                    i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.borderLight },
                  ]}
                >
                  <View style={[styles.detailRowLeft, { backgroundColor: isDark ? c.elevated : c.primaryBg }]}>
                    <Ionicons name={row.icon as React.ComponentProps<typeof Ionicons>['name']} size={17} color={c.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[typo.caption, { color: c.textMuted }]}>{row.label}</Text>
                    <Text style={[typo.bodySmall, { color: c.text, fontWeight: '600', marginTop: 2 }]}>{row.value}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>

            {parcel.description ? (
              <View
                style={{
                  paddingHorizontal: sp.screenPadding,
                  paddingVertical: 18,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: c.borderLight,
                }}
              >
                <Text style={[typo.overline, { color: c.textMuted, marginBottom: 10 }]}>Açıklama</Text>
                <Text style={[typo.body, { color: c.textSecondary }]}>{parcel.description}</Text>
              </View>
            ) : null}

            {/* Consultant section with fade in */}
            {consultant ? (
              <Animated.View
                entering={FadeIn.delay(300).duration(400)}
                style={{
                  marginHorizontal: sp.screenPadding,
                  marginBottom: 16,
                  marginTop: 4,
                  padding: 16,
                  borderRadius: br.xl,
                  backgroundColor: isDark ? c.elevated : c.primaryBg,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: isDark ? c.borderLight : c.primaryMuted,
                }}
              >
                <Text style={[typo.overline, { color: c.textMuted, marginBottom: 12 }]}>Danışman</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: isDark ? c.surface : c.card,
                      alignItems: 'center',
                      justifyContent: 'center',
                      ...(Platform.OS === 'ios' ? shadows.sm : { elevation: 1 }),
                    }}
                  >
                    <Text style={[typo.h3, { color: c.primary }]}>
                      {(consultant.firstName || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typo.h4, { color: c.text }]}>
                      {consultant.firstName} {consultant.lastName}
                    </Text>
                    <Text style={[typo.caption, { color: c.textSecondary, marginTop: 2 }]}>NetTapu danışmanı</Text>
                  </View>
                </View>
              </Animated.View>
            ) : null}
            <View style={{ height: Platform.OS === 'ios' ? 110 : 96 }} />
          </View>
        </View>
      </ScrollView>

      {/* Bottom action bar with slide up entrance */}
      <Animated.View
        entering={SlideInDown.springify().damping(18).stiffness(180).delay(200)}
        style={[styles.bottomBar, { borderTopColor: c.borderLight }]}
      >
        {Platform.OS === 'ios' ? (
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType={isDark ? 'chromeMaterialDark' : 'chromeMaterial'}
            blurAmount={56}
            reducedTransparencyFallbackColor={isDark ? 'rgba(22,32,48,0.94)' : 'rgba(255,255,255,0.94)'}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(26,39,64,0.98)' : '#ffffff' }]} />
        )}
        <SafeAreaView edges={['bottom']} style={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 10 }}>
          <TouchableOpacity
            onPress={handleCall}
            style={[
              styles.bottomBtn,
              {
                backgroundColor: c.primary,
                flex: 1,
                borderRadius: Platform.select({ ios: br.xl, default: br.md }),
              },
            ]}
            activeOpacity={0.88}
          >
            <Ionicons name="call" size={19} color={c.textInverse} />
            <Text style={[styles.bottomBtnText, { color: c.textInverse }]}>Ara</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleWhatsApp}
            style={[
              styles.bottomBtn,
              {
                backgroundColor: '#25D366',
                flex: 1,
                borderRadius: Platform.select({ ios: br.xl, default: br.md }),
              },
            ]}
            activeOpacity={0.88}
          >
            <Ionicons name="logo-whatsapp" size={19} color="#fff" />
            <Text style={styles.bottomBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1 },

  gallery: { position: 'relative' },
  noImage: { width, height: 380, alignItems: 'center', justifyContent: 'center' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 140 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160 },
  dotsRow: {
    position: 'absolute', bottom: 20, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 5,
  },
  galleryDot: { width: 6, height: 6, borderRadius: 3 },
  imageCounter: {
    position: 'absolute', bottom: 20, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  galleryRoundBtn: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  galleryRoundBtnIcon: { zIndex: 2 },
  topActions: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    gap: 10,
  },
  topActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  stickyBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },

  contentSheet: { marginTop: -20, flex: 1 },
  sheetInner: { overflow: 'hidden' },

  detailRowPro: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  detailRowLeft: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  bottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  bottomBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
