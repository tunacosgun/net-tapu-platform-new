import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, {
  FadeInDown, FadeIn, SlideInUp,
  useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming, withDelay,
} from 'react-native-reanimated';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import type { RouteProp, NavigationProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../api/client';
import { useTheme } from '../../theme';
import { formatPrice } from '../../lib/format';
import { SPRING } from '../../lib/animations';
import { useAuctionStore } from '../../stores/auction-store';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type ResultStatus = 'polling' | 'success' | 'failed' | 'timeout';

function AnimatedDots({ color }: { color: string }) {
  const dot0 = useSharedValue(0.3);
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);

  useEffect(() => {
    dot0.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 }),
      ),
      -1,
    );
    dot1.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
      ),
    );
    dot2.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
      ),
    );
  }, []);

  const s0 = useAnimatedStyle(() => ({ transform: [{ scale: dot0.value }], opacity: dot0.value }));
  const s1 = useAnimatedStyle(() => ({ transform: [{ scale: dot1.value }], opacity: dot1.value }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ scale: dot2.value }], opacity: dot2.value }));

  return (
    <View style={styles.progressDots}>
      <Animated.View style={[styles.dot, { backgroundColor: color }, s0]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, s1]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, s2]} />
    </View>
  );
}

export default function PaymentResultScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'PaymentResult'>>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const theme = useTheme();

  const { paymentId, auctionId, status: initialStatus } = route.params;
  const [resultStatus, setResultStatus] = useState<ResultStatus>(
    initialStatus === 'success' ? 'success' : initialStatus === 'failed' ? 'failed' : 'polling'
  );
  const [paymentAmount, setPaymentAmount] = useState<string | null>(null);
  const pollCount = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Success: bounce in
  const successScale = useSharedValue(0);
  // Failed: shake
  const failShakeX = useSharedValue(0);
  // Timeout: pulse
  const timeoutScale = useSharedValue(1);

  useEffect(() => {
    if (resultStatus === 'success') {
      successScale.value = withSequence(
        withSpring(1.2, SPRING.bouncy),
        withSpring(1, SPRING.snappy),
      );
    } else if (resultStatus === 'failed') {
      failShakeX.value = withSequence(
        withTiming(-12, { duration: 60 }),
        withTiming(12, { duration: 60 }),
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(-6, { duration: 60 }),
        withTiming(6, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
    } else if (resultStatus === 'timeout') {
      timeoutScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000 }),
          withTiming(1, { duration: 1000 }),
        ),
        -1,
        true,
      );
    }
  }, [resultStatus]);

  const successCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  const failCircleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: failShakeX.value }],
  }));

  const timeoutCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timeoutScale.value }],
  }));

  useEffect(() => {
    if (resultStatus !== 'polling') return;

    const poll = async () => {
      try {
        const { data } = await apiClient.get(`/payments/${paymentId}`);
        setPaymentAmount(data.amount);

        if (data.status === 'provisioned' || data.status === 'completed') {
          setResultStatus('success');
          // Update auction store deposit status
          useAuctionStore.getState().setUserDeposit(data);
          return;
        }
        if (data.status === 'failed' || data.status === 'cancelled') {
          setResultStatus('failed');
          return;
        }
      } catch {
        // Continue polling on network error
      }

      pollCount.current += 1;
      if (pollCount.current >= 15) {
        setResultStatus('timeout');
        return;
      }

      // Poll every 2 seconds
      pollTimer.current = setTimeout(poll, 2000);
    };

    poll();

    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, [resultStatus, paymentId]);

  const goToAuction = () => {
    // Pop all payment screens and go back to LiveAuction
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'Main' },
          { name: 'LiveAuction', params: { id: auctionId } },
        ],
      })
    );
  };

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.center}>
        {resultStatus === 'polling' && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.statusWrap}>
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginBottom: 20 }} />
            <Text style={[styles.title, { color: theme.colors.text }]}>Ödeme İşleniyor</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Bankanızdan onay bekleniyor...{'\n'}Lütfen bu ekrandan ayrılmayın.
            </Text>
            <AnimatedDots color={theme.colors.primary} />
          </Animated.View>
        )}

        {resultStatus === 'success' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.statusWrap}>
            <Animated.View style={[styles.successCircle, successCircleStyle]}>
              <Text style={styles.successIcon}>✓</Text>
            </Animated.View>
            <Animated.Text entering={FadeInDown.delay(200).duration(400)} style={[styles.title, { color: '#15803d' }]}>Ödeme Başarılı!</Animated.Text>
            <Animated.Text entering={FadeInDown.delay(300).duration(400)} style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Kaparonuz başarıyla yatırıldı.{'\n'}Artık ihaleye teklif verebilirsiniz.
            </Animated.Text>
            {paymentAmount && (
              <Animated.Text entering={FadeInDown.delay(400).duration(400)} style={[styles.amount, { color: theme.colors.primary }]}>
                {formatPrice(paymentAmount)}
              </Animated.Text>
            )}
            <Animated.View entering={FadeInDown.delay(500).duration(400)}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
                onPress={goToAuction}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>İhaleye Dön</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        )}

        {resultStatus === 'failed' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.statusWrap}>
            <Animated.View style={[styles.failCircle, failCircleStyle]}>
              <Text style={styles.failIcon}>✕</Text>
            </Animated.View>
            <Animated.Text entering={FadeInDown.delay(200).duration(400)} style={[styles.title, { color: '#dc2626' }]}>Ödeme Başarısız</Animated.Text>
            <Animated.Text entering={FadeInDown.delay(300).duration(400)} style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Ödemeniz gerçekleştirilemedi.{'\n'}Lütfen kart bilgilerinizi kontrol edip tekrar deneyin.
            </Animated.Text>
            <Animated.View entering={FadeInDown.delay(400).duration(400)}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
                onPress={goBack}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>Tekrar Dene</Text>
              </TouchableOpacity>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(500).duration(400)}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={goToAuction}>
                <Text style={[styles.secondaryBtnText, { color: theme.colors.textSecondary }]}>İhaleye Dön</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        )}

        {resultStatus === 'timeout' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.statusWrap}>
            <Animated.View style={[styles.failCircle, { backgroundColor: '#fef3c7', borderColor: '#fbbf24' }, timeoutCircleStyle]}>
              <Text style={[styles.failIcon, { color: '#d97706' }]}>⏳</Text>
            </Animated.View>
            <Animated.Text entering={FadeInDown.delay(200).duration(400)} style={[styles.title, { color: '#d97706' }]}>İşlem Sürüyor</Animated.Text>
            <Animated.Text entering={FadeInDown.delay(300).duration(400)} style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Ödeme onayı henüz alınamadı. İşleminiz arka planda devam ediyor olabilir.
              Ödemelerim sayfasından durumu kontrol edebilirsiniz.
            </Animated.Text>
            <Animated.View entering={FadeInDown.delay(400).duration(400)}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
                onPress={goToAuction}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>İhaleye Dön</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  statusWrap: { alignItems: 'center', width: '100%' },

  title: { fontSize: 24, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  amount: { fontSize: 28, fontWeight: '800', marginBottom: 24 },

  progressDots: { flexDirection: 'row', gap: 8, marginTop: 16 },
  dot: { width: 10, height: 10, borderRadius: 5 },

  successCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#dcfce7', borderWidth: 3, borderColor: '#22c55e',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  successIcon: { fontSize: 36, fontWeight: '800', color: '#22c55e' },

  failCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#fef2f2', borderWidth: 3, borderColor: '#ef4444',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  failIcon: { fontSize: 36, fontWeight: '800', color: '#ef4444' },

  primaryBtn: {
    width: '100%', height: 56, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  secondaryBtn: { paddingVertical: 12 },
  secondaryBtnText: { fontSize: 15, fontWeight: '600' },
});
