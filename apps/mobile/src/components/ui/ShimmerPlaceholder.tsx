/**
 * ShimmerPlaceholder — Professional loading placeholder with shimmer effect
 * Uses Reanimated for smooth 60fps shimmer animation
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme';

interface ShimmerProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function ShimmerPlaceholder({
  width,
  height,
  borderRadius = 8,
  style,
}: ShimmerProps) {
  const { isDark, colors: c } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [-200, 200]);
    return {
      transform: [{ translateX }],
    };
  });

  const bg = isDark ? c.elevated : '#f1f5f9';
  const shimmerColors = isDark
    ? ['rgba(30,45,72,0)', 'rgba(60,80,120,0.3)', 'rgba(30,45,72,0)']
    : ['rgba(241,245,249,0)', 'rgba(255,255,255,0.8)', 'rgba(241,245,249,0)'];

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: bg,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        <LinearGradient
          colors={shimmerColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { width: 200 }]}
        />
      </Animated.View>
    </View>
  );
}
