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
  Text as SvgText,
} from 'react-native-svg';

export function CreditCardSvg() {
  return (
    <View style={styles.container}>
      <Svg width={330} height={200} viewBox="0 0 330 200">
        <Defs>
          <LinearGradient id="bgGrad3" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#7C3AED" />
            <Stop offset="50%" stopColor="#A855F7" />
            <Stop offset="100%" stopColor="#DDD6FE" />
          </LinearGradient>

          <LinearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#3B5BFD" />
            <Stop offset="50%" stopColor="#2535F5" />
            <Stop offset="100%" stopColor="#1E29DB" />
          </LinearGradient>

          <LinearGradient id="chipGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FEF08A" />
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
          fill="url(#bgGrad3)"
        />

        <G transform="translate(45, 68) rotate(-15)">
          <Ellipse cx="14" cy="9" rx="14" ry="9" fill="none" stroke="#FFFFFF" strokeWidth="1.2" opacity={0.6} />
        </G>
        <Path
          d="M 45 110 L 48 117 L 55 119 L 48 121 L 45 128 L 42 121 L 35 119 L 42 117 Z"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          opacity={0.6}
        />
        <Path
          d="M 285 70 L 287 76 L 293 78 L 287 80 L 285 86 L 283 80 L 277 78 L 283 76 Z"
          fill="none"
          stroke="#6B21A8"
          strokeWidth="1.2"
          opacity={0.6}
        />
        <G transform="translate(280, 115) rotate(20)">
          <Ellipse cx="14" cy="9" rx="14" ry="9" fill="none" stroke="#6B21A8" strokeWidth="1.2" opacity={0.6} />
        </G>

        <G transform="rotate(-14, 165, 105)">
          <Rect
            x="58"
            y="48"
            width="220"
            height="136"
            rx="18"
            fill="rgba(0,0,0,0.22)"
          />
        </G>

        <G transform="rotate(-14, 165, 100)">
          <Rect
            x="55"
            y="35"
            width="220"
            height="136"
            rx="18"
            fill="url(#cardGrad)"
            stroke="#1E1B4B"
            strokeWidth="1.8"
          />

          <G opacity={0.35}>
            <SvgText
              x="62"
              y="68"
              fontSize="24"
              fontWeight="900"
              fill="none"
              stroke="#60A5FA"
              strokeWidth="1.2"
              letterSpacing="1">
              SETTLR CARD
            </SvgText>
            <SvgText
              x="62"
              y="98"
              fontSize="24"
              fontWeight="900"
              fill="none"
              stroke="#60A5FA"
              strokeWidth="1.2"
              letterSpacing="1">
              ZERO FEES
            </SvgText>
          </G>

          <G transform="translate(74, 76)">
            <Rect
              x="0"
              y="0"
              width="36"
              height="28"
              rx="6"
              fill="url(#chipGrad)"
              stroke="#854D0E"
              strokeWidth="1.2"
            />
            <Path
              d="
                M 0 14 H 36 
                M 12 0 V 28 
                M 24 0 V 28 
                M 12 9 H 24 
                M 12 19 H 24"
              stroke="#854D0E"
              strokeWidth="1"
              fill="none"
            />
          </G>

          {/* Settlr White Pill Logo */}
          <G transform="translate(74, 126)">
            <Rect
              x="0"
              y="0"
              width="58"
              height="24"
              rx="7"
              fill="#FFFFFF"
            />
            <SvgText
              x="6"
              y="17"
              fontSize="12.5"
              fontWeight="900"
              fill="#2535F5"
              letterSpacing="0.5">
              SETTLR
            </SvgText>
          </G>

          <Path
            d="M 60 40 L 220 40 C 260 40, 270 60, 270 90"
            stroke="#93C5FD"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            opacity={0.6}
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
