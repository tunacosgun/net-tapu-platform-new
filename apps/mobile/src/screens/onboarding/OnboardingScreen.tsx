import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withDelay,
  interpolate,
  Extrapolation,
  runOnJS,
  useDerivedValue,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useTheme } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { SPRING, TIMING } from '../../lib/animations';

const { width, height } = Dimensions.get('window');
const ICON_SIZE = 120;
const RING_OUTER = 200;
const RING_MIDDLE = 170;

const slides = [
  {
    icon: 'map-outline' as const,
    color: '#6d7a32',
    gradient: ['#6d7a32', '#059669'] as [string, string],
    title: 'Arsa & Gayrimenkul',
    desc: 'Türkiye genelinde binlerce arsa ilanını harita üzerinden keşfedin. Lokasyon, fiyat ve imar durumuna göre filtreleyin.',
  },
  {
    icon: 'flash-outline' as const,
    color: '#dc2626',
    gradient: ['#dc2626', '#b91c1c'] as [string, string],
    title: 'Canlı İhale',
    desc: 'Gerçek zamanlı online ihale sistemimizle en iyi fiyatı yakalayın. Anlık teklif verin, süreyi takip edin.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    color: '#515d2b',
    gradient: ['#515d2b', '#515d2b'] as [string, string],
    title: 'Güvenli Ödeme',
    desc: 'Kaparo ve ödeme işlemleriniz SSL ve 3D Secure ile korunur. Tüm işlemler yasal güvence altındadır.',
  },
];

type Nav = NativeStackNavigationProp<RootStackParamList>;

