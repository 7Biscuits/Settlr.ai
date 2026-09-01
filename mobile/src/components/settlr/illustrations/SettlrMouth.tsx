import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

export function SettlrMouth() {
  return (
    <View style={styles.container}>
      {/* Soft Drop Shadow */}
      <Svg width={46} height={12} style={styles.shadow}>
        <Ellipse
          cx={23}
          cy={6}
          rx={20}
          ry={4.5}
          fill="rgba(0, 0, 0, 0.08)"
        />
      </Svg>

      <Svg width={48} height={40} viewBox="0 0 48 40">
        <Defs>
          {/* Blue Lips Gradient */}
          <LinearGradient id="lip_grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#4169FA" />
            <Stop offset="40%" stopColor="#2A4CE8" />
            <Stop offset="100%" stopColor="#1B36BA" />
          </LinearGradient>

          {/* Tongue Gradient */}
          <LinearGradient id="tongue_grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FF6584" />
            <Stop offset="100%" stopColor="#E62E5C" />
          </LinearGradient>

          {/* Heart Gradient */}
          <LinearGradient id="heart_grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FF7A9A" />
            <Stop offset="100%" stopColor="#FF2E63" />
          </LinearGradient>
        </Defs>

        <G transform="rotate(-6, 24, 20)">
          {/* Outer Mouth / Lips */}
          <Path
            d="
              M 6 18 
              C 8 9, 17 6, 24 9 
              C 31 6, 40 9, 42 18 
              C 41 27, 33 33, 24 33 
              C 15 33, 7 27, 6 18 
              Z"
            fill="url(#lip_grad)"
            stroke="#122475"
            strokeWidth={1.5}
          />

          {/* Mouth Cavity */}
          <Path
            d="
              M 11 18 
              C 13 14, 20 13, 24 14 
              C 28 13, 35 14, 37 18 
              C 35 24, 29 27, 24 27 
              C 19 27, 13 24, 11 18 
              Z"
            fill="#121829"
          />

          {/* Upper Teeth */}
          <Path
            d="
              M 14 15 
              C 18 14, 22 14, 24 14.5 
              C 26 14, 30 14, 34 15 
              L 33 18 
              C 29 18.5, 25 18.5, 24 18.5 
              C 23 18.5, 19 18.5, 15 18 
              Z"
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth={0.6}
          />
          <Path
            d="M 19 14.5 L 19 18 M 24 14.5 L 24 18.5 M 29 14.5 L 29 18"
            stroke="#CBD5E1"
            strokeWidth={0.7}
          />

          {/* Lower Teeth */}
          <Path
            d="
              M 15 23 
              C 19 23, 23 23, 24 23 
              C 25 23, 29 23, 33 23 
              L 32 25.5 
              C 28 26, 25 26, 24 26 
              C 23 26, 20 26, 16 25.5 
              Z"
            fill="#FFFFFF"
          />

          {/* Tongue */}
          <Path
            d="
              M 20 19 
              C 20 23, 19 28, 24 29 
              C 29 28, 28 23, 28 19 
              Z"
            fill="url(#tongue_grad)"
            stroke="#B81442"
            strokeWidth={1}
          />
          <Path
            d="M 24 20 L 24 27"
            stroke="#A30F39"
            strokeWidth={0.8}
            strokeLinecap="round"
          />

          {/* Lip Highlights */}
          <Path
            d="M 12 14 C 16 11, 20 11, 23 12"
            stroke="#7FA4FF"
            strokeWidth={1.2}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M 16 30 C 20 31, 24 31, 28 30"
            stroke="#7FA4FF"
            strokeWidth={1.2}
            strokeLinecap="round"
            fill="none"
          />

          {/* Pink Heart */}
          <G transform="translate(34, 18) scale(0.6)">
            <Path
              d="
                M 0 3 
                A 3 3 0 0 0 6 3 
                A 3 3 0 0 0 12 3 
                Q 12 7 6 12 
                Q 0 7 0 3 
                Z"
              fill="url(#heart_grad)"
              stroke="#B31244"
              strokeWidth={0.8}
            />
            <Ellipse
              cx={3.5}
              cy={2.5}
              rx={1.2}
              ry={0.8}
              fill="#FFFFFF"
              opacity={0.8}
            />
          </G>
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  shadow: {
    position: 'absolute',
    bottom: -3,
    alignSelf: 'center',
  },
});
