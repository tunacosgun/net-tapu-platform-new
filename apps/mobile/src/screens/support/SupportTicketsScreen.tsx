import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import apiClient from '../../api/client';
import { useTheme } from '../../theme';

type Ticket = {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'waiting_user' | 'closed';
  unreadUser: number;
  lastMessageAt: string | null;
  createdAt: string;
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'Yeni', color: '#1f4a8a', bg: '#dbeafe' },
  in_progress: { label: 'Görüşmede', color: '#c07a1a', bg: '#fef3c7' },
  waiting_user: { label: 'Cevap Bekleniyor', color: '#6d28d9', bg: '#ede9fe' },
  closed: { label: 'Kapalı', color: '#475569', bg: '#e2e8f0' },
};

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'az önce';
  if (min < 60) return `${min} dk önce`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} saat önce`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day} gün önce`;
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
}

export default function SupportTicketsScreen() {
  const navigation = useNavigation<any>();
  const { colors: c, isDark } = useTheme();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const { data } = await apiClient.get<Ticket[]>('/support/tickets');
      setTickets(Array.isArray(data) ? data : []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh whenever the user comes back to this screen (e.g. after sending
  // a message in the chat view — list status counts should be fresh).
  useFocusEffect(
    useCallback(() => {
      fetchTickets();
    }, [fetchTickets]),
  );

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.text }]}>Destek Mesajlarım</Text>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: c.primary }]}
          onPress={() => navigation.navigate('SupportNewTicket')}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchTickets(); }}
              tintColor={c.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#1f2937' : '#f1f5f9' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={32} color={c.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: c.text }]}>Henüz konuşmanız yok</Text>
              <Text style={[styles.emptyDesc, { color: c.textMuted }]}>
                Sorularınız için ekibimizle hemen iletişime geçin.
              </Text>
              <TouchableOpacity
                style={[styles.emptyCta, { backgroundColor: c.primary }]}
                onPress={() => navigation.navigate('SupportNewTicket')}
              >
                <Text style={styles.emptyCtaText}>Yeni Konuşma Başlat</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item, index }) => {
            const st = STATUS_META[item.status];
            return (
              <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.card,
                    {
                      backgroundColor: c.card,
                      borderColor: isDark ? c.borderLight : c.border,
                    },
                  ]}
                  onPress={() => navigation.navigate('SupportChat', { ticketId: item.id })}
                >
                  <View style={[styles.avatar, { backgroundColor: c.primary + '22' }]}>
                    <Text style={[styles.avatarText, { color: c.primary }]}>
                      {item.subject.charAt(0).toUpperCase()}
                    </Text>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: st.color, borderColor: c.card },
                    ]} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.row}>
                      <Text
                        numberOfLines={1}
                        style={[styles.subject, { color: c.text }]}
                      >
                        {item.subject}
                      </Text>
                      {item.unreadUser > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>{item.unreadUser}</Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.row, { marginTop: 4 }]}>
                      <View style={[styles.pill, { backgroundColor: st.bg }]}>
                        <Text style={[styles.pillText, { color: st.color }]}>{st.label}</Text>
                      </View>
                      <Text style={[styles.time, { color: c.textMuted }]}>
                        {formatRelativeTime(item.lastMessageAt || item.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
                </TouchableOpacity>
              </Animated.View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: 20, fontWeight: '700' },
  newBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
    alignItems: 'center', justifyContent: 'center',
    paddingTop: 60, paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptyDesc: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  emptyCta: {
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
  },
  emptyCtaText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  avatarText: { fontSize: 16, fontWeight: '800' },
  statusDot: {
    position: 'absolute', bottom: -1, right: -1,
    width: 12, height: 12, borderRadius: 6, borderWidth: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subject: { fontSize: 15, fontWeight: '700', flex: 1 },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: '700' },
  time: { fontSize: 11 },
  unreadBadge: {
    minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10,
    backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center',
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
