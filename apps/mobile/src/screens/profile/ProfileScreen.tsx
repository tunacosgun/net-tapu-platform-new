import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../stores/auth-store';
import apiClient from '../../api/client';

interface ProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { colors: c, isDark, shadows, borderRadius: br, spacing: sp } = useTheme();
  const { user, isAuthenticated, clearTokens, avatarUrl } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);

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
          <View style={[styles.loginIconWrap, { backgroundColor: isDark ? c.surface : c.primaryBg }]}>
            <Ionicons name="person-outline" size={40} color={c.primary} />
          </View>
          <Text style={[styles.loginTitle, { color: c.text }]}>Hesabınıza giriş yapın</Text>
          <Text style={{ fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 20 }}>
            İlanları favorileyin, ihalelere katılın ve daha fazlası
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
            style={[styles.loginBtn, { backgroundColor: c.primary }]}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Giriş Yap</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} style={{ position: 'relative' }}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={[styles.avatar, { borderColor: c.border }]} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder, {
                backgroundColor: isDark ? c.surface : c.primaryBg,
                borderColor: c.border,
              }]}>
                <Text style={[styles.avatarInitial, { color: c.primary }]}>{initial}</Text>
              </View>
            )}
            {/* Camera icon */}
            <View style={[styles.cameraIcon, { backgroundColor: c.primary, borderColor: c.background }]}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.profileName, { color: c.text }]}>{displayName}</Text>
          <Text style={{ fontSize: 14, color: c.textMuted }}>{user?.email}</Text>
          {profile?.phone && (
            <Text style={{ fontSize: 13, color: c.textMuted, marginTop: 2 }}>{profile.phone}</Text>
          )}
        </View>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} style={{ marginBottom: sp.lg }}>
            <Text style={[styles.sectionLabel, { color: c.textMuted }]}>{section.title}</Text>
            <View style={[styles.menuCard, {
              backgroundColor: c.card,
              borderColor: c.border,
            }, shadows.sm]}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, i < section.items.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? c.borderLight : '#f1f5f9',
                  }]}
                  onPress={() => navigation.navigate(item.screen)}
                  activeOpacity={0.6}
                >
                  <View style={[styles.menuIconWrap, { backgroundColor: item.color + '12' }]}>
                    <Ionicons name={item.icon as any} size={18} color={item.color} />
                  </View>
                  <Text style={[styles.menuLabel, { color: c.text }]}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, {
            borderColor: isDark ? 'rgba(220,38,38,0.15)' : '#fecaca',
            backgroundColor: isDark ? 'rgba(220,38,38,0.05)' : c.errorBg,
          }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={18} color={c.error} />
          <Text style={{ fontWeight: '600', fontSize: 15, color: c.error }}>Çıkış Yap</Text>
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', fontSize: 12, marginTop: 20, color: c.textMuted }}>NetTapu v1.0.0</Text>
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

  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 28 },
  avatar: {
    width: 90, height: 90, borderRadius: 28, borderWidth: 2, marginBottom: 14,
  },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 32, fontWeight: '700' },
  cameraIcon: {
    position: 'absolute', bottom: 12, right: -4,
    width: 28, height: 28, borderRadius: 14, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  profileName: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, marginBottom: 4 },

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

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 20, marginTop: 24, paddingVertical: 15,
    borderRadius: 14, borderWidth: 1, gap: 8,
  },
});
