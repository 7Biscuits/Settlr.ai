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

export function PeaceHandSvg() {
  return (
    <View style={styles.container}>
      <Svg width={330} height={200} viewBox="0 0 330 200">
        <Defs>
          <LinearGradient id="bgGrad4" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#0D9488" />
            <Stop offset="60%" stopColor="#8B5CF6" />
            <Stop offset="100%" stopColor="#E879F9" />
          </LinearGradient>

          <LinearGradient id="handGradG" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#6EE7B7" />
            <Stop offset="40%" stopColor="#10B981" />
            <Stop offset="100%" stopColor="#047857" />
          </LinearGradient>

          <LinearGradient id="nailGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#F5D0FE" />
            <Stop offset="100%" stopColor="#C084FC" />
          </LinearGradient>

          <LinearGradient id="wristGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#F5D0FE" />
            <Stop offset="100%" stopColor="#DDD6FE" />
          </LinearGradient>
        </Defs>

        <Rect
          x="15"
          y="45"
          width="300"
          height="110"
          rx="28"
          fill="url(#bgGrad4)"
        />

        <G transform="translate(45, 68) rotate(-20)">
          <Ellipse cx="14" cy="9" rx="14" ry="9" fill="none" stroke="#6EE7B7" strokeWidth="1.2" />
          <Path d="M 14 5 L 14 13" stroke="#6EE7B7" strokeWidth="0.8" />
        </G>
        <Path
          d="M 40 115 L 43 122 L 50 124 L 43 126 L 40 133 L 37 126 L 30 124 L 37 122 Z"
          fill="none"
          stroke="#6EE7B7"
          strokeWidth="1.2"
        />
        <Path
          d="M 280 75 L 283 82 L 290 84 L 283 86 L 280 93 L 277 86 L 270 84 L 277 82 Z"
          fill="none"
          stroke="#FDF4FF"
          strokeWidth="1.2"
        />
        <G transform="translate(280, 115) rotate(15)">
          <Ellipse cx="14" cy="9" rx="14" ry="9" fill="none" stroke="#FDF4FF" strokeWidth="1.2" />
        </G>

        <Ellipse cx="165" cy="180" rx="35" ry="7" fill="rgba(0,0,0,0.18)" />

        <Ellipse
          cx="165"
          cy="95"
          rx="72"
          ry="72"
          fill="none"
          stroke="#00F58D"
          strokeWidth="1.2"
          opacity={0.8}
        />
        <Ellipse
          cx="165"
          cy="95"
          rx="82"
          ry="64"
          fill="none"
          stroke="#00F58D"
          strokeWidth="0.8"
          opacity={0.5}
        />

        <G transform="translate(125, 20)">
          <Path
            d="
              M 35 145 
              L 30 95 
              C 24 90, 18 80, 18 68 
              C 18 56, 28 50, 36 60 
              C 36 40, 38 10, 44 2 
              C 48 -2, 54 -2, 58 2 
              C 62 8, 62 42, 62 58 
              C 62 35, 68 8, 74 6 
              C 80 4, 86 6, 88 12 
              C 92 20, 88 65, 84 82 
              C 84 92, 80 115, 78 145 
              Z"
            fill="url(#handGradG)"
            stroke="#064E3B"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          <Path
            d="
              M 36 60 
              C 42 66, 52 70, 58 66 
              C 64 74, 76 74, 82 80"
            stroke="#064E3B"
            strokeWidth="1.4"
            fill="none"
          />
          <Path
            d="
              M 30 76 
              C 38 84, 52 86, 58 80 
              C 62 88, 72 88, 78 88"
            stroke="#064E3B"
            strokeWidth="1.4"
            fill="none"
          />

          <Path
            d="
              M 22 74 
              C 26 84, 38 95, 52 92 
              C 62 90, 64 80, 58 76"
            stroke="#064E3B"
            strokeWidth="1.5"
            fill="none"
          />

          <Ellipse cx="51" cy="6" rx="4.5" ry="6" fill="url(#nailGrad)" stroke="#581C87" strokeWidth="0.8" />
          <Ellipse cx="81" cy="12" rx="4.5" ry="6" fill="url(#nailGrad)" stroke="#581C87" strokeWidth="0.8" />
          <Ellipse cx="54" cy="80" rx="4" ry="5" fill="url(#nailGrad)" stroke="#581C87" strokeWidth="0.8" />

          <Ellipse
            cx="56"
            cy="145"
            rx="22"
            ry="7"
            fill="url(#wristGrad)"
            stroke="#064E3B"
            strokeWidth="1.5"
          />
          <Ellipse
            cx="56"
            cy="145"
            rx="12"
            ry="4"
            fill="#FFFFFF"
            stroke="#C084FC"
            strokeWidth="0.8"
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
