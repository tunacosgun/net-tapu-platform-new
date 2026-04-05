import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { SPRING, TIMING } from '../../lib/animations';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Floating decorative circle ──────────────────
function FloatingCircle({
  size,
  initialX,
  initialY,
  delay,
}: {
  size: number;
  initialX: number;
  initialY: number;
  delay: number;
}) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 1200 }));
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-18, { duration: 3500 }),
          withTiming(18, { duration: 3500 }),
        ),
        -1,
        true,
      ),
    );
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(12, { duration: 4200 }),
          withTiming(-12, { duration: 4200 }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.07,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#fff',
          left: initialX,
          top: initialY,
        },
        style,
      ]}
    />
  );
}

// ── Animated loading dot ────────────────────────
function LoadingDot({ index }: { index: number }) {
  const scale = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withDelay(
      1800 + index * 180,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.4, { duration: 400 }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [0.4, 1], [0.35, 1], Extrapolation.CLAMP),
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

// ── Brand word reveal piece ─────────────────────
function BrandWord({ text, delay }: { text: string; delay: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, TIMING.entrance));
    translateY.value = withDelay(delay, withSpring(0, SPRING.smooth));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.Text style={[styles.brandPiece, style]}>{text}</Animated.Text>;
}

// ── Main Splash Screen ──────────────────────────
export default function SplashScreen() {
  // Logo entrance
  const logoScale = useSharedValue(0);
  const logoPulse = useSharedValue(1);
  const logoRotate = useSharedValue(-8);

  // Subtitle
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(20);

  useEffect(() => {
    // Logo: bouncy spring in, then subtle pulse
    logoScale.value = withDelay(200, withSpring(1, SPRING.bouncy));
    logoRotate.value = withDelay(200, withSpring(0, SPRING.smooth));
    logoPulse.value = withDelay(
      1200,
      withRepeat(
        withSequence(
          withTiming(1.06, { duration: 1800 }),
          withTiming(1, { duration: 1800 }),
        ),
        -1,
        true,
      ),
    );

    // Subtitle slides up
    subtitleOpacity.value = withDelay(1100, withTiming(1, TIMING.entrance));
    subtitleTranslateY.value = withDelay(1100, withSpring(0, SPRING.smooth));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value * logoPulse.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  return (
    <LinearGradient
      colors={['#064e3b', '#0f3d3e', '#0c1e3a', '#0a1628']}
      locations={[0, 0.35, 0.7, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      {/* Decorative floating circles */}
      <FloatingCircle size={280} initialX={-90} initialY={-80} delay={0} />
      <FloatingCircle size={200} initialX={SCREEN_W - 100} initialY={SCREEN_H * 0.15} delay={400} />
      <FloatingCircle size={160} initialX={SCREEN_W * 0.3} initialY={SCREEN_H * 0.7} delay={200} />
      <FloatingCircle size={120} initialX={-30} initialY={SCREEN_H * 0.55} delay={600} />
      <FloatingCircle size={90} initialX={SCREEN_W - 60} initialY={SCREEN_H * 0.8} delay={800} />

      {/* Logo icon */}
      <Animated.View style={[styles.logoBox, logoStyle]}>
        <View style={styles.logoInner}>
          <Ionicons name="business" size={38} color="#fff" />
        </View>
      </Animated.View>

      {/* Brand text — staggered word reveal */}
      <View style={styles.brandRow}>
        <BrandWord text="Net" delay={600} />
        <BrandWord text="Tapu" delay={780} />
      </View>

      {/* Subtitle */}
      <Animated.Text style={[styles.subtitle, subtitleStyle]}>
        Gayrimenkul & Canli Ihale
      </Animated.Text>

      {/* Custom loading dots */}
      <View style={styles.dotsRow}>
        <LoadingDot index={0} />
        <LoadingDot index={1} />
        <LoadingDot index={2} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBox: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  logoInner: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: 'rgba(16,185,129,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandPiece: {
    fontSize: 44,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 8,
    letterSpacing: 1.5,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: 48,
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
});
