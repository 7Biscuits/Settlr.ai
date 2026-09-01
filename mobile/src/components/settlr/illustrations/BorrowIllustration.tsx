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
  Text as SvgText,
} from 'react-native-svg';

interface BorrowIllustrationProps {
  advanceAmount?: number;
  feeAmount?: number;
}

export function BorrowIllustration({ advanceAmount = 250, feeAmount = 0 }: BorrowIllustrationProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stacksRow}>
        {/* Left Column: AVAILABLE */}
        <View style={styles.columnContainer}>
          <View style={styles.leftStackWrapper}>
            <View style={styles.approvedBadge}>
              <Text style={styles.badgeText}>Instant</Text>
            </View>

            {/* 3D Banknote & Coins Stack SVG */}
            <View style={styles.cashSvgContainer}>
              <Svg width={80} height={120} viewBox="0 0 80 120">
                <Defs>
                  <LinearGradient id="billG" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#86EFAC" />
                    <Stop offset="50%" stopColor="#22C55E" />
                    <Stop offset="100%" stopColor="#15803D" />
                  </LinearGradient>
                  <LinearGradient id="silverBase" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#EBF4FE" />
                    <Stop offset="100%" stopColor="#8ABEF9" />
                  </LinearGradient>
                </Defs>

                {/* Bottom Coin Stack Base */}
                <G transform="translate(4, 76)">
                  <Path
                    d="M 2 6 L 2 15 A 34 8 0 0 0 70 15 L 70 6 A 34 8 0 0 1 2 6 Z"
                    fill="url(#silverBase)"
                    stroke="#161B33"
                    strokeWidth={1.4}
                  />
                  <Ellipse cx="36" cy="6" rx="34" ry="8" fill="url(#silverBase)" stroke="#161B33" strokeWidth={1.4} />
                  <Ellipse cx="36" cy="6" rx="30" ry="6" fill="none" stroke="#FFFFFF" strokeWidth={1.2} opacity={0.7} />
                </G>

                {/* 3D Dollar Bill on top */}
                <G transform="translate(6, 24) rotate(-6, 34, 25)">
                  <Rect
                    x="2"
                    y="2"
                    width="66"
                    height="38"
                    rx="5"
                    fill="url(#billG)"
                    stroke="#161B33"
                    strokeWidth={1.5}
                  />
                  <Rect
                    x="5"
                    y="5"
                    width="60"
                    height="32"
                    rx="3"
                    fill="none"
                    stroke="#DCFCE7"
                    strokeWidth={1}
                    strokeDasharray="3,1.5"
                  />
                  <Circle cx="35" cy="21" r="10" fill="#DCFCE7" stroke="#15803D" strokeWidth={1} />
                  <SvgText fill="#14532D" fontSize="13" fontWeight="bold" x="31" y="25">$</SvgText>
                </G>

                {/* Electric Lightning Bolt */}
                <Path d="M 68 18 L 74 10 L 71 20 L 77 20 L 68 32 L 71 23 Z" fill="#FACC15" />
              </Svg>
            </View>
          </View>

          <Text style={styles.categoryLabel}>P2P Send</Text>
          <Text style={styles.amountValue}>${Math.round(advanceAmount)}</Text>
        </View>

        {/* Right Column: FEE */}
        <View style={styles.columnContainer}>
          <View style={styles.rightStackWrapper}>
            <View style={styles.tallStackContainer}>
              <Svg width={74} height={158} viewBox="0 0 74 158">
                <Defs>
                  <LinearGradient id="gCoinTopB" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#FFF78A" />
                    <Stop offset="50%" stopColor="#FFE53B" />
                    <Stop offset="100%" stopColor="#F5BE00" />
                  </LinearGradient>
                  <LinearGradient id="gCoinBodyB" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#F5BE00" />
                    <Stop offset="100%" stopColor="#B37700" />
                  </LinearGradient>
                  <LinearGradient id="pCoinTopB" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#E2A6FF" />
                    <Stop offset="50%" stopColor="#BD59FF" />
                    <Stop offset="100%" stopColor="#9B26F2" />
                  </LinearGradient>
                  <LinearGradient id="pCoinBodyB" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#921FE8" />
                    <Stop offset="100%" stopColor="#510099" />
                  </LinearGradient>
                </Defs>

                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => {
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
                  const y = (9 + idx) * 9;
                  return (
                    <G key={`gold-${idx}`} y={y}>
                      <Path
                        d="M 3 10 L 3 19 A 33 9 0 0 0 69 19 L 69 10 A 33 9 0 0 1 3 10 Z"
                        fill="url(#gCoinBodyB)"
                        stroke="#161B33"
                        strokeWidth={1.4}
                      />
                      <Ellipse cx="36" cy="10" rx="33" ry="9" fill="url(#gCoinTopB)" stroke="#161B33" strokeWidth={1.4} />
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
                        fill="url(#pCoinBodyB)"
                        stroke="#161B33"
                        strokeWidth={1.4}
                      />
                      <Ellipse cx="36" cy="10" rx="33" ry="9" fill="url(#pCoinTopB)" stroke="#161B33" strokeWidth={1.4} />
                      <Ellipse cx="36" cy="10" rx="29" ry="7" fill="none" stroke="#F8E8FF" strokeWidth={1.1} opacity={0.8} />
                    </G>
                  );
                })}
              </Svg>
            </View>

            <View style={styles.limitBadge}>
              <Text style={styles.limitBadgeText}>Limit</Text>
            </View>
            <View style={styles.zeroAprBadge}>
              <Text style={styles.badgeText}>0% Fee</Text>
            </View>
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>Free</Text>
            </View>
          </View>

          <Text style={styles.categoryLabel}>Fee</Text>
          <Text style={styles.amountValue}>${Math.round(feeAmount)}</Text>
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
  cashSvgContainer: {
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
  approvedBadge: {
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
  zeroAprBadge: {
    position: 'absolute',
    right: -52,
    top: 94,
    backgroundColor: '#FF9500',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  freeBadge: {
    position: 'absolute',
    right: -42,
    bottom: 4,
    backgroundColor: '#D6A8FF',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  freeBadgeText: {
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
