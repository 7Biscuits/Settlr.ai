import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

interface CoinProps {
  type: 'silver' | 'gold' | 'purple' | 'ghost';
  yOffset: number;
}

function RenderCoin({ type, yOffset }: CoinProps) {
  const rx = 33;
  const ry = 9;
  const cx = 36;
  const cy = 10;
  const height = 9;

  if (type === 'ghost') {
    return (
      <G y={yOffset} opacity={0.65}>
        {/* Ghost cylinder body */}
        <Path
          d={`M ${cx - rx} ${cy} L ${cx - rx} ${cy + height} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy + height} L ${cx + rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy} Z`}
          fill="rgba(50, 70, 160, 0.3)"
          stroke="rgba(140, 175, 255, 0.55)"
          strokeWidth={1.2}
        />
        {/* Ghost top face */}
        <Ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="rgba(70, 95, 195, 0.4)"
          stroke="rgba(160, 195, 255, 0.7)"
          strokeWidth={1.2}
        />
        {/* Ghost inner ring */}
        <Ellipse
          cx={cx}
          cy={cy}
          rx={rx - 4}
          ry={ry - 2}
          fill="none"
          stroke="rgba(160, 195, 255, 0.35)"
          strokeWidth={0.8}
        />
      </G>
    );
  }

  const gradPrefix = type;

  return (
    <G y={yOffset}>
      {/* 3D Extruded Cylinder Body */}
      <Path
        d={`M ${cx - rx} ${cy} L ${cx - rx} ${cy + height} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy + height} L ${cx + rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy} Z`}
        fill={`url(#${gradPrefix}_body)`}
        stroke="#161B33"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />

      {/* Side ridges */}
      <Path
        d={`M ${cx - rx + 4} ${cy + 3} L ${cx - rx + 4} ${cy + height + 2}`}
        stroke="#161B33"
        strokeWidth={0.9}
        opacity={0.6}
      />
      <Path
        d={`M ${cx - rx + 14} ${cy + 6} L ${cx - rx + 14} ${cy + height + 2}`}
        stroke="#161B33"
        strokeWidth={0.9}
        opacity={0.6}
      />
      <Path
        d={`M ${cx + rx - 4} ${cy + 3} L ${cx + rx - 4} ${cy + height + 2}`}
        stroke="#161B33"
        strokeWidth={0.9}
        opacity={0.6}
      />
      <Path
        d={`M ${cx + rx - 14} ${cy + 6} L ${cx + rx - 14} ${cy + height + 2}`}
        stroke="#161B33"
        strokeWidth={0.9}
        opacity={0.6}
      />

      {/* Top Face Ellipse */}
      <Ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={`url(#${gradPrefix}_top)`}
        stroke="#161B33"
        strokeWidth={1.4}
      />

      {/* Inner Inset Rim */}
      <Ellipse
        cx={cx}
        cy={cy}
        rx={rx - 4}
        ry={ry - 2}
        fill="none"
        stroke={`url(#${gradPrefix}_inner)`}
        strokeWidth={1.2}
      />

      {/* Subtle shine highlight */}
      <Path
        d={`M ${cx - rx + 7} ${cy - 2} A ${rx - 3} ${ry - 1.5} 0 0 1 ${cx - 5} ${cy - ry + 1.5}`}
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.8}
      />
    </G>
  );
}

interface CoinStackIllustrationProps {
  inAmount?: number;
  outAmount?: number;
}

