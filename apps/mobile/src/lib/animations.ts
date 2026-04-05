/**
 * NetTapu — Reanimated Animation Utilities
 * Professional micro-interactions & shared transitions
 */
import {
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  type SharedValue,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated';

// ── Spring Presets ──────────────────────────────
export const SPRING = {
  /** Snappy button press / card tap */
  snappy: { damping: 15, stiffness: 400, mass: 0.6 } satisfies WithSpringConfig,
  /** Smooth entrance — modals, sheets */
  smooth: { damping: 20, stiffness: 180, mass: 0.8 } satisfies WithSpringConfig,
  /** Bouncy — attention-grabbing pop */
  bouncy: { damping: 12, stiffness: 220, mass: 0.7 } satisfies WithSpringConfig,
  /** Gentle — background motion, parallax */
  gentle: { damping: 28, stiffness: 90, mass: 1 } satisfies WithSpringConfig,
  /** Heavy — large elements, page transitions */
  heavy: { damping: 24, stiffness: 150, mass: 1.2 } satisfies WithSpringConfig,
};

// ── Timing Presets ──────────────────────────────
export const TIMING = {
  fast: { duration: 150, easing: Easing.bezier(0.25, 0.1, 0.25, 1) } satisfies WithTimingConfig,
  normal: { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) } satisfies WithTimingConfig,
  slow: { duration: 500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) } satisfies WithTimingConfig,
  entrance: { duration: 600, easing: Easing.bezier(0.16, 1, 0.3, 1) } satisfies WithTimingConfig,
  exit: { duration: 200, easing: Easing.bezier(0.4, 0, 1, 1) } satisfies WithTimingConfig,
};

// ── Layout Animation Durations ──────────────────
export const LAYOUT = {
  staggerDelay: 60,
  listItemDelay: 50,
  sectionDelay: 120,
};

// ── Haptic patterns (placeholder, works with react-native-haptic-feedback) ──
export const HAPTIC = {
  light: 'impactLight' as const,
  medium: 'impactMedium' as const,
  heavy: 'impactHeavy' as const,
  success: 'notificationSuccess' as const,
  warning: 'notificationWarning' as const,
  error: 'notificationError' as const,
  selection: 'selection' as const,
};
