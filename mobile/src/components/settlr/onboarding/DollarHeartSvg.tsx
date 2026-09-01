import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

export function DollarHeartSvg() {
  return (
    <View style={styles.container}>
      <Svg width={330} height={200} viewBox="0 0 330 200">
        <Defs>
          <LinearGradient id="bgGrad2" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#2535F5" />
            <Stop offset="60%" stopColor="#7C3AED" />
            <Stop offset="100%" stopColor="#C084FC" />
          </LinearGradient>

          <LinearGradient id="billGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#34D399" />
            <Stop offset="40%" stopColor="#10B981" />
            <Stop offset="100%" stopColor="#059669" />
          </LinearGradient>

          <LinearGradient id="billBackGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#059669" />
            <Stop offset="100%" stopColor="#064E3B" />
          </LinearGradient>

          <LinearGradient id="sparkleGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFF78A" />
            <Stop offset="50%" stopColor="#FACC15" />
            <Stop offset="100%" stopColor="#CA8A04" />
          </LinearGradient>
        </Defs>

        <Rect
          x="15"
          y="45"
          width="300"
          height="110"
          rx="28"
          fill="url(#bgGrad2)"
        />

        <G transform="translate(45, 68) rotate(-25)">
          <Ellipse cx="12" cy="8" rx="12" ry="8" fill="none" stroke="#E9D5FF" strokeWidth="1.2" />
          <Path d="M 12 5 L 12 11" stroke="#E9D5FF" strokeWidth="0.8" />
        </G>
        <G transform="translate(60, 125) rotate(15)">
          <Ellipse cx="16" cy="10" rx="16" ry="10" fill="none" stroke="#E9D5FF" strokeWidth="1.2" />
        </G>
        <Path
          d="M 45 105 L 47 111 L 53 113 L 47 115 L 45 121 L 43 115 L 37 113 L 43 111 Z"
          fill="none"
          stroke="#E9D5FF"
          strokeWidth="1.2"
        />
        <Path
          d="M 270 75 L 273 82 L 280 84 L 273 86 L 270 93 L 267 86 L 260 84 L 267 82 Z"
          fill="none"
          stroke="#F5D0FE"
          strokeWidth="1.4"
        />
        <G transform="translate(265, 120) rotate(-15)">
          <Ellipse cx="12" cy="8" rx="12" ry="8" fill="none" stroke="#F5D0FE" strokeWidth="1.2" />
        </G>

        <Ellipse cx="165" cy="180" rx="40" ry="8" fill="rgba(0,0,0,0.18)" />

        <G transform="translate(75, 15)">
          <Path
            d="
              M 90 60 
              C 70 10, 25 15, 15 50 
              C 5 80, 50 115, 90 140 
              Z"
            fill="url(#billBackGrad)"
            stroke="#064E3B"
            strokeWidth="1.5"
          />
          <Path
            d="
              M 90 60 
              C 110 10, 155 15, 165 50 
              C 175 80, 130 115, 90 140 
              Z"
            fill="url(#billBackGrad)"
            stroke="#064E3B"
            strokeWidth="1.5"
          />

          <Path
            d="
              M 90 140 
              C 45 110, 0 75, 12 42 
              C 22 15, 62 10, 90 45 
              C 118 10, 158 15, 168 42 
              C 180 75, 135 110, 90 140 
              Z"
            fill="url(#billGrad)"
            stroke="#064E3B"
            strokeWidth="2"
          />

          <Path
            d="
              M 90 120 
              C 120 95, 150 70, 142 46 
              C 134 26, 108 24, 90 48 
              C 72 24, 46 26, 38 46 
              C 30 70, 60 95, 90 120 
              Z"
            fill="#7C3AED"
            stroke="#064E3B"
            strokeWidth="1.6"
          />

          <Ellipse cx="55" cy="50" rx="14" ry="10" fill="#047857" stroke="#A7F3D0" strokeWidth="1" opacity={0.7} />
          <Ellipse cx="125" cy="50" rx="14" ry="10" fill="#047857" stroke="#A7F3D0" strokeWidth="1" opacity={0.7} />

          <Path
            d="M 22 35 C 32 18, 62 15, 84 40"
            stroke="#A7F3D0"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M 158 35 C 148 18, 118 15, 96 40"
            stroke="#A7F3D0"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </G>

        <G transform="translate(85, 42)">
          <Path
            d="M 15 0 L 19 11 L 30 15 L 19 19 L 15 30 L 11 19 L 0 15 L 11 11 Z"
            fill="url(#sparkleGrad)"
            stroke="#854D0E"
            strokeWidth="1"
          />
          <Circle cx="15" cy="15" r="3" fill="#FEF08A" />
        </G>

        <G transform="translate(230, 95)">
          <Path
            d="M 14 0 L 17 10 L 28 14 L 17 17 L 14 28 L 10 17 L 0 14 L 10 10 Z"
            fill="url(#sparkleGrad)"
            stroke="#854D0E"
            strokeWidth="1"
          />
          <Circle cx="14" cy="14" r="2.5" fill="#FEF08A" />
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
