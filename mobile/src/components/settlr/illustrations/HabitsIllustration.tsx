import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

interface HabitsIllustrationProps {
  streakDays?: number;
  resistedAmount?: number;
  capAmount?: number;
}

export function HabitsIllustration({ streakDays = 14, resistedAmount = 184, capAmount = 200 }: HabitsIllustrationProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stacksRow}>
        {/* Left Column: RESISTED */}
        <View style={styles.columnContainer}>
          <View style={styles.leftStackWrapper}>
            <View style={styles.streakBadge}>
              <Text style={styles.badgeText}>Streak: {streakDays}d</Text>
            </View>

            {/* 3D Flame Mascot & Coins Stack SVG */}
            <View style={styles.flameSvgContainer}>
              <Svg width={80} height={120} viewBox="0 0 80 120">
                <Defs>
                  <LinearGradient id="flameG" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#FFAA00" />
                    <Stop offset="50%" stopColor="#FF5500" />
                    <Stop offset="100%" stopColor="#D90429" />
                  </LinearGradient>
                  <LinearGradient id="innerG" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#FFF275" />
                    <Stop offset="100%" stopColor="#FFAA00" />
                  </LinearGradient>
                  <LinearGradient id="silverBaseH" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#EBF4FE" />
                    <Stop offset="100%" stopColor="#8ABEF9" />
                  </LinearGradient>
                </Defs>

                {/* Bottom Coin Stack Base */}
                <G transform="translate(4, 76)">
                  <Path
                    d="M 2 6 L 2 15 A 34 8 0 0 0 70 15 L 70 6 A 34 8 0 0 1 2 6 Z"
                    fill="url(#silverBaseH)"
                    stroke="#161B33"
                    strokeWidth={1.4}
                  />
                  <Ellipse cx="36" cy="6" rx="34" ry="8" fill="url(#silverBaseH)" stroke="#161B33" strokeWidth={1.4} />
                  <Ellipse cx="36" cy="6" rx="30" ry="6" fill="none" stroke="#FFFFFF" strokeWidth={1.2} opacity={0.7} />
                </G>

                {/* 3D Flame on top */}
                <G transform="translate(10, 10)">
                  <Path
                    d="
                      M 30 4 
                      C 30 4, 44 18, 44 34 
                      C 44 42, 40 48, 36 50 
                      C 40 48, 48 42, 50 36 
                      C 56 46, 56 56, 54 62 
                      C 50 70, 40 72, 30 72 
                      C 20 72, 10 70, 6 62 
                      C 4 56, 6 46, 12 36 
                      C 14 42, 20 48, 24 50 
                      C 20 48, 16 42, 16 34 
                      C 16 18, 30 4, 30 4 
                      Z"
                    fill="url(#flameG)"
                    stroke="#161B33"
                    strokeWidth={1.5}
                  />
                  <Path
                    d="M 30 26 C 30 26, 38 38, 38 48 C 38 58, 34 64, 30 64 C 26 64, 22 58, 22 48 C 22 38, 30 26, 30 26 Z"
                    fill="url(#innerG)"
                  />
                  <Circle cx="26" cy="46" r="2.2" fill="#161B33" />
                  <Circle cx="34" cy="46" r="2.2" fill="#161B33" />
                  <Circle cx="26.7" cy="45.2" r="0.7" fill="#FFFFFF" />
                  <Circle cx="34.7" cy="45.2" r="0.7" fill="#FFFFFF" />
                  <Path d="M 28 52 Q 30 55 32 52" stroke="#161B33" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                </G>
              </Svg>
            </View>
          </View>

          <Text style={styles.categoryLabel}>Saved</Text>
          <Text style={styles.amountValue}>${Math.round(resistedAmount)}</Text>
        </View>

        {/* Right Column: CAP */}
        <View style={styles.columnContainer}>
          <View style={styles.rightStackWrapper}>
            <View style={styles.tallStackContainer}>
              <Svg width={74} height={158} viewBox="0 0 74 158">
                <Defs>
                  <LinearGradient id="gCoinTopH" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#FFF78A" />
                    <Stop offset="50%" stopColor="#FFE53B" />
                    <Stop offset="100%" stopColor="#F5BE00" />
                  </LinearGradient>
                  <LinearGradient id="gCoinBodyH" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#F5BE00" />
                    <Stop offset="100%" stopColor="#B37700" />
                  </LinearGradient>
                  <LinearGradient id="pCoinTopH" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#E2A6FF" />
                    <Stop offset="50%" stopColor="#BD59FF" />
                    <Stop offset="100%" stopColor="#9B26F2" />
                  </LinearGradient>
                  <LinearGradient id="pCoinBodyH" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#921FE8" />
                    <Stop offset="100%" stopColor="#510099" />
                  </LinearGradient>
                </Defs>

                {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
                  const y = idx * 9;
                  return (
                    <G key={`ghost-${idx}`} y={y} opacity={0.6}>
                      <Path
                        d="M 3 10 L 3 19 A 33 9 0 0 0 69 19 L 69 10 A 33 9 0 0 1 3 10 Z"
                        fill="rgba(50, 70, 160, 0.3)"
                        stroke="rgba(140, 175, 255, 0.55)"
                        strokeWidth={1.2}
                      />
                      <Ellipse cx="36" cy="10" rx="33" ry="9" fill="rgba(70, 95, 195, 0.4)" stroke="rgba(160, 195, 255, 0.7)" strokeWidth={1.2} />
                    </G>
                  );
                })}

                {[0, 1, 2, 3, 4].map((idx) => {
                  const y = (8 + idx) * 9;
                  return (
                    <G key={`gold-${idx}`} y={y}>
                      <Path
                        d="M 3 10 L 3 19 A 33 9 0 0 0 69 19 L 69 10 A 33 9 0 0 1 3 10 Z"
                        fill="url(#gCoinBodyH)"
                        stroke="#161B33"
                        strokeWidth={1.4}
                      />
                      <Ellipse cx="36" cy="10" rx="33" ry="9" fill="url(#gCoinTopH)" stroke="#161B33" strokeWidth={1.4} />
                      <Ellipse cx="36" cy="10" rx="29" ry="7" fill="none" stroke="#FFFDE0" strokeWidth={1.1} opacity={0.8} />
                    </G>
                  );
                })}

                {[0, 1].map((idx) => {
                  const y = (13 + idx) * 9;
                  return (
                    <G key={`purple-${idx}`} y={y}>
                      <Path
                        d="M 3 10 L 3 19 A 33 9 0 0 0 69 19 L 69 10 A 33 9 0 0 1 3 10 Z"
                        fill="url(#pCoinBodyH)"
                        stroke="#161B33"
                        strokeWidth={1.4}
                      />
                      <Ellipse cx="36" cy="10" rx="33" ry="9" fill="url(#pCoinTopH)" stroke="#161B33" strokeWidth={1.4} />
                      <Ellipse cx="36" cy="10" rx="29" ry="7" fill="none" stroke="#F8E8FF" strokeWidth={1.1} opacity={0.8} />
                    </G>
                  );
                })}
              </Svg>
            </View>

            <View style={styles.limitBadge}>
              <Text style={styles.limitBadgeText}>Limit</Text>
            </View>
            <View style={styles.guiltyBadge}>
              <Text style={styles.badgeText}>Splits</Text>
            </View>
            <View style={styles.savedBadge}>
              <Text style={styles.savedBadgeText}>Budget</Text>
            </View>
          </View>

          <Text style={styles.categoryLabel}>Cap</Text>
          <Text style={styles.amountValue}>${Math.round(capAmount)}</Text>
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
  flameSvgContainer: {
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
  streakBadge: {
    backgroundColor: '#1DF58E',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 6,
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  badgeText: {
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
  guiltyBadge: {
    position: 'absolute',
    right: -52,
    top: 86,
    backgroundColor: '#FF9500',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  savedBadge: {
    position: 'absolute',
    right: -58,
    bottom: 4,
    backgroundColor: '#D6A8FF',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  savedBadgeText: {
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
