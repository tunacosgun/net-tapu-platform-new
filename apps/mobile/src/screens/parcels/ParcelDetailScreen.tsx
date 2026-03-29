import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, FlatList,
  Dimensions, Share, Alert, Linking, Platform, Animated, NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../../api/client';
import { useTheme } from '../../theme';
import { formatPrice, formatArea, resolveImageUrl, formatDate } from '../../lib/format';
import { StatusBadge, Skeleton } from '../../components/ui';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import type { Parcel, ParcelImage } from '../../types';

const { width } = Dimensions.get('window');

interface ConsultantInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export default function ParcelDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ParcelDetail'>>();
  const navigation = useNavigation();
  const { colors: c, isDark, shadows, borderRadius: br, spacing: sp } = useTheme();
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [images, setImages] = useState<ParcelImage[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [showStickyPrice, setShowStickyPrice] = useState(false);
  const [consultant, setConsultant] = useState<ConsultantInfo | null>(null);
  const stickyAnim = useRef(new Animated.Value(0)).current;
  const priceSectionY = useRef(0);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await apiClient.get<Parcel>(`/parcels/${route.params.id}`);
        setParcel(data);
        setImages(data.images || []);
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
  }, [route.params.id, navigation]);

  useEffect(() => {
    Animated.timing(stickyAnim, {
      toValue: showStickyPrice ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showStickyPrice, stickyAnim]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    setShowStickyPrice(y > priceSectionY.current + 60);
  };

  async function toggleFavorite() {
    if (!parcel) return;
    try {
      if (isFavorite) { await apiClient.delete(`/favorites/${parcel.id}`); }
      else { await apiClient.post('/favorites', { parcelId: parcel.id }); }
      setIsFavorite(!isFavorite);
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

  if (!parcel) return (
    <View style={[styles.loading, { backgroundColor: c.background }]}>
      <View style={{ padding: 20 }}>
        <Skeleton width={width} height={360} borderRadius={0} />
        <View style={{ marginTop: 20, gap: 10 }}>
          <Skeleton width="60%" height={20} />
          <Skeleton width="80%" height={16} />
          <Skeleton width="40%" height={28} style={{ marginTop: 10 }} />
          <Skeleton width="100%" height={120} borderRadius={16} style={{ marginTop: 16 }} />
          <Skeleton width="100%" height={200} borderRadius={16} style={{ marginTop: 12 }} />
        </View>
      </View>
    </View>
  );

  const infoRows: { label: string; value: string; icon: string }[] = [
    { label: 'İlan No', value: parcel.listingId, icon: 'barcode-outline' },
    { label: 'İlan Tarihi', value: parcel.listedAt ? formatDate(parcel.listedAt, 'date') : '\u2014', icon: 'calendar-outline' },
    { label: 'Emlak Tipi', value: parcel.landType || '\u2014', icon: 'layers-outline' },
    { label: 'İmar Durumu', value: parcel.zoningStatus || '\u2014', icon: 'construct-outline' },
    { label: 'Alan (m²)', value: formatArea(parcel.areaM2), icon: 'resize-outline' },
    { label: 'Ada', value: parcel.ada || '\u2014', icon: 'grid-outline' },
    { label: 'Parsel', value: parcel.parsel || '\u2014', icon: 'grid-outline' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['bottom']}>
      {/* Sticky Price Bar */}
      <Animated.View style={[styles.stickyBar, {
        backgroundColor: c.card,
        borderBottomColor: c.border,
        opacity: stickyAnim,
        transform: [{ translateY: stickyAnim.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }) }],
      }, shadows.sm]}>
        <SafeAreaView edges={['top']} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: sp.screenPadding, paddingVertical: 10 }}>
          <View>
            <Text style={{ fontSize: 12, color: c.textMuted, fontWeight: '500' }}>{parcel.title}</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: c.primary, letterSpacing: -0.4 }}>
              {formatPrice(parcel.price)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => Alert.alert('Teklif', 'Teklif formu yakında aktif olacak.')}
            style={{ backgroundColor: c.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: br.sm }}
            activeOpacity={0.85}
          >
            <Text style={{ color: c.textInverse, fontWeight: '700', fontSize: 14 }}>Teklif Ver</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Gallery */}
        <View style={styles.gallery}>
          <FlatList
            data={images}
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => (
              <Image source={{ uri: resolveImageUrl(item) }} style={{ width, height: 380 }} resizeMode="cover" />
            )}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={[styles.noImage, { backgroundColor: isDark ? c.surface : c.skeleton }]}>
                <Ionicons name="image-outline" size={48} color={c.textMuted} />
              </View>
            }
          />

          {/* Top gradient */}
          <View style={[styles.topGradient, { backgroundColor: 'rgba(0,0,0,0.25)' }]} />

          {/* Dot pagination */}
          {images.length > 1 && (
            <View style={styles.dotsRow}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.galleryDot,
                    { backgroundColor: i === imageIndex ? '#fff' : 'rgba(255,255,255,0.4)' },
                    i === imageIndex && { width: 20 },
                  ]}
                />
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

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.topActions}>
            <TouchableOpacity onPress={handleShare} style={styles.topActionBtn}>
              <Ionicons name="share-outline" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleFavorite} style={[styles.topActionBtn, isFavorite && { backgroundColor: 'rgba(220,38,38,0.6)' }]}>
              <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <StatusBadge status={parcel.status} />
          <Text style={[styles.title, { color: c.text }]}>{parcel.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginBottom: 20 }}>
            <Ionicons name="location-outline" size={14} color={c.textMuted} />
            <Text style={{ fontSize: 14, color: c.textMuted }}>
              {parcel.city}, {parcel.district}{parcel.neighborhood ? `, ${parcel.neighborhood}` : ''}
            </Text>
          </View>

          {/* Price Section */}
          <View
            onLayout={(e) => { priceSectionY.current = e.nativeEvent.layout.y; }}
            style={[styles.priceSection, {
              backgroundColor: isDark ? c.primaryBg : c.primaryBg,
              borderColor: isDark ? c.borderLight : c.primaryMuted,
            }]}
          >
            <View>
              <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4, color: c.textMuted }}>FİYAT</Text>
              <Text style={{ fontSize: 30, fontWeight: '800', letterSpacing: -0.5, color: c.primary }}>{formatPrice(parcel.price)}</Text>
            </View>
            {parcel.pricePerM2 && (
              <View>
                <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4, color: c.textMuted }}>m² BİRİM</Text>
                <Text style={{ fontSize: 18, fontWeight: '700', letterSpacing: -0.3, color: c.text }}>{formatPrice(parcel.pricePerM2)}</Text>
              </View>
            )}
          </View>

          {/* Info Table (sahibinden style) */}
          <View style={[styles.detailsCard, { backgroundColor: c.card, borderColor: isDark ? c.borderLight : c.border }, shadows.sm]}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>İlan Bilgileri</Text>
            {infoRows.map((row, i, arr) => (
              <View key={row.label} style={[
                styles.detailRow,
                { backgroundColor: i % 2 === 0 ? (isDark ? 'rgba(255,255,255,0.02)' : '#fafbfc') : 'transparent' },
                i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? c.borderLight : '#f1f5f9' },
              ]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name={row.icon as any} size={15} color={c.textMuted} />
                  <Text style={{ fontSize: 14, color: c.textSecondary }}>{row.label}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: c.text }}>{row.value}</Text>
              </View>
            ))}
          </View>

          {/* Consultant Card */}
          {consultant && (
            <View style={[styles.consultantCard, { backgroundColor: c.card, borderColor: isDark ? c.borderLight : c.border }, shadows.sm]}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Danışman</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{
                  width: 50, height: 50, borderRadius: 16,
                  backgroundColor: isDark ? c.surface : c.primaryBg,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: c.primary }}>
                    {(consultant.firstName || '?')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: c.text }}>
                    {consultant.firstName} {consultant.lastName}
                  </Text>
                  {consultant.email && (
                    <Text style={{ fontSize: 13, color: c.textMuted, marginTop: 2 }}>{consultant.email}</Text>
                  )}
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <TouchableOpacity
                  onPress={handleCall}
                  style={[styles.consultantBtn, { backgroundColor: c.primary }]}
                  activeOpacity={0.85}
                >
                  <Ionicons name="call-outline" size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Ara</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleWhatsApp}
                  style={[styles.consultantBtn, { backgroundColor: '#25d366' }]}
                  activeOpacity={0.85}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Description */}
          {parcel.description && (
            <View style={[styles.detailsCard, { backgroundColor: c.card, borderColor: isDark ? c.borderLight : c.border }, shadows.sm]}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Açıklama</Text>
              <Text style={{ fontSize: 15, lineHeight: 24, color: c.textSecondary }}>{parcel.description}</Text>
            </View>
          )}

          {/* CTA Buttons */}
          <View style={{ marginTop: 8, gap: 10, paddingBottom: 40 }}>
            <TouchableOpacity
              onPress={() => Alert.alert('Teklif', 'Teklif formu yakında aktif olacak.')}
              style={[styles.ctaBtn, { backgroundColor: c.primary }]}
              activeOpacity={0.85}
            >
              <Ionicons name="pricetag-outline" size={18} color="#fff" />
              <Text style={styles.ctaBtnText}>Teklif Ver</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCall}
              style={[styles.ctaBtn, { backgroundColor: isDark ? c.surface : c.card, borderWidth: 1, borderColor: c.border }]}
              activeOpacity={0.85}
            >
              <Ionicons name="call-outline" size={18} color={c.primary} />
              <Text style={[styles.ctaBtnText, { color: c.text }]}>Sizi Arayalım</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleWhatsApp}
              style={[styles.whatsappBtn, { borderColor: isDark ? c.borderLight : '#dcfce7', backgroundColor: isDark ? c.surface : c.primaryBg }]}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#25d366" />
              <Text style={{ fontSize: 16, fontWeight: '600', color: c.text }}>WhatsApp ile İletişim</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              style={[styles.shareBtn, { backgroundColor: isDark ? c.surface : c.infoBg, borderWidth: 1, borderColor: isDark ? c.borderLight : c.border }]}
              activeOpacity={0.7}
            >
              <Ionicons name="share-social-outline" size={18} color={c.info} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: c.textSecondary }}>Paylaş</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1 },

  gallery: { position: 'relative' },
  noImage: { width, height: 380, alignItems: 'center', justifyContent: 'center' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 120 },
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
  backBtn: {
    position: 'absolute', top: Platform.OS === 'ios' ? 56 : 16, left: 16,
    width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  topActions: {
    position: 'absolute', top: Platform.OS === 'ios' ? 56 : 16, right: 16,
    flexDirection: 'row', gap: 8,
  },
  topActionBtn: {
    width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },

  stickyBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    borderBottomWidth: 1,
  },

  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', marginTop: 10, letterSpacing: -0.4, lineHeight: 30 },

  priceSection: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 20, paddingHorizontal: 18, borderRadius: 16, borderWidth: 1, marginBottom: 24,
  },

  detailsCard: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 14, overflow: 'hidden' },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12, letterSpacing: -0.2 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8,
  },

  consultantCard: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 14 },
  consultantBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12, gap: 6,
  },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 17, borderRadius: 16, gap: 8,
  },
  ctaBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  whatsappBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 16, borderWidth: 1, gap: 8,
  },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 16, gap: 8,
  },
});
