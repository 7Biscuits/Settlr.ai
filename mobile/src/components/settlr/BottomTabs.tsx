import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Path,
  Rect,
} from 'react-native-svg';

export type TabKey = 'home' | 'groups' | 'assistant' | 'messages' | 'wallet';

interface TabItem {
  key: TabKey;
  label: string;
  badgeCount?: number;
}

interface BottomTabsProps {
  activeTab?: TabKey;
  onTabChange?: (tab: TabKey) => void;
  unreadMessagesCount?: number;
}

function TabIcon({ tabKey, isActive }: { tabKey: TabKey; isActive: boolean }) {
  const color = isActive ? '#2738F5' : '#64748B';
  const size = 24;

  switch (tabKey) {
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10.5Z"
            stroke={color}
            strokeWidth={isActive ? '2.4' : '1.8'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M9 21V12H15V21"
            stroke={color}
            strokeWidth={isActive ? '2.4' : '1.8'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'groups':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
            stroke={color}
            strokeWidth={isActive ? '2.4' : '1.8'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle
            cx="9"
            cy="7"
            r="4"
            stroke={color}
            strokeWidth={isActive ? '2.4' : '1.8'}
          />
          <Path
            d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
            stroke={color}
            strokeWidth={isActive ? '2.4' : '1.8'}
            strokeLinecap="round"
          />
          <Path
            d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88"
            stroke={color}
            strokeWidth={isActive ? '2.4' : '1.8'}
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'assistant':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z"
            stroke={color}
            strokeWidth={isActive ? '2.4' : '1.8'}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={isActive ? '#EFF6FF' : 'none'}
          />
          <Path
            d="M19 16L19.8 17.8L22 18.5L19.8 19.2L19 21L18.2 19.2L16 18.5L18.2 17.8L19 16Z"
            stroke={color}
            strokeWidth={isActive ? '2' : '1.5'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'messages':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
            stroke={color}
            strokeWidth={isActive ? '2.4' : '1.8'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'wallet':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="2"
            y="5"
            width="20"
            height="14"
            rx="3"
            stroke={color}
            strokeWidth={isActive ? '2.4' : '1.8'}
          />
          <Path
            d="M2 10H22"
            stroke={color}
            strokeWidth={isActive ? '2.4' : '1.8'}
          />
          <Circle
            cx="17"
            cy="15"
            r="1.5"
            fill={color}
          />
        </Svg>
      );
  }
}

function AnimatedTabItem({
  tab,
  isActive,
  onPress,
}: {
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      scale.value = withSequence(
        withSpring(1.15, { damping: 10, stiffness: 300 }),
        withSpring(1, { damping: 14, stiffness: 200 })
      );
    } else {
      scale.value = withTiming(1, { duration: 150 });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 12, stiffness: 350 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 250 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabButton}>
      <Animated.View style={[styles.iconWrapper, animatedStyle]}>
        <TabIcon tabKey={tab.key} isActive={isActive} />
        {tab.badgeCount && tab.badgeCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{tab.badgeCount}</Text>
          </View>
        ) : null}
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          isActive && styles.activeTabLabel,
        ]}>
        {tab.label}
      </Text>
    </Pressable>
  );
}

export function BottomTabs({
  activeTab = 'home',
  onTabChange,
  unreadMessagesCount = 0,
}: BottomTabsProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 6);

  const tabs: TabItem[] = [
    { key: 'home', label: 'Home' },
    { key: 'groups', label: 'Groups' },
    { key: 'assistant', label: 'Assistant' },
    { key: 'messages', label: 'Messages', badgeCount: unreadMessagesCount },
    { key: 'wallet', label: 'Wallet' },
  ];

  return (
    <View style={[styles.container, { paddingBottom: bottomInset }]}>
      <View style={styles.tabsRow}>
        {tabs.map((tab) => (
          <AnimatedTabItem
            key={tab.key}
            tab={tab}
            isActive={tab.key === activeTab}
            onPress={() => onTabChange?.(tab.key)}
          />
        ))}
      </View>

      {/* iOS Home Indicator Bar */}
      {Platform.OS === 'ios' && (
        <View style={styles.homeIndicatorWrapper}>
          <View style={styles.homeIndicator} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F2',
    paddingTop: 8,
    width: '100%',
    zIndex: 100,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  iconWrapper: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
    letterSpacing: -0.1,
  },
  activeTabLabel: {
    color: '#2738F5',
    fontWeight: '800',
  },
  homeIndicatorWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 2,
  },
  homeIndicator: {
    width: 134,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#000000',
  },
});
