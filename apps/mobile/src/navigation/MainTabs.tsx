import React, { useCallback, useEffect } from 'react';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  StyleSheet,
  View,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  useDerivedValue,
} from 'react-native-reanimated';
import { BlurView } from '@react-native-community/blur';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SPRING } from '../lib/animations';
import { useTheme } from '../theme';

import HomeScreen from '../screens/home/HomeScreen';
import ParcelsListScreen from '../screens/parcels/ParcelsListScreen';
import AuctionsListScreen from '../screens/auctions/AuctionsListScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_CONFIG = [
  { name: 'Home', label: 'Ana Sayfa', icon: 'home', iconOutline: 'home-outline' },
  { name: 'Parcels', label: 'İlanlar', icon: 'map', iconOutline: 'map-outline' },
  { name: 'Auctions', label: 'İhaleler', icon: 'flash', iconOutline: 'flash-outline' },
  { name: 'Profile', label: 'Profil', icon: 'person', iconOutline: 'person-outline' },
];

const TAB_COUNT = TAB_CONFIG.length;
const SCREEN_WIDTH = Dimensions.get('window').width;
const TAB_WIDTH = SCREEN_WIDTH / TAB_COUNT;
const INDICATOR_WIDTH = 32;
const INDICATOR_HEIGHT = 3;

/* ─── Animated Tab Item ─── */
interface TabItemProps {
  index: number;
  isFocused: boolean;
  label: string;
  iconFilled: string;
  iconOutline: string;
  primaryColor: string;
  mutedColor: string;
  onPress: () => void;
  onLongPress: () => void;
}

function AnimatedTabItem({
  index,
  isFocused,
  label,
  iconFilled,
  iconOutline,
  primaryColor,
  mutedColor,
  onPress,
  onLongPress,
}: TabItemProps) {
  const scale = useSharedValue(1);
  const focusProgress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    focusProgress.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
    if (isFocused) {
      scale.value = withSpring(1.15, SPRING.snappy);
    } else {
      scale.value = withSpring(1, SPRING.smooth);
    }
  }, [isFocused]);

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const labelAnimStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isFocused ? 1 : 0.6, { duration: 200 }),
  }));

  const colorAnimStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      focusProgress.value,
      [0, 1],
      [mutedColor, primaryColor],
    );
    return { color };
  });

  const iconName = isFocused ? iconFilled : iconOutline;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      <Animated.View style={iconAnimStyle}>
        <Ionicons
          name={iconName}
          size={24}
          color={isFocused ? primaryColor : mutedColor}
        />
      </Animated.View>
      <Animated.Text
        style={[
          styles.tabLabel,
          { fontWeight: isFocused ? '600' : '400' },
          colorAnimStyle,
          labelAnimStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

/* ─── Animated Tab Bar ─── */
function AnimatedTabBar({ state, navigation, descriptors }: BottomTabBarProps) {
  const { colors: c, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const indicatorX = useSharedValue(state.index * TAB_WIDTH + (TAB_WIDTH - INDICATOR_WIDTH) / 2);

  useEffect(() => {
    indicatorX.value = withSpring(
      state.index * TAB_WIDTH + (TAB_WIDTH - INDICATOR_WIDTH) / 2,
      SPRING.snappy,
    );
  }, [state.index]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const mutedColor = isDark ? 'rgba(255,255,255,0.45)' : '#94a3b8';
  const bgColor = isDark ? 'rgba(15,15,20,0.85)' : 'rgba(255,255,255,0.92)';

  const barContent = (
    <>
      {/* Sliding indicator */}
      <Animated.View
        style={[
          styles.indicator,
          { backgroundColor: c.primary },
          indicatorStyle,
        ]}
      />

      {/* Tab items */}
      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG.find(t => t.name === route.name) || TAB_CONFIG[0];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <AnimatedTabItem
              key={route.key}
              index={index}
              isFocused={isFocused}
              label={config.label}
              iconFilled={config.icon}
              iconOutline={config.iconOutline}
              primaryColor={c.primary}
              mutedColor={mutedColor}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </>
  );

  return (
    <View
      style={[
        styles.barOuter,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={24}
          reducedTransparencyFallbackColor={isDark ? '#0f0f14' : '#ffffff'}
        />
      ) : null}

      {/* Solid fallback background (Android always, iOS as tint overlay) */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: Platform.OS === 'ios'
              ? (isDark ? 'rgba(15,15,20,0.4)' : 'rgba(255,255,255,0.3)')
              : bgColor,
          },
        ]}
      />

      {/* Top border */}
      <View
        style={[
          styles.topBorder,
          { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
        ]}
      />

      {barContent}
    </View>
  );
}

/* ─── Navigator ─── */
export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Parcels" component={ParcelsListScreen} />
      <Tab.Screen name="Auctions" component={AuctionsListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  barOuter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 12,
        shadowColor: '#000',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
    }),
  },
  topBorder: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: INDICATOR_WIDTH,
    height: INDICATOR_HEIGHT,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  tabRow: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 0.3,
  },
});
