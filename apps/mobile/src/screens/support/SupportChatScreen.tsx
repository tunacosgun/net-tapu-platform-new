import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../../api/client';
import { useTheme } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Ticket = {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'waiting_user' | 'closed';
  unreadUser: number;
  lastMessageAt: string | null;
  createdAt: string;
};

type Message = {
  id: string;
  ticketId: string;
  senderRole: 'user' | 'admin' | 'system' | 'consultant';
  body: string | null;
  attachmentUrl: string | null;
  attachmentType: string | null;
  attachmentName: string | null;
  readAt: string | null;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Yeni',
  in_progress: 'Görüşmede',
  waiting_user: 'Cevap bekleniyor',
  closed: 'Kapalı',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export default function SupportChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'SupportChat'>>();
  const { ticketId } = route.params;
  const { colors: c, isDark } = useTheme();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList<Message>>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await apiClient.get<{ ticket: Ticket; messages: Message[] }>(
        `/support/tickets/${ticketId}`,
      );
      setTicket(data.ticket);
      setMessages(data.messages);
      // Mark as read so the user-side badge clears.
      apiClient.post(`/support/tickets/${ticketId}/read`).catch(() => undefined);
    } catch {
      Alert.alert('Hata', 'Sohbet yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    load();
    // Poll every 6s while the screen is mounted — keeps the user in lockstep
    // with the admin without WebSocket setup. Cheap, stops on unmount.
    const id = setInterval(load, 6000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  async function send() {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setBody(''); // clear immediately for perceived speed
    try {
      await apiClient.post(`/support/tickets/${ticketId}/messages`, { body: text });
      await load();
    } catch {
      Alert.alert('Hata', 'Mesaj gönderilemedi');
      setBody(text); // restore on failure so the user can retry
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: isDark ? c.borderLight : c.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={c.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={[styles.headerTitle, { color: c.text }]}>
            {ticket?.subject || 'Sohbet'}
          </Text>
          <Text style={[styles.headerStatus, { color: c.textMuted }]}>
            {STATUS_LABEL[ticket?.status || 'open']}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 16 }}
          renderItem={({ item }) => {
            if (item.senderRole === 'system') {
              return (
                <View style={styles.systemWrap}>
                  <Text style={[styles.systemText, { color: c.textMuted, backgroundColor: isDark ? '#1f2937' : '#f1f5f9' }]}>
                    {item.body}
                  </Text>
                </View>
              );
            }
            const mine = item.senderRole === 'user';
            return (
              <View style={[styles.msgRow, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
                {!mine && (
                  <View style={[styles.miniAvatar, { backgroundColor: c.primary }]}>
                    <Text style={styles.miniAvatarText}>NT</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.bubble,
                    mine
                      ? { backgroundColor: c.primary, borderBottomRightRadius: 4 }
                      : {
                          backgroundColor: c.card,
                          borderColor: isDark ? c.borderLight : c.border,
                          borderWidth: 1,
                          borderBottomLeftRadius: 4,
                        },
                  ]}
                >
                  {!mine && (
                    <Text style={[styles.senderLabel, { color: c.primary }]}>NetTapu Destek</Text>
                  )}
                  {item.body ? (
                    <Text style={[styles.bubbleText, { color: mine ? '#fff' : c.text }]}>{item.body}</Text>
                  ) : null}
                  <View style={styles.bubbleFooter}>
                    <Text style={[styles.bubbleTime, { color: mine ? 'rgba(255,255,255,0.7)' : c.textMuted }]}>
                      {formatTime(item.createdAt)}
                    </Text>
                    {mine && (
                      <Ionicons
                        name={item.readAt ? 'checkmark-done' : 'checkmark'}
                        size={14}
                        color={item.readAt ? '#a7f3d0' : 'rgba(255,255,255,0.6)'}
                        style={{ marginLeft: 4 }}
                      />
                    )}
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{ paddingTop: 60, alignItems: 'center' }}>
              <Text style={{ color: c.textMuted }}>Henüz mesaj yok</Text>
            </View>
          }
        />

        {ticket?.status === 'closed' ? (
          <View style={[styles.closedBar, { backgroundColor: isDark ? '#1f2937' : '#f1f5f9' }]}>
            <Ionicons name="lock-closed" size={14} color={c.textMuted} />
            <Text style={{ color: c.textMuted, marginLeft: 6, fontSize: 13 }}>
              Bu sohbet kapatıldı
            </Text>
          </View>
        ) : (
          <View style={[styles.composer, { backgroundColor: c.card, borderTopColor: isDark ? c.borderLight : c.border }]}>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Mesajınızı yazın…"
              placeholderTextColor={c.textMuted}
              multiline
              style={[
                styles.input,
                {
                  color: c.text,
                  backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                },
              ]}
            />
            <TouchableOpacity
              onPress={send}
              disabled={sending || !body.trim()}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: c.primary,
                  opacity: sending || !body.trim() ? 0.4 : 1,
                },
              ]}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, marginRight: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerStatus: { fontSize: 12, marginTop: 1 },
  systemWrap: { alignItems: 'center', marginVertical: 6 },
  systemText: {
    fontSize: 11, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  miniAvatar: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', marginRight: 6,
  },
  miniAvatarText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  bubble: {
    maxWidth: '76%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  senderLabel: { fontSize: 10, fontWeight: '800', marginBottom: 2 },
  bubbleText: { fontSize: 14.5, lineHeight: 20 },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 3 },
  bubbleTime: { fontSize: 10 },
  closedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 110,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    fontSize: 15,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
});
