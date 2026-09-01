import React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';
import { Feather, Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function PlanetSvg({ size = 52 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 0.7} viewBox="0 0 60 42">
      <Defs>
        <LinearGradient id="planetGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#6EE7B7" />
          <Stop offset="40%" stopColor="#10B981" />
          <Stop offset="100%" stopColor="#047857" />
        </LinearGradient>
        <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#C084FC" />
          <Stop offset="50%" stopColor="#9333EA" />
          <Stop offset="100%" stopColor="#7E22CE" />
        </LinearGradient>
      </Defs>

      {/* Back half of ring */}
      <Path
        d="M 6 21 C 6 15, 54 15, 54 21"
        stroke="url(#ringGrad)"
        strokeWidth={3.5}
        fill="none"
      />

      {/* Planet Sphere */}
      <Circle
        cx={30}
        cy={21}
        r={14}
        fill="url(#planetGrad)"
        stroke="#064E3B"
        strokeWidth={1.2}
      />

      {/* Craters */}
      <Circle cx={25} cy={16} r={2.2} fill="#047857" opacity={0.6} />
      <Circle cx={34} cy={23} r={1.6} fill="#047857" opacity={0.6} />
      <Circle cx={28} cy={27} r={1.2} fill="#047857" opacity={0.5} />

      {/* Front half of ring */}
      <Path
        d="M 6 21 C 6 27, 54 27, 54 21"
        stroke="url(#ringGrad)"
        strokeWidth={3.5}
        fill="none"
      />
      <Path
        d="M 8 21 C 8 26, 52 26, 52 21"
        stroke="#E9D5FF"
        strokeWidth={0.8}
        fill="none"
        opacity={0.7}
      />
    </Svg>
  );
}

function SettlrLogoBadge() {
  return (
    <View style={styles.settlrLogoContainer}>
      <View style={styles.settlrPill}>
        <Text style={styles.settlrPillText}>SETTLR</Text>
      </View>
    </View>
  );
}

interface SettlrPlanetCardCarouselProps {
  balance?: number;
  currency?: string;
  onTopUp?: () => void;
  onConnect?: () => void;
}

export function SettlrPlanetCardCarousel({
  balance = 0,
  currency = 'USD',
  onTopUp,
  onConnect,
}: SettlrPlanetCardCarouselProps) {
  const intVal = Math.floor(balance);
  const decVal = (balance % 1).toFixed(2).substring(1);

  return (
    <View style={styles.container}>
      {/* Cards Row */}
      <View style={styles.cardsRow}>
        {/* Main Card: Settlr Planet Card */}
        <View style={styles.primaryCard}>
          {/* Background Planets */}
          <View style={styles.planetTopLeft}>
            <PlanetSvg size={48} />
          </View>
          <View style={styles.planetTopRight}>
            <PlanetSvg size={54} />
          </View>
          <View style={styles.planetBottomLeft}>
            <PlanetSvg size={56} />
          </View>
          <View style={styles.planetBottomRight}>
            <PlanetSvg size={52} />
          </View>

          {/* Card Top Row */}
          <View style={styles.cardHeader}>
            <View style={styles.checkingBadge}>
              <Text style={styles.checkingText}>Settlr Wallet</Text>
            </View>
            <SettlrLogoBadge />
          </View>

          {/* Center Balance Display */}
          <View style={styles.balanceContainer}>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceDollar}>${intVal.toLocaleString()}</Text>
              <Text style={styles.balanceCents}>{decVal}</Text>
            </View>
            <Text style={styles.balanceLabel}>Available Balance</Text>
          </View>
        </View>

        {/* Secondary Card Peek: Top-up / Vault Card */}
        <Pressable onPress={onTopUp} style={styles.secondaryCard}>
          <View style={styles.connectBadge}>
            <Text style={styles.connectBadgeText}>Instant</Text>
          </View>

          <View style={styles.handPeekTop}>
            <Feather name="zap" size={28} color="#FFFFFF" />
          </View>

          <View style={styles.connectContent}>
            <Ionicons name="add-circle-outline" size={24} color="#000000" />
            <Text style={styles.connectText}>Top Up</Text>
          </View>
        </Pressable>
      </View>

      {/* Pagination Dots */}
      <View style={styles.paginationDots}>
        <View style={[styles.dot, styles.activeDot]} />
        <View style={[styles.dot, styles.inactiveDot]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
  },
  cardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingLeft: 20,
    gap: 14,
  },
  primaryCard: {
    width: SCREEN_WIDTH > 440 ? 270 : SCREEN_WIDTH * 0.68,
    height: 184,
    backgroundColor: '#2738F5',
    borderRadius: 24,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
    shadowColor: '#2738F5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  planetTopLeft: {
    position: 'absolute',
    left: -10,
    top: -6,
    opacity: 0.95,
  },
  planetTopRight: {
    position: 'absolute',
    right: 2,
    top: 6,
    opacity: 0.95,
  },
  planetBottomLeft: {
    position: 'absolute',
    left: -6,
    bottom: 2,
    opacity: 0.95,
  },
  planetBottomRight: {
    position: 'absolute',
    right: 6,
    bottom: -6,
    opacity: 0.95,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  checkingBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 2,
  },
  checkingText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  settlrLogoContainer: {
    marginRight: 8,
  },
  settlrPill: {
    backgroundColor: '#00F58D',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  settlrPillText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  balanceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    zIndex: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  balanceDollar: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  balanceCents: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  balanceLabel: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.95,
  },
  secondaryCard: {
    width: SCREEN_WIDTH > 440 ? 140 : SCREEN_WIDTH * 0.35,
    height: 184,
    backgroundColor: '#00F58D',
    borderRadius: 24,
    padding: 14,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
  },
  connectBadge: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  connectBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  handPeekTop: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  connectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  connectText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  activeDot: {
    backgroundColor: '#2738F5',
  },
  inactiveDot: {
    backgroundColor: '#C7D2FE',
  },
});
