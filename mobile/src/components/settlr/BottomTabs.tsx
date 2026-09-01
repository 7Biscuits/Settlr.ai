import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Ellipse,
  Path,
  Rect,
} from 'react-native-svg';

export type TabKey = 'spend' | 'budget' | 'chat' | 'save' | 'borrow' | 'habits';

interface TabItem {
  key: TabKey;
  label: string;
}

const TABS: TabItem[] = [
  { key: 'spend', label: 'Spend' },
  { key: 'budget', label: 'Groups' },
  { key: 'chat', label: 'Assistant' },
  { key: 'save', label: 'Vault' },
  { key: 'borrow', label: 'Transfer' },
  { key: 'habits', label: 'Splits' },
];

function TabIcon({ tabKey, isActive }: { tabKey: TabKey; isActive: boolean }) {
  const color = isActive ? '#000000' : '#8E8E93';
  const size = 25;

  switch (tabKey) {
    case 'spend':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect
            x="2"
            y="5"
            width="20"
            height="14"
            rx="3"
            stroke={color}
            strokeWidth={isActive ? '2.2' : '1.8'}
            fill="none"
          />
          <Path d="M2 9.5H22" stroke={color} strokeWidth={isActive ? '2.2' : '1.8'} />
          <Rect x="5" y="14" width="3" height="2" rx="0.5" fill={color} />
        </Svg>
      );

    case 'budget':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M5 8V18C5 19.1 6.34 20 8 20C9.66 20 11 19.1 11 18V8"
            stroke={color}
            strokeWidth={isActive ? '2.2' : '1.8'}
            strokeLinecap="round"
            fill="none"
          />
          <Ellipse
            cx="8"
            cy="8"
            rx="3"
            ry="2"
            stroke={color}
            strokeWidth={isActive ? '2.2' : '1.8'}
            fill="none"
          />
          <Path
            d="M5 13C5 14.1 6.34 15 8 15C9.66 15 11 14.1 11 13"
            stroke={color}
            strokeWidth={isActive ? '2.2' : '1.8'}
            fill="none"
          />

          <Path
            d="M13 5V18C13 19.1 14.34 20 16 20C17.66 20 19 19.1 19 18V5"
            stroke={color}
            strokeWidth={isActive ? '2.2' : '1.8'}
            strokeLinecap="round"
            fill="none"
          />
          <Ellipse
            cx="16"
            cy="5"
            rx="3"
            ry="2"
            stroke={color}
            strokeWidth={isActive ? '2.2' : '1.8'}
            fill="none"
          />
          <Path
            d="M13 10C13 11.1 14.34 12 16 12C17.66 12 19 11.1 19 10"
            stroke={color}
            strokeWidth={isActive ? '2.2' : '1.8'}
            fill="none"
          />
          <Path
            d="M13 15C13 16.1 14.34 17 16 17C17.66 17 19 16.1 19 15"
            stroke={color}
            strokeWidth={isActive ? '2.2' : '1.8'}
            fill="none"
          />
        </Svg>
      );

    case 'chat':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect
            x="3"
            y="3"
            width="18"
            height="15"
            rx="4"
            stroke={color}
            strokeWidth={isActive ? '2.2' : '1.8'}
            fill="none"
          />
          <Path
            d="M8 18L6 21V18"
            stroke={color}
            strokeWidth={isActive ? '2.2' : '1.8'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M14 9C13.2 8.3 12 8.3 11.2 9C10.2 9.9 10.2 11.6 11.2 12.5C12 13.2 13.2 13.2 14 12.5"
            stroke={color}
            strokeWidth={isActive ? '2.2' : '1.8'}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      );

    case 'save':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="
              M 19 12 
              C 19 8.5, 16 6, 12 6 
              C 8 6, 5 8.5, 5 12 
              C 5 15, 7.5 17, 10 17 
              L 10 19 
              L 12 19 
              L 12 17 
              L 14 17 
              L 14 19 
              L 16 19 
              L 16 16.8 
              C 18 15.5, 19 14, 19 12 
              Z"
            stroke={color}
            strokeWidth={isActive ? '2.2' : '1.8'}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M7 6L5.5 3.5C5.2 3 6 2.5 6.5 3L8 6"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d="M19 10H20.5C21 10 21.5 10.5 21.5 11.5C21.5 12.5 21 13 20.5 13H19"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx="16" cy="9.5" r="1" fill={color} />
          <Path d="M10.5 6H13.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
      );

    case 'borrow':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect
            x="2"
            y="6"
            width="20"
            height="12"
            rx="2"
            stroke={color}
            strokeWidth={isActive ? '2.2' : '1.8'}
            fill="none"
          />
          <Circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth="1.6" fill="none" />
          <Path d="M12 10.5V13.5M11 11H13M11 13H13" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
          <Path d="M5 8.5H5.01M19 15.5H19.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );

    case 'habits':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="
              M 12 3 
              C 12 3, 15 6.5, 15 9.5 
              C 15 11, 14 12, 13 13 
              C 14 13, 16 12, 16.5 10.5 
              C 18 12.5, 18.5 14.5, 18.5 16 
              C 18.5 19.5, 15.5 22, 12 22 
              C 8.5 22, 5.5 19.5, 5.5 16 
              C 5.5 12.5, 8.5 8, 12 3 
              Z"
            stroke={color}
            strokeWidth={isActive ? '2.2' : '1.8'}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M 12 15 C 12 15, 13.5 16.5, 13.5 17.5 C 13.5 18.8, 12.8 19.5, 12 19.5 C 11.2 19.5, 10.5 18.8, 10.5 17.5 C 10.5 16.5, 12 15, 12 15 Z"
            stroke={color}
            strokeWidth={1.5}
            fill="none"
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

interface BottomTabsProps {
  activeTab?: TabKey;
  onTabChange?: (tab: TabKey) => void;
}

export function BottomTabs({
  activeTab = 'spend',
  onTabChange,
}: BottomTabsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <AnimatedTabItem
            key={tab.key}
            tab={tab}
            isActive={tab.key === activeTab}
            onPress={() => onTabChange?.(tab.key)}
          />
        ))}
      </View>

      {/* iOS Home Indicator Bar */}
      <View style={styles.homeIndicatorWrapper}>
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F2',
    paddingTop: 8,
    paddingBottom: 4,
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
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 4,
    letterSpacing: -0.1,
  },
  activeTabLabel: {
    color: '#000000',
    fontWeight: '800',
  },
  homeIndicatorWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  homeIndicator: {
    width: 134,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#000000',
  },
});
