import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  FadeInDown,
  FadeIn,
  withSpring,
  withRepeat,
  withTiming,
  useSharedValue,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../stores/auth-store';
import apiClient from '../../api/client';
import { SPRING } from '../../lib/animations';

interface ProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

/* ── Animated Menu Row ─────────────────────────────── */
function MenuRow({
  item,
  index,
  isLast,
  isDark,
  colors,
  onPress,
}: {
  item: { icon: string; label: string; screen: string; color: string };
  index: number;
  isLast: boolean;
  isDark: boolean;
  colors: any;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, SPRING.snappy);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING.snappy);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(200 + index * 70).duration(400).springify()}
      style={animatedStyle}
    >
      <TouchableOpacity
        style={[styles.menuItem, !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: isDark ? colors.borderLight : '#f1f5f9',
        }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={[styles.menuIconWrap, { backgroundColor: item.color + '12' }]}>
          <Ionicons name={item.icon as any} size={18} color={item.color} />
        </View>
        <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ── Main Screen ───────────────────────────────────── */
export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { colors: c, isDark, shadows, borderRadius: br, spacing: sp } = useTheme();
  const { user, isAuthenticated, clearTokens, avatarUrl } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // Ring rotation
  const ringRotation = useSharedValue(0);
  // Camera pulse
  const cameraPulse = useSharedValue(1);
  // Logout scale
  const logoutScale = useSharedValue(1);

  useEffect(() => {
    ringRotation.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1,
      false,
    );
    cameraPulse.value = withRepeat(
      withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }],
  }));

  const cameraStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cameraPulse.value }],
  }));

  const logoutAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoutScale.value }],
  }));

  useEffect(() => {
    if (isAuthenticated) {
      apiClient.get('/auth/me').then((res) => setProfile(res.data)).catch(() => {});
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkmak istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => clearTokens() },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
        <View style={styles.loginPrompt}>
          <Animated.View
            entering={FadeIn.duration(500)}
            style={[styles.loginIconWrap, { backgroundColor: isDark ? c.surface : c.primaryBg }]}
          >
            <Ionicons name="person-outline" size={40} color={c.primary} />
          </Animated.View>
          <Animated.Text
            entering={FadeInDown.delay(100).duration(400)}
            style={[styles.loginTitle, { color: c.text }]}
          >
            Hesabınıza giriş yapın
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(200).duration(400)}
            style={{ fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 20 }}
          >
            İlanları favorileyin, ihalelere katılın ve daha fazlası
          </Animated.Text>
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
              style={[styles.loginBtn, { backgroundColor: c.primary }]}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Giriş Yap</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = profile
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
    : user?.name || 'Kullanıcı';
  const initial = (displayName || user?.email || '?')[0].toUpperCase();

  const menuSections = [
    {
      title: 'Hesabım',
      items: [
        { icon: 'heart-outline', label: 'Favorilerim', screen: 'Favorites', color: c.error },
        { icon: 'document-text-outline', label: 'Tekliflerim', screen: 'Offers', color: c.warning },
        { icon: 'flash-outline', label: 'İhale Geçmişim', screen: 'Offers', color: c.primary },
        { icon: 'card-outline', label: 'Ödeme Geçmişim', screen: 'Payments', color: c.success },
      ],
    },
    {
      title: 'Ayarlar',
      items: [
        { icon: 'search-outline', label: 'Kayıtlı Aramalar', screen: 'Settings', color: c.info },
        { icon: 'notifications-outline', label: 'Bildirim Ayarları', screen: 'Notifications', color: c.warning },
        { icon: 'shield-checkmark-outline', label: 'Güvenlik', screen: 'Settings', color: c.primary },
      ],
    },
  ];

  let globalMenuIndex = 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>

        {/* ── Profile Header ── */}
        <Animated.View entering={FadeInDown.delay(50).duration(500).springify()} style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} style={{ position: 'relative', alignItems: 'center' }}>
            {/* Gradient ring */}
            <Animated.View style={[styles.avatarRing, ringStyle, {
              borderColor: c.primary,
              borderTopColor: isDark ? '#515d2b' : '#8e9d3f',
              borderRightColor: isDark ? '#a78bfa' : '#c084fc',
            }]} />
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={[styles.avatar, { borderColor: c.background }]} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder, {
                backgroundColor: isDark ? c.surface : c.primaryBg,
                borderColor: c.background,
              }]}>
                <Text style={[styles.avatarInitial, { color: c.primary }]}>{initial}</Text>
              </View>
            )}
            {/* Camera icon with pulse */}
            <Animated.View style={[styles.cameraIcon, cameraStyle, {
              backgroundColor: c.primary,
              borderColor: c.background,
            }]}>
              <Ionicons name="camera" size={12} color="#fff" />
            </Animated.View>
          </TouchableOpacity>

          <Text style={[styles.profileName, { color: c.text }]}>{displayName}</Text>
          <Text style={{ fontSize: 14, color: c.textMuted }}>{user?.email}</Text>
          {profile?.phone && (
            <Text style={{ fontSize: 13, color: c.textMuted, marginTop: 2 }}>{profile.phone}</Text>
          )}

          {/* Stats row */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(400)}
            style={styles.statsRow}
          >
            {[
              { value: '12', label: 'Favori' },
              { value: '3', label: 'Teklif' },
              { value: '2', label: 'İhale' },
            ].map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 && <View style={[styles.statDivider, { backgroundColor: c.border }]} />}
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: c.text }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: c.textMuted }]}>{stat.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </Animated.View>
        </Animated.View>

        {/* ── Menu Sections ── */}
        {menuSections.map((section, sIdx) => {
          const sectionStartIndex = globalMenuIndex;
          globalMenuIndex += section.items.length;

          return (
            <React.Fragment key={section.title}>
              <View style={{ marginBottom: sp.lg }}>
                <Animated.Text
                  entering={FadeInDown.delay(250 + sIdx * 120).duration(350)}
                  style={[styles.sectionLabel, { color: c.textMuted }]}
                >
                  {section.title}
                </Animated.Text>
                <Animated.View
                  entering={FadeInDown.delay(280 + sIdx * 120).duration(400)}
                  style={[styles.menuCard, {
                    backgroundColor: c.card,
                    borderColor: c.border,
                  }, shadows.sm]}
                >
                  {section.items.map((item, i) => (
                    <MenuRow
                      key={item.label}
                      item={item}
                      index={sectionStartIndex + i}
                      isLast={i === section.items.length - 1}
                      isDark={isDark}
                      colors={c}
                      onPress={() => navigation.navigate(item.screen)}
                    />
                  ))}
                </Animated.View>
              </View>

              {/* Pro banner after first section */}
              {sIdx === 0 && (
                <Animated.View
                  entering={FadeInDown.delay(450).duration(450).springify()}
                  style={[styles.proBanner, {
                    backgroundColor: isDark ? '#1e1b4b' : '#eef2ff',
                    borderColor: isDark ? '#161a0c' : '#c7d2fe',
                  }]}
                >
                  <View style={styles.proBadge}>
                    <Ionicons name="diamond" size={14} color="#fff" />
                    <Text style={styles.proBadgeText}>PRO</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.proTitle, { color: isDark ? '#e0e7ff' : '#161a0c' }]}>
                      NetTapu Pro ile daha fazlası
                    </Text>
                    <Text style={[styles.proSubtitle, { color: isDark ? '#a5b4fc' : '#515d2b' }]}>
                      Erken bildirim, detaylı analiz ve oncelikli destek
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={isDark ? '#8e9d3f' : '#515d2b'} />
                </Animated.View>
              )}
            </React.Fragment>
          );
        })}

        {/* ── Logout ── */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(400)}
          style={logoutAnimStyle}
        >
          <TouchableOpacity
            style={[styles.logoutBtn, {
              borderColor: isDark ? 'rgba(220,38,38,0.15)' : '#fecaca',
              backgroundColor: isDark ? 'rgba(220,38,38,0.05)' : c.errorBg,
            }]}
            onPress={handleLogout}
            onPressIn={() => { logoutScale.value = withSpring(0.95, SPRING.snappy); }}
            onPressOut={() => { logoutScale.value = withSpring(1, SPRING.snappy); }}
            activeOpacity={1}
          >
            <Ionicons name="log-out-outline" size={18} color={c.error} />
            <Text style={{ fontWeight: '600', fontSize: 15, color: c.error }}>Çıkış Yap</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.Text
          entering={FadeIn.delay(700).duration(400)}
          style={{ textAlign: 'center', fontSize: 12, marginTop: 20, color: c.textMuted }}
        >
          NetTapu v1.0.0
        </Animated.Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 14 },
  loginIconWrap: {
    width: 90, height: 90, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  loginTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 14, gap: 8, width: '100%', maxWidth: 260,
  },

  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 20 },
  avatarRing: {
    position: 'absolute',
    top: -4, left: '50%', marginLeft: -49,
    width: 98, height: 98, borderRadius: 30,
    borderWidth: 3,
  },
  avatar: {
    width: 90, height: 90, borderRadius: 28, borderWidth: 3, marginBottom: 14,
  },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 32, fontWeight: '700' },
  cameraIcon: {
    position: 'absolute', bottom: 12, right: -4,
    width: 28, height: 28, borderRadius: 14, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  profileName: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, marginBottom: 4 },

  statsRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 16,
    paddingHorizontal: 20,
  },
  statItem: { alignItems: 'center', paddingHorizontal: 18 },
  statValue: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  statLabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  statDivider: { width: 1, height: 28, opacity: 0.5 },

  sectionLabel: {
    fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5,
    paddingHorizontal: 20, marginBottom: 8,
  },
  menuCard: {
    marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12,
  },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500' },

  proBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 24,
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 16, borderWidth: 1,
  },
  proBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#515d2b', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8,
  },
  proBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  proTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  proSubtitle: { fontSize: 12, fontWeight: '500' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 20, marginTop: 24, paddingVertical: 15,
    borderRadius: 14, borderWidth: 1, gap: 8,
  },
});
