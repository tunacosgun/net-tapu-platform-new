/**
 * AnimatedPressable — Professional press interaction component
 * Uses Reanimated for buttery-smooth 60fps press feedback
 */
import React, { useCallback } from 'react';
import { type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SPRING } from '../../lib/animations';

interface AnimatedPressableProps {
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  scaleDown?: number;
  children: React.ReactNode;
  disabled?: boolean;
}

export function AnimatedPressable({
  onPress,
  style,
  scaleDown = 0.97,
  children,
  disabled = false,
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const gesture = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => {
      'worklet';
      scale.value = withSpring(scaleDown, SPRING.snappy);
      opacity.value = withSpring(0.85, SPRING.snappy);
    })
    .onFinalize(() => {
      'worklet';
      scale.value = withSpring(1, SPRING.bouncy);
      opacity.value = withSpring(1, SPRING.bouncy);
    })
    .onEnd(() => {
      if (onPress) {
        onPress();
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
