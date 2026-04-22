/**
 * AnimatedHeader — Reusable animated screen header with back button
 * Professional entrance animation with gradient background
 */
import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeInLeft } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';

interface AnimatedHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  gradient?: boolean;
}

export function AnimatedHeader({
  title,
  subtitle,
  showBack = true,
  gradient = true,
}: AnimatedHeaderProps) {
  const navigation = useNavigation();
  const { isDark, colors: c } = useTheme();

  const content = (
    <View style={styles.inner}>
      {showBack && (
        <Animated.View entering={FadeInLeft.delay(100).springify()}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}
      <Animated.Text
        entering={FadeInDown.delay(150).springify()}
        style={styles.title}
      >
        {title}
      </Animated.Text>
      {subtitle && (
        <Animated.Text
          entering={FadeInDown.delay(250).springify()}
          style={styles.subtitle}
        >
          {subtitle}
        </Animated.Text>
      )}
      <View style={styles.circle} />
      <View style={styles.circle2} />
    </View>
  );

  if (gradient) {
    return (
      <LinearGradient
        colors={isDark ? ['#161a0c', '#121210'] : ['#414a24', '#6d7a32']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {content}
      </LinearGradient>
    );
  }

  return <View style={[styles.container, { backgroundColor: c.primary }]}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  inner: {
    paddingHorizontal: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  circle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -40,
    right: -50,
  },
  circle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -20,
    left: -30,
  },
});
