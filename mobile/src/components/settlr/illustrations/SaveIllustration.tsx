import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

interface SaveIllustrationProps {
  savedAmount?: number;
  targetAmount?: number;
}

export function SaveIllustration({ savedAmount = 1420, targetAmount = 2000 }: SaveIllustrationProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stacksRow}>
        {/* Left Column: SAVED */}
        <View style={styles.columnContainer}>
          <View style={styles.leftStackWrapper}>
            <View style={styles.autosaveBadge}>
              <Text style={styles.badgeText}>Settled</Text>
            </View>

            {/* 3D Piggy Vault SVG */}
            <View style={styles.piggySvgContainer}>
              <Svg width={80} height={120} viewBox="0 0 80 120">
                <Defs>
                  <LinearGradient id="piggyG" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#FFA4D4" />
                    <Stop offset="40%" stopColor="#FF60B0" />
                    <Stop offset="100%" stopColor="#D91E80" />
                  </LinearGradient>
                  <LinearGradient id="coinG" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#FFF480" />
                    <Stop offset="100%" stopColor="#E5A000" />
                  </LinearGradient>
                  <LinearGradient id="potGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#EBF4FE" />
                    <Stop offset="50%" stopColor="#C2DEFD" />
                    <Stop offset="100%" stopColor="#8ABEF9" />
                  </LinearGradient>
                </Defs>

                {/* Bottom Coin Stack Base */}
                <G transform="translate(4, 76)">
                  <Path
                    d="M 2 6 L 2 15 A 34 8 0 0 0 70 15 L 70 6 A 34 8 0 0 1 2 6 Z"
                    fill="url(#potGrad)"
                    stroke="#161B33"
                    strokeWidth={1.4}
                  />
                  <Ellipse cx="36" cy="6" rx="34" ry="8" fill="url(#potGrad)" stroke="#161B33" strokeWidth={1.4} />
                  <Ellipse cx="36" cy="6" rx="30" ry="6" fill="none" stroke="#FFFFFF" strokeWidth={1.2} opacity={0.7} />
                </G>

                {/* Piggy on top of stack */}
                <G transform="translate(6, 14)">
                  <Path
                    d="
                      M 60 38 
                      C 60 22, 48 14, 34 14 
                      C 18 14, 8 24, 8 38 
                      C 8 50, 16 56, 28 56 
                      L 28 62 L 34 62 L 34 56 
                      L 44 56 L 44 62 L 50 62 L 50 54 
                      C 56 50, 60 44, 60 38 
                      Z"
                    fill="url(#piggyG)"
                    stroke="#161B33"
                    strokeWidth={1.5}
                  />
                  <Path d="M 60 32 H 66 C 69 32, 69 42, 66 42 H 60" fill="#FF8EC6" stroke="#161B33" strokeWidth={1.2} />
                  <Circle cx="64" cy="35.5" r="1.2" fill="#161B33" />
                  <Circle cx="64" cy="38.5" r="1.2" fill="#161B33" />
                  <Path d="M 20 18 L 14 8 C 12 6, 16 4, 19 6 L 26 16" fill="#FF8EC6" stroke="#161B33" strokeWidth={1.2} />
                  <Circle cx="50" cy="28" r="2.2" fill="#161B33" />
                  <Circle cx="51" cy="27" r="0.7" fill="#FFFFFF" />
                  <Rect x="28" y="12" width="14" height="3" rx="1.5" fill="#161B33" />
                  <Ellipse cx="35" cy="5" rx="6" ry="4.5" fill="url(#coinG)" stroke="#161B33" strokeWidth={1} />
                </G>
              </Svg>
            </View>
          </View>

          <Text style={styles.categoryLabel}>Vault</Text>
          <Text style={styles.amountValue}>${Math.round(savedAmount).toLocaleString()}</Text>
        </View>

        {/* Right Column: TARGET */}
        <View style={styles.columnContainer}>
          <View style={styles.rightStackWrapper}>
            <View style={styles.tallStackContainer}>
              <Svg width={74} height={158} viewBox="0 0 74 158">
                <Defs>
                  <LinearGradient id="gCoinTop" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#FFF78A" />
                    <Stop offset="50%" stopColor="#FFE53B" />
                    <Stop offset="100%" stopColor="#F5BE00" />
                  </LinearGradient>
                  <LinearGradient id="gCoinBody" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#F5BE00" />
                    <Stop offset="100%" stopColor="#B37700" />
                  </LinearGradient>
                  <LinearGradient id="pCoinTop" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#E2A6FF" />
                    <Stop offset="50%" stopColor="#BD59FF" />
                    <Stop offset="100%" stopColor="#9B26F2" />
                  </LinearGradient>
                  <LinearGradient id="pCoinBody" x1="0" y1="0" x2="0" y2="1">
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

                {[0, 1, 2, 3].map((idx) => {
                  const y = (8 + idx) * 9;
                  return (
                    <G key={`gold-${idx}`} y={y}>
                      <Path
                        d="M 3 10 L 3 19 A 33 9 0 0 0 69 19 L 69 10 A 33 9 0 0 1 3 10 Z"
                        fill="url(#gCoinBody)"
                        stroke="#161B33"
                        strokeWidth={1.4}
                      />
                      <Ellipse cx="36" cy="10" rx="33" ry="9" fill="url(#gCoinTop)" stroke="#161B33" strokeWidth={1.4} />
                      <Ellipse cx="36" cy="10" rx="29" ry="7" fill="none" stroke="#FFFDE0" strokeWidth={1.1} opacity={0.8} />
                    </G>
                  );
                })}

                {[0, 1, 2].map((idx) => {
                  const y = (12 + idx) * 9;
                  return (
                    <G key={`purple-${idx}`} y={y}>
                      <Path
                        d="M 3 10 L 3 19 A 33 9 0 0 0 69 19 L 69 10 A 33 9 0 0 1 3 10 Z"
                        fill="url(#pCoinBody)"
                        stroke="#161B33"
                        strokeWidth={1.4}
                      />
                      <Ellipse cx="36" cy="10" rx="33" ry="9" fill="url(#pCoinTop)" stroke="#161B33" strokeWidth={1.4} />
                      <Ellipse cx="36" cy="10" rx="29" ry="7" fill="none" stroke="#F8E8FF" strokeWidth={1.1} opacity={0.8} />
                    </G>
                  );
                })}
              </Svg>
            </View>

            <View style={styles.targetBadge}>
              <Text style={styles.targetBadgeText}>Goal</Text>
            </View>
            <View style={styles.goalsBadge}>
              <Text style={styles.badgeText}>Pots</Text>
            </View>
            <View style={styles.roundupBadge}>
              <Text style={styles.roundupBadgeText}>Split</Text>
            </View>
          </View>

          <Text style={styles.categoryLabel}>Target</Text>
          <Text style={styles.amountValue}>${Math.round(targetAmount).toLocaleString()}</Text>
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
  piggySvgContainer: {
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
  autosaveBadge: {
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
  targetBadge: {
    position: 'absolute',
    right: -48,
    top: 2,
    backgroundColor: '#C5F6D9',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  targetBadgeText: {
    color: '#0E3D23',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  goalsBadge: {
    position: 'absolute',
    right: -48,
    top: 82,
    backgroundColor: '#FF9500',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  roundupBadge: {
    position: 'absolute',
    right: -48,
    bottom: 8,
    backgroundColor: '#D6A8FF',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  roundupBadgeText: {
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
