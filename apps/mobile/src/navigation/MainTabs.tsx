import React, { useRef, useEffect } from 'react';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Platform,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme';

import HomeScreen from '../screens/home/HomeScreen';
import ParcelsListScreen from '../screens/parcels/ParcelsListScreen';
import AuctionsListScreen from '../screens/auctions/AuctionsListScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_CONFIG = [
  { name: 'Home', label: 'Ana Sayfa', icon: 'home', iconOutline: 'home-outline' },
  { name: 'Parcels', label: 'Keşfet', icon: 'compass', iconOutline: 'compass-outline' },
  { name: 'Profile', label: 'Profil', icon: 'person', iconOutline: 'person-outline' },
];

const SCREEN_MAP: Record<string, React.ComponentType<any>> = {
  Home: HomeScreen,
  Parcels: ParcelsListScreen,
  Auctions: AuctionsListScreen,
  Profile: ProfileScreen,
};

/* ─── FabBar Style Glass Tab Bar ─── */
function FabTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors: c, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Animated bubble position
  const bubbleAnim = useRef(new Animated.Value(state.index)).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(bubbleAnim, {
      toValue: state.index,
      useNativeDriver: true,
      damping: 20,
      stiffness: 220,
      mass: 0.7,
    }).start();
  }, [state.index]);

  const screenWidth = Dimensions.get('window').width;
  const barMargin = 16;
  const fabSize = 56;
  const fabSpacing = 10;
  const segmentWidth = screenWidth - barMargin * 2 - fabSize - fabSpacing;
  const barHeight = 56;
  const bottomMargin = Platform.OS === 'ios' ? Math.max(insets.bottom - 4, 12) : 16;

  // Only 3 tabs in segment (Home, Explore, Profile) — Auctions is FAB
  const segmentTabs = state.routes.filter(r => r.name !== 'Auctions');
  const segmentTabWidth = segmentWidth / segmentTabs.length;
  const bubblePadding = 6;
  const bubbleW = segmentTabWidth - bubblePadding * 2;

  const segmentIndex = segmentTabs.findIndex(r => r.name === state.routes[state.index]?.name);
  const isAuctionActive = state.routes[state.index]?.name === 'Auctions';

  useEffect(() => {
    if (segmentIndex >= 0) {
      Animated.spring(bubbleAnim, {
        toValue: segmentIndex,
        useNativeDriver: true,
        damping: 20,
        stiffness: 220,
        mass: 0.7,
      }).start();
    }
  }, [segmentIndex]);

  const translateX = bubbleAnim.interpolate({
    inputRange: segmentTabs.map((_, i) => i),
    outputRange: segmentTabs.map((_, i) => i * segmentTabWidth + bubblePadding),
    extrapolate: 'clamp',
  });

  const onFabPress = () => {
    Animated.sequence([
      Animated.spring(fabScale, { toValue: 0.85, useNativeDriver: true, speed: 50 }),
      Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, damping: 12 }),
    ]).start();

    const auctionRoute = state.routes.find(r => r.name === 'Auctions');
    if (auctionRoute) {
      navigation.navigate('Auctions');
    }
  };

  return (
    <View style={[styles.fabBarContainer, { bottom: bottomMargin }]}>
      {/* ─── Segment Control (Glass) ─── */}
      <View style={[styles.segmentContainer, { width: segmentWidth, height: barHeight }]}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={Platform.OS === 'ios'
            ? isDark ? 'chromeMaterialDark' : 'chromeMaterial'
            : isDark ? 'dark' : 'light'
          }
          blurAmount={Platform.OS === 'ios' ? 80 : 32}
          reducedTransparencyFallbackColor={isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)'}
        />
        {/* Tint overlay */}
        <View style={[StyleSheet.absoluteFill, {
          backgroundColor: isDark ? 'rgba(40,40,40,0.25)' : 'rgba(255,255,255,0.5)',
        }]} />

        {/* Animated selection bubble */}
        {segmentIndex >= 0 && (
          <Animated.View
            style={[
              styles.segmentBubble,
              {
                width: bubbleW,
                height: barHeight - 12,
                transform: [{ translateX }],
                backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.07)',
              },
            ]}
          />
        )}

        {/* Tab items */}
        <View style={styles.segmentRow}>
          {segmentTabs.map((route) => {
            const isFocused = state.routes[state.index]?.name === route.name;
            const config = TAB_CONFIG.find(t => t.name === route.name) || TAB_CONFIG[0];
            const iconName = isFocused ? config.icon : config.iconOutline;
            const color = isFocused
              ? (isDark ? '#ffffff' : '#000000')
              : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)');

            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => {
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
                }}
                activeOpacity={0.7}
                style={styles.segmentItem}
              >
                <Ionicons name={iconName} size={22} color={color} />
                <Text style={[styles.segmentLabel, { color, fontWeight: isFocused ? '600' : '400' }]} numberOfLines={1}>
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ─── FAB Button (Auctions / İhaleler) ─── */}
      <Animated.View style={[styles.fabOuter, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          onPress={onFabPress}
          activeOpacity={0.8}
          style={[styles.fabButton, {
            width: fabSize,
            height: fabSize,
            backgroundColor: isAuctionActive ? c.primary : '#2563eb',
          }]}
        >
          <Ionicons
            name={isAuctionActive ? 'flash' : 'flash-outline'}
            size={26}
            color="#ffffff"
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

/* ─── Main Tabs Navigator ─── */
export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FabTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Parcels" component={ParcelsListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Auctions" component={AuctionsListScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  fabBarContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  segmentContainer: {
    borderRadius: 28,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  segmentBubble: {
    position: 'absolute',
    top: 6,
    left: 0,
    borderRadius: 20,
  },
  segmentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  segmentLabel: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  fabOuter: {
    ...Platform.select({
      ios: {
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  fabButton: {
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