/* ── Animated Icon Slide ─────────────────────────── */
function SlideIcon({
  slide,
  index,
  activeIndex,
}: {
  slide: typeof slides[0];
  index: number;
  activeIndex: Animated.SharedValue<number>;
}) {
  // Slow-rotating outer rings
  const ringRotation = useSharedValue(0);

  useEffect(() => {
    ringRotation.value = withRepeat(
      withTiming(360, { duration: 20000 }),
      -1,
      false,
    );
  }, []);

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }],
  }));

  const middleRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-ringRotation.value * 0.7}deg` }],
  }));

  // Icon container scale based on active index
  const containerStyle = useAnimatedStyle(() => {
    const distance = Math.abs(activeIndex.value - index);
    const scale = interpolate(distance, [0, 1], [1, 0.6], Extrapolation.CLAMP);
    const opacity = interpolate(distance, [0, 1], [1, 0], Extrapolation.CLAMP);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.iconArea, containerStyle]}>
      {/* Outer ring */}
      <Animated.View
        style={[
          styles.outerRing,
          { borderColor: `${slide.color}18` },
          outerRingStyle,
        ]}
      >
        {/* Decorative dots on ring */}
        <View style={[styles.ringDot, styles.ringDotTop, { backgroundColor: `${slide.color}30` }]} />
        <View style={[styles.ringDot, styles.ringDotBottom, { backgroundColor: `${slide.color}30` }]} />
        <View style={[styles.ringDot, styles.ringDotLeft, { backgroundColor: `${slide.color}30` }]} />
        <View style={[styles.ringDot, styles.ringDotRight, { backgroundColor: `${slide.color}30` }]} />
      </Animated.View>

      {/* Middle ring */}
      <Animated.View
        style={[
          styles.middleRing,
          { borderColor: `${slide.color}25` },
          middleRingStyle,
        ]}
      />

      {/* Icon gradient center */}
      <LinearGradient
        colors={slide.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconGradient}
      >
        <Ionicons name={slide.icon} size={48} color="#fff" />
      </LinearGradient>
    </Animated.View>
  );
}

/* ── Dot Indicator ───────────────────────────────── */
function DotIndicator({
  index,
  activeIndex,
  color,
}: {
  index: number;
  activeIndex: Animated.SharedValue<number>;
  color: string;
}) {
  const style = useAnimatedStyle(() => {
    const distance = Math.abs(activeIndex.value - index);
    const w = interpolate(distance, [0, 1], [32, 8], Extrapolation.CLAMP);
    const opacity = interpolate(distance, [0, 1], [1, 0.3], Extrapolation.CLAMP);
    return {
      width: w,
      opacity,
    };
  });

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

/* ── Main Screen ─────────────────────────────────── */
export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeIndex = useSharedValue(0);
  const translateX = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const navigation = useNavigation<Nav>();
  const theme = useTheme();

  // Title/desc parallax values
  const titleTranslateX = useSharedValue(0);
  const descTranslateX = useSharedValue(0);
  const textOpacity = useSharedValue(1);

  const animateTextIn = useCallback(() => {
    'worklet';
    titleTranslateX.value = 60;
    descTranslateX.value = 90;
    textOpacity.value = 0;
    titleTranslateX.value = withSpring(0, SPRING.smooth);
    descTranslateX.value = withDelay(80, withSpring(0, SPRING.smooth));
    textOpacity.value = withTiming(1, TIMING.normal);
  }, []);

  const goToSlide = useCallback((index: number) => {
    'worklet';
    activeIndex.value = withSpring(index, SPRING.heavy);
    runOnJS(setCurrentIndex)(index);
    animateTextIn();
  }, []);

  // Entry animation
  useEffect(() => {
    animateTextIn();
  }, []);

  // Swipe gesture
  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const threshold = width * 0.2;
      if (e.translationX < -threshold && activeIndex.value < slides.length - 1) {
        goToSlide(Math.round(activeIndex.value) + 1);
      } else if (e.translationX > threshold && activeIndex.value > 0) {
        goToSlide(Math.round(activeIndex.value) - 1);
      }
      translateX.value = withSpring(0, SPRING.snappy);
    });

  async function handleDone() {
    await AsyncStorage.setItem('onboarding_done', 'true');
    navigation.replace('Login');
  }

  function handleNext() {
    if (currentIndex < slides.length - 1) {
      goToSlide(currentIndex + 1);
    } else {
      handleDone();
    }
  }

  function handleSkip() {
    handleDone();
  }

  // Button press animation
  const onButtonPressIn = () => {
    buttonScale.value = withSpring(0.93, SPRING.snappy);
  };
  const onButtonPressOut = () => {
    buttonScale.value = withSpring(1, SPRING.bouncy);
  };

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Title parallax style
  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: titleTranslateX.value }],
    opacity: textOpacity.value,
  }));

  const descStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: descTranslateX.value }],
    opacity: textOpacity.value,
  }));

  // Slight parallax on swipe drag
  const dragParallaxStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * 0.15 }],
  }));

  const slide = slides[currentIndex];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={panGesture}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          {/* Skip button */}
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.6}>
            <Text style={[styles.skipText, { color: theme.colors.textMuted }]}>Atla</Text>
          </TouchableOpacity>

          {/* Content area */}
          <View style={styles.contentArea}>
            {/* Icon layer — all 3 icons stacked, visibility driven by activeIndex */}
            <View style={styles.iconLayer}>
              {slides.map((s, i) => (
                <View key={i} style={StyleSheet.absoluteFill}>
                  <View style={styles.iconCentered}>
                    <SlideIcon slide={s} index={i} activeIndex={activeIndex} />
                  </View>
                </View>
              ))}
            </View>

            {/* Text */}
            <Animated.View style={[styles.textContainer, dragParallaxStyle]}>
              <Animated.Text
                style={[styles.title, { color: theme.colors.text }, titleStyle]}
              >
                {slide.title}
              </Animated.Text>
              <Animated.Text
                style={[styles.desc, { color: theme.colors.textSecondary }, descStyle]}
              >
                {slide.desc}
              </Animated.Text>
            </Animated.View>
          </View>

          {/* Dot indicators */}
          <View style={styles.dots}>
            {slides.map((_, i) => (
              <DotIndicator
                key={i}
                index={i}
                activeIndex={activeIndex}
                color={theme.colors.primary}
              />
            ))}
          </View>

          {/* Bottom button */}
          <View style={styles.bottomRow}>
            <Animated.View style={[{ borderRadius: 18, overflow: 'hidden' }, buttonAnimStyle]}>
              <TouchableOpacity
                onPress={handleNext}
                onPressIn={onButtonPressIn}
                onPressOut={onButtonPressOut}
                activeOpacity={1}
              >
                <LinearGradient
                  colors={['#6d7a32', '#414a24']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.nextBtn}
                >
                  <Text style={styles.nextText}>
                    {currentIndex === slides.length - 1 ? 'Başlayalım' : 'Devam'}
                  </Text>
                  <View style={styles.nextArrow}>
                    <Ionicons
                      name={currentIndex === slides.length - 1 ? 'checkmark' : 'arrow-forward'}
                      size={18}
                      color="#16a34a"
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Step counter */}
          <Text style={[styles.stepText, { color: theme.colors.textMuted }]}>
            {currentIndex + 1} / {slides.length}
          </Text>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: Platform.OS === 'ios' ? 50 : 30 },
  skipBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: { fontSize: 15, fontWeight: '600' },

  contentArea: { flex: 1, justifyContent: 'center' },

  // Icon layer — stacked absolutely
  iconLayer: {
    height: RING_OUTER + 20,
    width: '100%',
    marginBottom: 40,
  },
  iconCentered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconArea: {
    width: RING_OUTER,
    height: RING_OUTER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: RING_OUTER,
    height: RING_OUTER,
    borderRadius: RING_OUTER / 2,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  middleRing: {
    position: 'absolute',
    width: RING_MIDDLE,
    height: RING_MIDDLE,
    borderRadius: RING_MIDDLE / 2,
    borderWidth: 1.5,
  },
  iconGradient: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  ringDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ringDotTop: { top: -4, left: '50%', marginLeft: -4 },
  ringDotBottom: { bottom: -4, left: '50%', marginLeft: -4 },
  ringDotLeft: { left: -4, top: '50%', marginTop: -4 },
  ringDotRight: { right: -4, top: '50%', marginTop: -4 },

  textContainer: { paddingHorizontal: 40 },
  title: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  desc: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 28 },
  dot: { height: 8, borderRadius: 4 },

  bottomRow: { paddingHorizontal: 24 },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  nextText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  nextArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { textAlign: 'center', fontSize: 12, fontWeight: '500', marginTop: 16 },
});
