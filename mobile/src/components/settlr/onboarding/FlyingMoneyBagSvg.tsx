import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

export function FlyingMoneyBagSvg() {
  return (
    <View style={styles.container}>
      <Svg width={330} height={200} viewBox="0 0 330 200">
        <Defs>
          <LinearGradient id="bgGrad1" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#2535F5" />
            <Stop offset="50%" stopColor="#2B8AE8" />
            <Stop offset="100%" stopColor="#4ADE80" />
          </LinearGradient>

          <LinearGradient id="bagGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#60A5FA" />
            <Stop offset="40%" stopColor="#3B82F6" />
            <Stop offset="100%" stopColor="#1D4ED8" />
          </LinearGradient>

          <LinearGradient id="wingGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="70%" stopColor="#E2E8F0" />
            <Stop offset="100%" stopColor="#CBD5E1" />
          </LinearGradient>
        </Defs>

        <Rect
          x="15"
          y="45"
          width="300"
          height="110"
          rx="28"
          fill="url(#bgGrad1)"
        />

        <G transform="translate(45, 65) rotate(-20)">
          <Ellipse cx="12" cy="8" rx="12" ry="8" fill="none" stroke="#1E3A8A" strokeWidth="1.2" />
          <Ellipse cx="12" cy="8" rx="8" ry="5" fill="none" stroke="#1E3A8A" strokeWidth="0.8" />
        </G>
        <G transform="translate(40, 115) rotate(15)">
          <Ellipse cx="14" cy="9" rx="14" ry="9" fill="none" stroke="#1E3A8A" strokeWidth="1.2" />
        </G>
        <Path
          d="M 275 80 L 278 88 L 286 91 L 278 94 L 275 102 L 272 94 L 264 91 L 272 88 Z"
          fill="none"
          stroke="#065F46"
          strokeWidth="1.4"
        />
        <Path
          d="M 255 105 L 257 111 L 263 113 L 257 115 L 255 121 L 253 115 L 247 113 L 253 111 Z"
          fill="none"
          stroke="#065F46"
          strokeWidth="1.2"
        />
        <G transform="translate(270, 120) rotate(-10)">
          <Ellipse cx="12" cy="8" rx="12" ry="8" fill="none" stroke="#065F46" strokeWidth="1.2" />
          <Path d="M 12 5 L 12 11" stroke="#065F46" strokeWidth="1" />
        </G>

        <Ellipse cx="165" cy="180" rx="55" ry="10" fill="rgba(0,0,0,0.18)" />

        <G transform="translate(25, 38)">
          <Path
            d="
              M 115 65 
              C 95 35, 60 40, 20 65 
              C 25 72, 38 78, 48 76 
              C 35 84, 45 92, 58 88 
              C 48 95, 60 102, 74 96 
              C 70 102, 85 104, 98 94 
              C 106 90, 114 78, 115 65 
              Z"
            fill="url(#wingGrad)"
            stroke="#64748B"
            strokeWidth="1.2"
          />
          <Path d="M 50 68 C 65 64, 85 64, 105 66" stroke="#94A3B8" strokeWidth="1.2" fill="none" />
          <Path d="M 60 80 C 75 76, 92 74, 108 72" stroke="#94A3B8" strokeWidth="1.2" fill="none" />
        </G>

        <G transform="translate(165, 38)">
          <Path
            d="
              M 5 65 
              C 25 35, 60 40, 100 65 
              C 95 72, 82 78, 72 76 
              C 85 84, 75 92, 62 88 
              C 72 95, 60 102, 46 96 
              C 50 102, 35 104, 22 94 
              C 14 90, 6 78, 5 65 
              Z"
            fill="url(#wingGrad)"
            stroke="#64748B"
            strokeWidth="1.2"
          />
          <Path d="M 70 68 C 55 64, 35 64, 15 66" stroke="#94A3B8" strokeWidth="1.2" fill="none" />
          <Path d="M 60 80 C 45 76, 28 74, 12 72" stroke="#94A3B8" strokeWidth="1.2" fill="none" />
        </G>

        <G transform="translate(110, 42)">
          <Path
            d="
              M 30 24 
              C 24 14, 32 4, 46 6 
              C 54 2, 68 4, 74 14 
              C 82 14, 80 24, 76 24 
              Z"
            fill="url(#bagGrad)"
            stroke="#1E3A8A"
            strokeWidth="1.5"
          />

          <Rect
            x="32"
            y="23"
            width="46"
            height="6"
            rx="3"
            fill="#E2E8F0"
            stroke="#1E3A8A"
            strokeWidth="1.2"
          />

          <Path
            d="
              M 34 27 
              C 20 40, 14 70, 24 98 
              C 30 112, 48 122, 55 122 
              C 62 122, 80 112, 86 98 
              C 96 70, 90 40, 76 27 
              Z"
            fill="url(#bagGrad)"
            stroke="#1E3A8A"
            strokeWidth="1.6"
          />

          <Path
            d="
              M 55 52 V 96 
              M 44 60 
              C 44 54, 52 52, 56 52 
              C 64 52, 68 56, 68 62 
              C 68 70, 44 74, 44 84 
              C 44 92, 50 96, 56 96 
              C 66 96, 68 90, 68 86"
            stroke="#00F58D"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d="
              M 55 54 V 94 
              M 45 61 
              C 45 56, 52 54, 56 54 
              C 62 54, 66 57, 66 62 
              C 66 68, 46 73, 46 83 
              C 46 90, 51 94, 56 94 
              C 64 94, 66 89, 66 86"
            stroke="#A7F3D0"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 210,
    marginTop: 10,
    marginBottom: 8,
  },
});
