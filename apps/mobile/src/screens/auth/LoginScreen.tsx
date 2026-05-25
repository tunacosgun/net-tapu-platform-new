import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  FadeIn,
  SlideInDown,
  FadeInDown,
  runOnJS,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import LinearGradient from 'react-native-linear-gradient';
import { loginSchema } from '../../lib/validators';
import { useAuthStore } from '../../stores/auth-store';
import { useSettingsStore } from '../../stores/settings-store';
import apiClient, { RateLimitError } from '../../api/client';
import { Input } from '../../components/ui';
import { useTheme } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import type { LoginResponse } from '../../types';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SPRING, TIMING } from '../../lib/animations';

// Google Sign-In — lazy load
let GoogleSignin: any = null;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  GoogleSignin.configure({
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  });
} catch {}

// Apple Sign-In — lazy load
let appleAuth: any = null;
try {
  appleAuth = require('@invertase/react-native-apple-authentication').appleAuth;
} catch {}

const { width: SCREEN_W } = Dimensions.get('window');

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type Nav = NativeStackNavigationProp<RootStackParamList>;
type FormData = { email: string; password: string };

// Stagger timing constants
const LOGO_DELAY = 0;
const WELCOME_DELAY = 150;
const FORM_DELAY = 300;
const FIELD_STAGGER = 60;
const FOOTER_DELAY = 650;
const TRUST_DELAY = 850;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const setTokens = useAuthStore((s) => s.setTokens);
  const settings = useSettingsStore((s) => s.settings);
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  // Press scale shared values
  const loginBtnScale = useSharedValue(1);
  const googleBtnScale = useSharedValue(1);
  const appleBtnScale = useSharedValue(1);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    loginBtnScale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withSpring(1, SPRING.snappy),
    );
    try {
      const { data: res } = await apiClient.post<LoginResponse>('/auth/login', data);
      await setTokens(res.accessToken, res.refreshToken);
    } catch (err: any) {
      if (err instanceof RateLimitError) {
        Alert.alert('Çok fazla deneme', `Lütfen ${err.retryAfter} saniye bekleyin.`);
      } else {
        const msg = err?.response?.data?.message || 'Giriş başarısız';
        Alert.alert('Hata', Array.isArray(msg) ? msg[0] : msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (!GoogleSignin) {
      Alert.alert('Google ile Giriş', 'Google OAuth entegrasyonu yakında aktif olacak.');
      return;
    }
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      if (!idToken) throw new Error('Google ID token alınamadı');
      const { data: res } = await apiClient.post<LoginResponse>('/auth/google/one-tap', {
        credential: idToken,
        deviceInfo: Platform.OS,
      });
      await setTokens(res.accessToken, res.refreshToken);
    } catch (err: any) {
      if (err?.code === 'SIGN_IN_CANCELLED') return;
      const msg = err?.response?.data?.message || err?.message || 'Google ile giriş başarısız';
      Alert.alert('Hata', msg);
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleAppleLogin() {
    if (!appleAuth || !appleAuth.isSupported) {
      Alert.alert('Hata', 'Apple ile Giriş bu cihazda desteklenmiyor.');
      return;
    }
    setAppleLoading(true);
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });
      
      const { identityToken, email, fullName } = appleAuthRequestResponse;
      if (!identityToken) throw new Error('Apple identity token alınamadı');
      
      const { data: res } = await apiClient.post<LoginResponse>('/auth/apple/identity-token', {
        identityToken,
        email,
        firstName: fullName?.givenName,
        lastName: fullName?.familyName,
      });
      await setTokens(res.accessToken, res.refreshToken);
    } catch (err: any) {
      if (err.code === appleAuth.Error.CANCELED) return;
      const msg = err?.response?.data?.message || err?.message || 'Apple ile giriş başarısız';
      Alert.alert('Hata', Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setAppleLoading(false);
    }
  }

  // Animated styles for button presses
  const loginBtnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: loginBtnScale.value }],
  }));

  const googleBtnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: googleBtnScale.value }],
  }));

  const appleBtnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: appleBtnScale.value }],
  }));

  const onLoginPressIn = useCallback(() => {
    loginBtnScale.value = withTiming(0.96, { duration: 100 });
  }, []);

  const onLoginPressOut = useCallback(() => {
    loginBtnScale.value = withSpring(1, SPRING.snappy);
  }, []);

  const onGooglePressIn = useCallback(() => {
    googleBtnScale.value = withTiming(0.97, { duration: 100 });
  }, []);

  const onGooglePressOut = useCallback(() => {
    googleBtnScale.value = withSpring(1, SPRING.snappy);
  }, []);

  const onApplePressIn = useCallback(() => {
    appleBtnScale.value = withTiming(0.97, { duration: 100 });
  }, []);

  const onApplePressOut = useCallback(() => {
    appleBtnScale.value = withSpring(1, SPRING.snappy);
  }, []);

  const isDark = theme.isDark;
  const c = theme.colors;

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#0a0f1a' : '#f8faf9' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Logo Section — bouncy spring entrance */}
            <Animated.View
              entering={FadeInDown.delay(LOGO_DELAY)
                .duration(500)
                .springify()
                .damping(SPRING.bouncy.damping)
                .stiffness(SPRING.bouncy.stiffness)
                .mass(SPRING.bouncy.mass)}
              style={styles.logoSection}
            >
              {settings?.site_logo ? (
                <Animated.Image 
                  source={{ uri: settings.site_logo }} 
                  style={{ width: 140, height: 60, resizeMode: 'contain', marginBottom: 10 }}
                />
              ) : (
                <>
                  <LinearGradient
                    colors={isDark ? [c.primaryLight, c.primary] : [c.primary, c.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.logoGradient}
                  >
                    <Ionicons name="business-outline" size={26} color="#fff" />
                  </LinearGradient>
                  <Text style={[styles.brandName, { color: c.text }]}>
                    {settings?.site_title ? settings.site_title : <>Net<Text style={{ color: c.primary }}>Tapu</Text></>}
                  </Text>
                  <Text style={[styles.tagline, { color: c.textMuted }]}>
                    Arsa & Açık Artırma Platformu
                  </Text>
                </>
              )}
            </Animated.View>

            {/* Welcome Text — fade in after logo */}
            <Animated.View
              entering={FadeInDown.delay(WELCOME_DELAY)
                .duration(400)
                .easing(TIMING.entrance.easing)}
              style={styles.welcomeSection}
            >
              <Text style={[styles.welcomeTitle, { color: c.text }]}>
                Tekrar hoş geldiniz
              </Text>
              <Text style={[styles.welcomeDesc, { color: c.textSecondary }]}>
                Hesabınıza giriş yaparak devam edin
              </Text>
            </Animated.View>

            {/* Form Container — slides up with smooth spring */}
            <Animated.View
              entering={SlideInDown.delay(FORM_DELAY)
                .duration(500)
                .springify()
                .damping(SPRING.smooth.damping)
                .stiffness(SPRING.smooth.stiffness)
                .mass(SPRING.smooth.mass)}
              style={[styles.formContainer, {
                backgroundColor: isDark ? c.card : '#ffffff',
                borderColor: isDark ? c.border : '#e8ebe9',
              }]}
            >
              {/* Social Buttons */}
              <Animated.View
                entering={FadeInDown.delay(FORM_DELAY + FIELD_STAGGER * 0)
                  .duration(350)
                  .easing(TIMING.entrance.easing)}
                style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}
              >
                {/* Google Button */}
                <Animated.View style={[googleBtnAnimStyle, { flex: 1 }]}>
                  <TouchableOpacity
                    style={[styles.socialBtn, {
                      backgroundColor: isDark ? c.surface : '#ffffff',
                      borderColor: isDark ? c.border : '#e2e5e3',
                    }]}
                    onPress={handleGoogleLogin}
                    onPressIn={onGooglePressIn}
                    onPressOut={onGooglePressOut}
                    activeOpacity={0.9}
                    disabled={googleLoading}
                  >
                    {googleLoading ? (
                      <ActivityIndicator size="small" color={c.textSecondary} />
                    ) : (
                      <>
                        <Ionicons name="logo-google" size={18} color="#4285F4" style={{ marginRight: 8 }} />
                        <Text style={[styles.socialLabel, { color: c.text }]}>Google</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </Animated.View>
                
                {/* Apple Button */}
                {(Platform.OS === 'ios' || appleAuth?.isSupported) && (
                  <Animated.View style={[appleBtnAnimStyle, { flex: 1 }]}>
                    <TouchableOpacity
                      style={[styles.socialBtn, {
                        backgroundColor: isDark ? c.text : c.text,
                        borderColor: isDark ? c.border : c.text,
                      }]}
                      onPress={handleAppleLogin}
                      onPressIn={onApplePressIn}
                      onPressOut={onApplePressOut}
                      activeOpacity={0.9}
                      disabled={appleLoading}
                    >
                      {appleLoading ? (
                        <ActivityIndicator size="small" color={c.surface} />
                      ) : (
                        <>
                          <Ionicons name="logo-apple" size={18} color={c.surface} style={{ marginRight: 8 }} />
                          <Text style={[styles.socialLabel, { color: c.surface }]}>Apple</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </Animated.View>

              {/* Separator — stagger index 1 */}
              <Animated.View
                entering={FadeIn.delay(FORM_DELAY + FIELD_STAGGER * 1).duration(300)}
              >
                <View style={styles.separator}>
                  <View style={[styles.separatorLine, { backgroundColor: isDark ? c.border : '#edf0ee' }]} />
                  <View style={[styles.separatorPill, { backgroundColor: isDark ? c.card : '#ffffff' }]}>
                    <Text style={[styles.separatorText, { color: c.textMuted }]}>veya</Text>
                  </View>
                  <View style={[styles.separatorLine, { backgroundColor: isDark ? c.border : '#edf0ee' }]} />
                </View>
              </Animated.View>

              {/* Email Field — stagger index 2 */}
              <Animated.View
                entering={FadeInDown.delay(FORM_DELAY + FIELD_STAGGER * 2)
                  .duration(350)
                  .easing(TIMING.entrance.easing)}
              >
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="E-posta Adresi"
                      placeholder="ornek@email.com"
                      leftIcon="mail-outline"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={value}
                      onChangeText={onChange}
                      error={errors.email?.message}
                    />
                  )}
                />
              </Animated.View>

              {/* Password Field — stagger index 3 */}
              <Animated.View
                entering={FadeInDown.delay(FORM_DELAY + FIELD_STAGGER * 3)
                  .duration(350)
                  .easing(TIMING.entrance.easing)}
              >
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Şifre"
                      placeholder="Şifrenizi girin"
                      leftIcon="lock-closed-outline"
                      isPassword
                      value={value}
                      onChangeText={onChange}
                      error={errors.password?.message}
                    />
                  )}
                />
              </Animated.View>

              {/* Forgot Password — stagger index 4 */}
              <Animated.View
                entering={FadeIn.delay(FORM_DELAY + FIELD_STAGGER * 4).duration(300)}
              >
                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  style={styles.forgotBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={[styles.forgotText, { color: c.primary }]}>Şifremi unuttum</Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Login Button — stagger index 5, with press scale */}
              <Animated.View
                entering={FadeInDown.delay(FORM_DELAY + FIELD_STAGGER * 5)
                  .duration(400)
                  .easing(TIMING.entrance.easing)}
              >
                <Animated.View style={loginBtnAnimStyle}>
                  <TouchableOpacity
                    onPress={handleSubmit(onSubmit)}
                    onPressIn={onLoginPressIn}
                    onPressOut={onLoginPressOut}
                    activeOpacity={0.9}
                    disabled={loading}
                    style={{ borderRadius: 14, overflow: 'hidden' }}
                  >
                    <LinearGradient
                      colors={loading ? [c.primaryLight, c.primaryLight] : [c.primary, c.primaryDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.loginBtn}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.loginBtnText}>Giriş Yap</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            </Animated.View>

            {/* Footer — fade in after form */}
            <Animated.View
              entering={FadeInDown.delay(FOOTER_DELAY)
                .duration(400)
                .easing(TIMING.entrance.easing)}
              style={styles.footer}
            >
              <Text style={[styles.footerText, { color: c.textMuted }]}>
                Henüz hesabınız yok mu?
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.footerLink, { color: c.primary }]}> Üye Ol</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Üye olmadan devam et (guest mode) */}
            <TouchableOpacity
              onPress={() => navigation.navigate('MainTabs' as never)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{ marginTop: 14, alignSelf: 'center' }}
            >
              <Text style={{ color: c.textMuted, fontSize: 14, fontWeight: '600' }}>
                Üye olmadan devam et
              </Text>
            </TouchableOpacity>

            {/* Trust Badges — fade in last */}
            <Animated.View
              entering={FadeIn.delay(TRUST_DELAY).duration(500)}
              style={styles.trustRow}
            >
              {[
                { icon: 'shield-checkmark-outline', label: 'SSL Güvenli' },
                { icon: 'lock-closed-outline', label: 'KVKK Uyumlu' },
                { icon: 'card-outline', label: '3D Secure' },
              ].map((item) => (
                <View key={item.label} style={styles.trustBadge}>
                  <Ionicons name={item.icon} size={14} color={c.textMuted} />
                  <Text style={[styles.trustLabel, { color: c.textMuted }]}>{item.label}</Text>
                </View>
              ))}
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoGradient: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#6d7a32',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.3,
  },

  // Welcome
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  welcomeDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },

  // Form
  formContainer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },

  // Social Buttons
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  socialLabel: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Separator
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
  },
  separatorPill: {
    paddingHorizontal: 14,
  },
  separatorText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'lowercase',
  },

  // Forgot
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -6,
    marginBottom: 18,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Login Button
  loginBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Trust
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 32,
    paddingBottom: 20,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
