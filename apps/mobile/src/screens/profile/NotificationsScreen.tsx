import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  FadeInRight, FadeIn, useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../../api/client';
import { useTheme } from '../../theme';
import { formatDate } from '../../lib/format';
import { SPRING } from '../../lib/animations';

interface Notification {
  id: string; title: string; body: string; type: string; readAt: string | null; createdAt: string;
}

function PulsingDot({ color }: { color: string }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.unreadDot, { backgroundColor: color }, animStyle]} />;
}

export default function NotificationsScreen() {
  const { colors: c, isDark } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchData() {
    try { const { data } = await apiClient.get('/notifications'); setNotifications(data.data || data); } catch {}
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function markRead(id: string) {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
    } catch {}
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <Text style={[styles.title, { color: c.text }]}>Bildirimler</Text>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchData(); setRefreshing(false); }} tintColor={c.primary} />}
        renderItem={({ item, index }) => {
          const isUnread = !item.readAt;
          return (
            <Animated.View entering={FadeInRight.delay(index * 50).springify()}>
              <TouchableOpacity
                onPress={() => isUnread && markRead(item.id)}
                activeOpacity={0.7}
                style={[styles.card, { backgroundColor: c.card, borderColor: isDark ? c.borderLight : c.border }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nTitle, { color: c.text, fontWeight: isUnread ? '700' : '400' }]}>{item.title}</Text>
                  <Text style={[styles.nBody, { color: c.textSecondary }]} numberOfLines={2}>{item.body}</Text>
                  <Text style={[styles.nTime, { color: c.textMuted }]}>{formatDate(item.createdAt, 'datetime')}</Text>
                </View>
                {isUnread && <PulsingDot color={c.primary} />}
              </TouchableOpacity>
            </Animated.View>
          );
        }}
        ListEmptyComponent={!loading ? (
          <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.empty}>
            <Ionicons name="notifications-outline" size={48} color={c.textMuted} />
            <Text style={[styles.emptyTitle, { color: c.text }]}>Henüz bildiriminiz yok</Text>
            <Text style={[styles.emptyDesc, { color: c.textSecondary }]}>İhale ve ilan bildirimleriniz burada görünecek</Text>
          </Animated.View>
        ) : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.4, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1 },
  nTitle: { fontSize: 15, marginBottom: 2 },
  nBody: { fontSize: 13, fontWeight: '400', lineHeight: 18, marginBottom: 4 },
  nTime: { fontSize: 12, fontWeight: '400' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 100, gap: 10, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyDesc: { fontSize: 14, fontWeight: '400', textAlign: 'center', lineHeight: 20 },
});
