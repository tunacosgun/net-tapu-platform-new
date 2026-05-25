import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import apiClient from '../../api/client';
import { useTheme } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';

export function BecomeConsultantScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors: c, isDark } = useTheme();

  const [form, setForm] = useState({ fullName: '', phone: '', email: '', city: '', experience: '' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<typeof form> = {};
    if (form.fullName.trim().length < 3) errs.fullName = 'Ad Soyad en az 3 karakter';
    if (!/^[0-9+\-\s()]{10,}$/.test(form.phone)) errs.phone = 'Geçerli bir telefon girin';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Geçerli bir e-posta girin';
    if (form.city.trim().length < 2) errs.city = 'Şehir bilgisi gerekli';
    if (form.experience.trim().length < 20) errs.experience = 'En az 20 karakter açıklama';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const message = [
        '[DANIŞMAN BAŞVURUSU]',
        `Şehir/Bölge: ${form.city}`,
        '',
        'Deneyim & Tanıtım:',
        form.experience,
      ].join('\n');
      await apiClient.post('/crm/contact-requests', {
        type: 'general',
        name: form.fullName,
        phone: form.phone,
        email: form.email,
        message,
      });
      setDone(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Başvuru gönderilemedi';
      Alert.alert('Hata', Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.successWrap}>
          <Animated.View entering={FadeIn.duration(500)} style={[styles.successIcon, { backgroundColor: '#10b981' }]}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </Animated.View>
          <Text style={[styles.successTitle, { color: c.text }]}>Başvurunuz alındı</Text>
          <Text style={[styles.successDesc, { color: c.textMuted }]}>
            Ekibimiz başvurunuzu inceleyip 2-3 iş günü içinde size dönecektir.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.btn, { backgroundColor: c.primary, marginTop: 20 }]}
          >
            <Text style={styles.btnTxt}>Tamam</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={26} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>Danışman Olun</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <LinearGradient
            colors={['#065f46', '#10b981']}
            style={styles.hero}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Animated.View entering={FadeInDown.duration(500)} style={styles.heroIconWrap}>
              <Ionicons name="people" size={32} color="#fff" />
            </Animated.View>
            <Animated.Text entering={FadeInDown.delay(100).duration(500)} style={styles.heroTitle}>
              NetTapu Danışmanı Olun
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(200).duration(500)} style={styles.heroDesc}>
              Bölgenizde NetTapu'yu temsil edin. Kendi portföyünüzü yönetin, alıcı ile satıcıyı buluşturun, komisyon kazanın.
            </Animated.Text>
          </LinearGradient>

          <View style={styles.form}>
            <Field label="Ad Soyad" icon="person-outline" value={form.fullName} onChangeText={(v) => set('fullName', v)} placeholder="Ali Yılmaz" error={errors.fullName} c={c} isDark={isDark} />
            <Field label="Telefon" icon="call-outline" value={form.phone} onChangeText={(v) => set('phone', v)} placeholder="05XX XXX XX XX" keyboardType="phone-pad" error={errors.phone} c={c} isDark={isDark} />
            <Field label="E-posta" icon="mail-outline" value={form.email} onChangeText={(v) => set('email', v)} placeholder="ornek@email.com" keyboardType="email-address" autoCapitalize="none" error={errors.email} c={c} isDark={isDark} />
            <Field label="Şehir / Bölge" icon="location-outline" value={form.city} onChangeText={(v) => set('city', v)} placeholder="Antalya / Manavgat" error={errors.city} c={c} isDark={isDark} />
            <Field
              label="Deneyim & Kendinizden Bahsedin"
              icon="briefcase-outline"
              value={form.experience}
              onChangeText={(v) => set('experience', v)}
              placeholder="Emlak deneyiminiz, çalıştığınız bölgeler, neden NetTapu danışmanı olmak istiyorsunuz..."
              multiline
              numberOfLines={5}
              error={errors.experience}
              c={c} isDark={isDark}
            />

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.btn, { backgroundColor: c.primary, opacity: loading ? 0.6 : 1, marginTop: 8 }]}
              activeOpacity={0.85}
            >
              <Text style={styles.btnTxt}>{loading ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}</Text>
              {!loading && <Ionicons name="arrow-forward" size={20} color="#fff" />}
            </TouchableOpacity>

            <Text style={[styles.footerNote, { color: c.textMuted }]}>
              Başvurunuz NetTapu CRM ekibine iletilir ve KVKK kapsamında işlenir.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, icon, value, onChangeText, placeholder, keyboardType, autoCapitalize, multiline, numberOfLines, error, c, isDark }: any) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.fieldLabel, { color: c.text }]}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: isDark ? c.surface : '#fff', borderColor: error ? '#ef4444' : c.border }]}>
        <Ionicons name={icon} size={18} color={c.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={{ flex: 1, color: c.text, fontSize: 15, textAlignVertical: multiline ? 'top' : 'center', minHeight: multiline ? 100 : 0 }}
        />
      </View>
      {error && <Text style={styles.errorTxt}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  hero: { padding: 24, paddingTop: 32, paddingBottom: 36, alignItems: 'center' },
  heroIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8, textAlign: 'center' },
  heroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.92)', textAlign: 'center', lineHeight: 20 },
  form: { padding: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  errorTxt: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footerNote: { fontSize: 11, textAlign: 'center', marginTop: 14 },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  successIcon: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  successDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
