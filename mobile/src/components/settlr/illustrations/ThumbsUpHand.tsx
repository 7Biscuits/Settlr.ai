import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

export function ThumbsUpHand() {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1200 }),
        withTiming(0, { duration: 1200 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* Soft Drop Shadow under Hand */}
      <Svg width={72} height={20} style={styles.shadowSvg}>
        <Ellipse
          cx={36}
          cy={10}
          rx={28}
          ry={6}
          fill="rgba(0, 0, 0, 0.12)"
        />
      </Svg>

      {/* Mascot Hand SVG */}
      <Svg width={64} height={58} viewBox="0 0 64 58" style={styles.handSvg}>
        <Defs>
          <LinearGradient id="hand_grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#D4BCFF" />
            <Stop offset="50%" stopColor="#B693FE" />
            <Stop offset="100%" stopColor="#9C6EFF" />
          </LinearGradient>
          <LinearGradient id="cuff_grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#E9ECEF" />
          </LinearGradient>
        </Defs>

        <G>
          {/* Main Hand & Thumb Shape */}
          <Path
            d="
              M 22 28 
              C 20 22, 17 14, 17 7 
              C 17 2, 23 0, 27 3 
              C 30 5, 30 11, 29 17 
              C 33 17, 39 19, 41 24 
              C 43 28, 43 36, 42 42 
              C 41 46, 38 48, 33 49 
              C 26 49, 14 47, 10 44 
              C 7 40, 7 35, 10 32 
              C 14 28, 18 29, 22 28 
              Z"
            fill="url(#hand_grad)"
            stroke="#1D093A"
            strokeWidth={1.8}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Thumb crease & nail */}
          <Path
            d="M 21 6 C 22 4, 25 4, 26 6"
            stroke="#1D093A"
            strokeWidth={1.2}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M 23 14 C 21 17, 21 21, 23 24"
            stroke="#7C4AE8"
            strokeWidth={1.2}
            strokeLinecap="round"
            fill="none"
          />

          {/* Finger Knuckle Creases */}
          <Path
            d="M 27 24 C 32 25, 37 27, 41 29"
            stroke="#1D093A"
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M 25 31 C 31 32, 37 34, 42 36"
            stroke="#1D093A"
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M 23 37 C 29 39, 36 41, 41 43"
            stroke="#1D093A"
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
          />

          {/* White Shirt Sleeve Cuff */}
          <G transform="translate(38, 38) rotate(22)">
            <Rect
              x={-1}
              y={0}
              width={14}
              height={14}
              rx={2}
              fill="url(#cuff_grad)"
              stroke="#1D093A"
              strokeWidth={1.6}
            />
            <Path
              d="M 3 3 L 3 11 M 7 3 L 7 11 M 10 3 L 10 11"
              stroke="#1D093A"
              strokeWidth={1.1}
              strokeLinecap="round"
            />
          </G>
        </G>
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 52,
    position: 'absolute',
    top: -38,
    alignSelf: 'center',
    zIndex: 20,
  },
  shadowSvg: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
  },
  handSvg: {
    alignSelf: 'center',
  },
});
