import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../../api/client';
import { useTheme } from '../../theme';

type Ticket = { id: string };

export default function SupportNewTicketScreen() {
  const navigation = useNavigation<any>();
  const { colors: c, isDark } = useTheme();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!subject.trim()) {
      Alert.alert('Eksik bilgi', 'Konu zorunludur');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await apiClient.post<Ticket>('/support/tickets', {
        subject: subject.trim(),
        initialMessage: message.trim() || undefined,
      });
      // Replace this screen with the chat view so back goes to the list.
      navigation.replace('SupportChat', { ticketId: data.id });
    } catch {
      Alert.alert('Hata', 'Konuşma oluşturulamadı');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: isDark ? c.borderLight : c.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.text }]}>Yeni Konuşma</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          <View style={[styles.hero, { backgroundColor: c.primary + '14' }]}>
            <View style={[styles.heroIcon, { backgroundColor: c.primary }]}>
              <Ionicons name="chatbubbles" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroTitle, { color: c.text }]}>Size nasıl yardımcı olabiliriz?</Text>
              <Text style={[styles.heroSub, { color: c.textMuted }]}>
                Sorununuzu yazın, ekibimiz en kısa sürede dönüş yapsın.
              </Text>
            </View>
          </View>

          <Text style={[styles.label, { color: c.textMuted }]}>KONU</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Örn. Depozito iadesi hakkında"
            placeholderTextColor={c.textMuted}
            style={[
              styles.input,
              {
                color: c.text,
                backgroundColor: c.card,
                borderColor: isDark ? c.borderLight : c.border,
              },
            ]}
            maxLength={200}
          />

          <Text style={[styles.label, { color: c.textMuted, marginTop: 16 }]}>MESAJ</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Detayları yazın…"
            placeholderTextColor={c.textMuted}
            multiline
            textAlignVertical="top"
            style={[
              styles.input,
              styles.multiline,
              {
                color: c.text,
                backgroundColor: c.card,
                borderColor: isDark ? c.borderLight : c.border,
              },
            ]}
          />

          <TouchableOpacity
            onPress={submit}
            disabled={!subject.trim() || submitting}
            style={[
              styles.submitBtn,
              {
                backgroundColor: c.primary,
                opacity: !subject.trim() || submitting ? 0.5 : 1,
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.submitText}>Gönder</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.legal, { color: c.textMuted }]}>
            Gönderdiğiniz mesaj destek ekibimize iletilir, ortalama 5 dakika içinde cevap alırsınız.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, marginRight: 4 },
  title: { fontSize: 18, fontWeight: '700' },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 20,
    gap: 12,
  },
  heroIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  heroSub: { fontSize: 12.5, lineHeight: 17 },
  label: {
    fontSize: 11, fontWeight: '800', letterSpacing: 0.7, marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  multiline: { minHeight: 130 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  legal: { fontSize: 11.5, marginTop: 16, textAlign: 'center', lineHeight: 16 },
});
