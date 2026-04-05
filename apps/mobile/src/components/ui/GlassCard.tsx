/**
 * GlassCard — Frosted glass card component
 * Premium glassmorphism effect for iOS, elegant fallback for Android
 */
import React from 'react';
import { View, StyleSheet, Platform, type ViewStyle } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useTheme } from '../../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: 'light' | 'medium' | 'heavy';
  borderRadius?: number;
}

export function GlassCard({
  children,
  style,
  intensity = 'medium',
  borderRadius = 20,
}: GlassCardProps) {
  const { isDark, colors: c, shadows } = useTheme();

  const blurAmount = intensity === 'light' ? 20 : intensity === 'medium' ? 40 : 60;

  const androidBg = isDark
    ? intensity === 'light'
      ? 'rgba(22,32,50,0.7)'
      : intensity === 'medium'
      ? 'rgba(22,32,50,0.82)'
      : 'rgba(22,32,50,0.92)'
    : intensity === 'light'
    ? 'rgba(255,255,255,0.7)'
    : intensity === 'medium'
    ? 'rgba(255,255,255,0.82)'
    : 'rgba(255,255,255,0.92)';

  return (
    <View
      style={[
        styles.container,
        { borderRadius },
        Platform.OS === 'ios' ? shadows.md : { elevation: 4 },
        style,
      ]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView
          style={[StyleSheet.absoluteFill, { borderRadius }]}
          blurType={isDark ? 'chromeMaterialDark' : 'chromeMaterial'}
          blurAmount={blurAmount}
          reducedTransparencyFallbackColor={androidBg}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: androidBg, borderRadius },
          ]}
        />
      )}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)',
          },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
