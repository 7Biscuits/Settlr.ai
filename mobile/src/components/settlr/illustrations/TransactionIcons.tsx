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

export function BankBuildingIcon() {
  return (
    <View style={[styles.iconBase, styles.bankBg]}>
      <Svg width={36} height={36} viewBox="0 0 36 36">
        <Defs>
          <LinearGradient id="roofGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#93C5FD" />
            <Stop offset="100%" stopColor="#60A5FA" />
          </LinearGradient>
          <LinearGradient id="pillarGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#DBEAFE" />
            <Stop offset="100%" stopColor="#93C5FD" />
          </LinearGradient>
        </Defs>

        {/* Roof Pediment / Triangle */}
        <Path
          d="M18 6L7 13H29L18 6Z"
          fill="url(#roofGrad)"
          stroke="#3B82F6"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <Rect
          x="6"
          y="13"
          width="24"
          height="2.5"
          rx="0.5"
          fill="#60A5FA"
          stroke="#2563EB"
          strokeWidth="0.8"
        />

        {/* 4 Classical Pillars */}
        <Rect x="8.5" y="15.5" width="3.2" height="11" rx="0.8" fill="url(#pillarGrad)" stroke="#3B82F6" strokeWidth="0.8" />
        <Rect x="13.2" y="15.5" width="3.2" height="11" rx="0.8" fill="url(#pillarGrad)" stroke="#3B82F6" strokeWidth="0.8" />
        <Rect x="19.6" y="15.5" width="3.2" height="11" rx="0.8" fill="url(#pillarGrad)" stroke="#3B82F6" strokeWidth="0.8" />
        <Rect x="24.3" y="15.5" width="3.2" height="11" rx="0.8" fill="url(#pillarGrad)" stroke="#3B82F6" strokeWidth="0.8" />

        {/* Base Steps */}
        <Rect x="6" y="26.5" width="24" height="2.5" rx="0.5" fill="#60A5FA" stroke="#2563EB" strokeWidth="0.8" />
        <Rect x="4" y="29" width="28" height="2.5" rx="0.5" fill="#3B82F6" />
      </Svg>
    </View>
  );
}

export function MoneyBagIcon() {
  return (
    <View style={[styles.iconBase, styles.moneyBagBg]}>
      <Svg width={36} height={36} viewBox="0 0 36 36">
        <Defs>
          <LinearGradient id="sackGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FEF08A" />
            <Stop offset="60%" stopColor="#FACC15" />
            <Stop offset="100%" stopColor="#CA8A04" />
          </LinearGradient>
          <LinearGradient id="tieGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#38BDF8" />
            <Stop offset="100%" stopColor="#0284C7" />
          </LinearGradient>
        </Defs>

        {/* Top ruffled neck of the money sack */}
        <Path
          d="M13 13 C 12 9, 14 7, 18 7 C 22 7, 24 9, 23 13 Z"
          fill="url(#sackGrad)"
          stroke="#854D0E"
          strokeWidth="0.8"
        />

        {/* Blue Ribbon / Tie */}
        <Rect x="12" y="12" width="12" height="2.5" rx="1" fill="url(#tieGrad)" />

        {/* Main Sack Body */}
        <Path
          d="
            M 13 14
            C 9 16, 7 21, 8 26
            C 9 30, 13 32, 18 32
            C 23 32, 27 30, 28 26
            C 29 21, 27 16, 23 14
            Z"
          fill="url(#sackGrad)"
          stroke="#854D0E"
          strokeWidth="0.9"
        />

        {/* Green Dollar Sign */}
        <Path
          d="M18 19V27M16 20.5C16 19.5 17 19.5 18 19.5C19.5 19.5 20 20 20 21C20 22.5 16 22.5 16 24C16 25 17 25.5 18 25.5C19.5 25.5 20 25 20 24"
          stroke="#15803D"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function SkullSparkleIcon() {
  return (
    <View style={[styles.iconBase, styles.skullBg]}>
      <Svg width={36} height={36} viewBox="0 0 36 36">
        <Defs>
          <LinearGradient id="skullGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#E9D5FF" />
            <Stop offset="50%" stopColor="#C084FC" />
            <Stop offset="100%" stopColor="#9333EA" />
          </LinearGradient>
        </Defs>

        {/* Lavender Skull Head */}
        <Path
          d="
            M 9 17
            C 9 11, 13 7, 18 7
            C 23 7, 27 11, 27 17
            C 27 21, 25 23, 23 24
            L 23 28
            C 23 29, 21 29.5, 18 29.5
            C 15 29.5, 13 29, 13 28
            L 13 24
            C 11 23, 9 21, 9 17
            Z"
          fill="url(#skullGrad)"
          stroke="#581C87"
          strokeWidth="1.2"
        />

        {/* Dark Eye Sockets */}
        <Ellipse cx="14" cy="17" rx="2.5" ry="3" fill="#3B0764" />
        <Ellipse cx="22" cy="17" rx="2.5" ry="3" fill="#3B0764" />

        {/* Inverted Heart / Triangle Nose */}
        <Path d="M18 21.5L17 23.5H19Z" fill="#3B0764" />

        {/* Teeth divisions */}
        <Path d="M15 26.5V29M18 26.5V29.5M21 26.5V29" stroke="#3B0764" strokeWidth="1" strokeLinecap="round" />

        {/* Golden Sparkle ✨ on top-right of skull */}
        <Path
          d="M26 6L27 9L30 10L27 11L26 14L25 11L22 10L25 9Z"
          fill="#FACC15"
          stroke="#CA8A04"
          strokeWidth="0.6"
        />
        <Circle cx="23" cy="6" r="0.8" fill="#FACC15" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  iconBase: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankBg: {
    backgroundColor: '#EFF6FF',
  },
  moneyBagBg: {
    backgroundColor: '#0F172A',
  },
  skullBg: {
    backgroundColor: '#DCFCE7',
  },
});
