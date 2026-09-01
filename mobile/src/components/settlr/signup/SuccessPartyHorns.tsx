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

interface SingleHornProps {
  scale?: number;
  rotation?: number;
  x?: number;
  y?: number;
}

function SingleHorn({ scale = 1, rotation = 0, x = 0, y = 0 }: SingleHornProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale}) rotate(${rotation}, 70, 70)`}>
      <Ellipse cx="70" cy="115" rx="45" ry="8" fill="rgba(0,0,0,0.12)" />

      <Defs>
        <LinearGradient id="hornGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#C084FC" />
          <Stop offset="50%" stopColor="#A855F7" />
          <Stop offset="100%" stopColor="#7E22CE" />
        </LinearGradient>
        <LinearGradient id="hornStripe" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#E9D5FF" />
          <Stop offset="100%" stopColor="#C084FC" />
        </LinearGradient>
        <LinearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FFF78A" />
          <Stop offset="50%" stopColor="#FACC15" />
          <Stop offset="100%" stopColor="#CA8A04" />
        </LinearGradient>
      </Defs>

      <Path
        d="M 15 105 L 110 50 A 24 38 0 0 1 125 95 L 15 105 Z"
        fill="url(#hornGrad)"
        stroke="#4C1D95"
        strokeWidth={1.5}
      />

      <Path
        d="M 35 103 L 48 83 A 20 28 0 0 1 56 97 L 45 102 Z"
        fill="url(#hornStripe)"
        opacity={0.8}
      />
      <Path
        d="M 65 92 L 80 68 A 22 32 0 0 1 92 86 L 76 92 Z"
        fill="url(#hornStripe)"
        opacity={0.8}
      />

      <Ellipse
        cx="118"
        cy="72"
        rx="14"
        ry="24"
        fill="#581C87"
        stroke="#3B0764"
        strokeWidth={1.5}
      />
      <Ellipse
        cx="116"
        cy="72"
        rx="10"
        ry="18"
        fill="#2E1065"
      />

      <Path
        d="
          M 115 65 
          C 105 50, 110 35, 125 35 
          C 140 35, 145 50, 130 65 
          C 115 80, 110 100, 125 105 
          C 135 108, 145 100, 150 90"
        stroke="#00F58D"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M 120 70 C 130 55, 150 60, 155 45 C 160 30, 145 20, 135 25"
        stroke="#10B981"
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />

      <G transform="translate(115, 45)">
        <Ellipse cx="14" cy="8" rx="9" ry="6" fill="url(#coinGrad)" stroke="#854D0E" strokeWidth={1} />
        <Ellipse cx="14" cy="8" rx="6" ry="4" fill="none" stroke="#FEF08A" strokeWidth={0.8} />
      </G>
      <G transform="translate(135, 20)">
        <Ellipse cx="12" cy="7" rx="8" ry="5" fill="url(#coinGrad)" stroke="#854D0E" strokeWidth={1} />
      </G>
      <G transform="translate(142, 60)">
        <Ellipse cx="10" cy="6" rx="7" ry="4.5" fill="url(#coinGrad)" stroke="#854D0E" strokeWidth={1} />
      </G>
      <G transform="translate(100, 25)">
        <Ellipse cx="9" cy="5" rx="6" ry="4" fill="url(#coinGrad)" stroke="#854D0E" strokeWidth={0.8} />
      </G>

      <Path d="M 125 15 L 128 19 L 125 23 L 122 19 Z" fill="#3B82F6" />
      <Rect x="145" y="40" width="4" height="4" fill="#EC4899" transform="rotate(25, 147, 42)" />
      <Rect x="105" y="48" width="4" height="4" fill="#38BDF8" transform="rotate(-15, 107, 50)" />
      <Path d="M 152 75 L 154 78 L 157 79 L 154 80 L 152 83 L 150 80 L 147 79 L 150 78 Z" fill="#2563EB" />
    </G>
  );
}

export function SuccessPartyHorns() {
  return (
    <View style={styles.hornsContainer} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <SingleHorn scale={0.95} rotation={-15} x={-30} y={40} />
        <SingleHorn scale={0.7} rotation={-145} x={360} y={100} />
        <SingleHorn scale={0.95} rotation={-140} x={360} y={400} />
        <SingleHorn scale={0.9} rotation={-10} x={-35} y={560} />
        <SingleHorn scale={0.65} rotation={-140} x={340} y={690} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  hornsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