export function CoinStackIllustration({ inAmount = 326, outAmount = 188 }: CoinStackIllustrationProps) {
  const silverCoins = [0, 1, 2, 3];
  const ghostCoins = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const yellowCoins = [0, 1, 2, 3];
  const purpleCoins = [0, 1];

  const coinSpacing = 9;

  return (
    <View style={styles.container}>
      {/* Shared SVG Defs for Gradients */}
      <Svg height="0" width="0" style={styles.hiddenSvg}>
        <Defs>
          {/* Silver Gradients */}
          <LinearGradient id="silver_top" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#EBF4FE" />
            <Stop offset="40%" stopColor="#D5E8FD" />
            <Stop offset="100%" stopColor="#AFCFF8" />
          </LinearGradient>
          <LinearGradient id="silver_body" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#9BC2F5" />
            <Stop offset="50%" stopColor="#7DAFF0" />
            <Stop offset="100%" stopColor="#558ED9" />
          </LinearGradient>
          <LinearGradient id="silver_inner" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#7DAFF0" stopOpacity="0.4" />
          </LinearGradient>

          {/* Gold / Yellow Gradients */}
          <LinearGradient id="gold_top" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFF78A" />
            <Stop offset="40%" stopColor="#FFE53B" />
            <Stop offset="100%" stopColor="#F5BE00" />
          </LinearGradient>
          <LinearGradient id="gold_body" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#F5BE00" />
            <Stop offset="50%" stopColor="#D99B00" />
            <Stop offset="100%" stopColor="#B37700" />
          </LinearGradient>
          <LinearGradient id="gold_inner" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#FFFDE0" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#D99B00" stopOpacity="0.5" />
          </LinearGradient>

          {/* Purple / Violet Gradients */}
          <LinearGradient id="purple_top" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#E2A6FF" />
            <Stop offset="40%" stopColor="#BD59FF" />
            <Stop offset="100%" stopColor="#9B26F2" />
          </LinearGradient>
          <LinearGradient id="purple_body" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#921FE8" />
            <Stop offset="50%" stopColor="#7409C9" />
            <Stop offset="100%" stopColor="#510099" />
          </LinearGradient>
          <LinearGradient id="purple_inner" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#F8E8FF" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#7409C9" stopOpacity="0.5" />
          </LinearGradient>
        </Defs>
      </Svg>

      {/* Breakdown Row */}
      <View style={styles.stacksRow}>
        {/* Left Column: IN */}
        <View style={styles.columnContainer}>
          <View style={styles.leftStackWrapper}>
            <View style={styles.otherBadge}>
              <Text style={styles.otherBadgeText}>Owed</Text>
            </View>

            <View style={styles.silverSvgContainer}>
              <Svg width={74} height={56} viewBox="0 0 74 56">
                {silverCoins.map((_, idx) => (
                  <RenderCoin
                    key={`silver-${idx}`}
                    type="silver"
                    yOffset={idx * coinSpacing}
                  />
                ))}
              </Svg>
            </View>
          </View>

          <Text style={styles.categoryLabel}>To Receive</Text>
          <Text style={styles.amountValue}>₹{Math.round(inAmount)}</Text>
        </View>

        {/* Right Column: OUT */}
        <View style={styles.columnContainer}>
          <View style={styles.rightStackWrapper}>
            <View style={styles.tallStackContainer}>
              <Svg width={74} height={158} viewBox="0 0 74 158">
                {ghostCoins.map((_, idx) => (
                  <RenderCoin
                    key={`ghost-${idx}`}
                    type="ghost"
                    yOffset={idx * coinSpacing}
                  />
                ))}

                {yellowCoins.map((_, idx) => (
                  <RenderCoin
                    key={`gold-${idx}`}
                    type="gold"
                    yOffset={(ghostCoins.length + idx) * coinSpacing}
                  />
                ))}

                {purpleCoins.map((_, idx) => (
                  <RenderCoin
                    key={`purple-${idx}`}
                    type="purple"
                    yOffset={
                      (ghostCoins.length + yellowCoins.length + idx) *
                      coinSpacing
                    }
                  />
                ))}
              </Svg>
            </View>

            <View style={styles.limitBadge}>
              <Text style={styles.limitBadgeText}>Limit</Text>
            </View>
            <View style={styles.spentBadge}>
              <Text style={styles.spentBadgeText}>Spent</Text>
            </View>
            <View style={styles.dueBadge}>
              <Text style={styles.dueBadgeText}>You Owe</Text>
            </View>
          </View>

          <Text style={styles.categoryLabel}>To Settle</Text>
          <Text style={styles.amountValue}>₹{Math.round(outAmount)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 28,
    marginTop: 8,
  },
  hiddenSvg: {
    position: 'absolute',
    opacity: 0,
  },
  stacksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minHeight: 180,
  },
  columnContainer: {
    alignItems: 'center',
    flex: 1,
  },
  leftStackWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
    height: 158,
  },
  silverSvgContainer: {
    justifyContent: 'flex-end',
    height: 158,
    paddingBottom: 2,
  },
  rightStackWrapper: {
    position: 'relative',
    height: 158,
    marginBottom: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  tallStackContainer: {
    height: 158,
  },
  otherBadge: {
    backgroundColor: '#1DF58E',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 6,
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  otherBadgeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  limitBadge: {
    position: 'absolute',
    right: -48,
    top: 2,
    backgroundColor: '#C5F6D9',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  limitBadgeText: {
    color: '#0E3D23',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  spentBadge: {
    position: 'absolute',
    right: -52,
    top: 94,
    backgroundColor: '#FF9500',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  spentBadgeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  dueBadge: {
    position: 'absolute',
    right: -58,
    bottom: 4,
    backgroundColor: '#D6A8FF',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  dueBadgeText: {
    color: '#3B0764',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  categoryLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  amountValue: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    marginTop: 1,
    letterSpacing: -0.5,
  },
});
