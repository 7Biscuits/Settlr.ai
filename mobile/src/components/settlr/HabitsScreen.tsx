import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

import { SettlrMouth } from './illustrations/SettlrMouth';
import { HabitsIllustration } from './illustrations/HabitsIllustration';
import { ThumbsUpHand } from './illustrations/ThumbsUpHand';
import {
  BankBuildingIcon,
  MoneyBagIcon,
  SkullSparkleIcon,
} from './illustrations/TransactionIcons';

interface HabitItem {
  id: string;
  title: string;
  amount: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

const INITIAL_EXPENSES: HabitItem[] = [
  {
    id: '1',
    title: 'Daily Iced Latte • Blue Tokai ☕',
    amount: '-$5.75',
    isPositive: false,
    icon: <SkullSparkleIcon />,
  },
  {
    id: '2',
    title: 'Midnight Swiggy • Group Munchies 🍔',
    amount: '-$32.40',
    isPositive: false,
    icon: <MoneyBagIcon />,
  },
  {
    id: '3',
    title: 'Team Airbnb Booking • Goa 🏖️',
    amount: '-$64.99',
    isPositive: false,
    icon: <BankBuildingIcon />,
  },
];

const EXTRA_EXPENSES: HabitItem[] = [
  {
    id: '4',
    title: 'Nintendo Switch Game Split 🎮',
    amount: '-$49.99',
    isPositive: false,
    icon: <SkullSparkleIcon />,
  },
  {
    id: '5',
    title: 'Brewery Bill Split • 4 people 🍸',
    amount: '-$28.50',
    isPositive: false,
    icon: <MoneyBagIcon />,
  },
];

interface HabitsScreenProps {
  onOpenSettings?: () => void;
  onAddExpense?: () => void;
  streakDays?: number;
  resistedAmount?: number;
  capAmount?: number;
}

export function HabitsScreen({
  onOpenSettings,
  onAddExpense,
  streakDays = 14,
  resistedAmount = 184,
  capAmount = 200,
}: HabitsScreenProps) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 24);
  const [showInsightBanner, setShowInsightBanner] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const expenses = expanded
    ? [...INITIAL_EXPENSES, ...EXTRA_EXPENSES]
    : INITIAL_EXPENSES;

  return (
    <View style={styles.safeArea}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Top Blue Header Section */}
        <View style={[styles.topSection, { paddingTop: topInset + 4 }]}>
          {/* Header Title & Settings Row */}
          <View style={styles.headerRow}>
            <View style={styles.headerSpacer} />
            <Text style={styles.headerTitle}>EXPENSE HABITS</Text>
            <Pressable
              hitSlop={14}
              style={styles.settingsButton}
              onPress={onOpenSettings}>
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Date Subtitle */}
          <Text style={styles.dateSubtitle}>March 1 - March 31 • Group Habits</Text>

          {/* Date Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View style={styles.progressBarFill} />
          </View>

          {/* Streak Label */}
          <Text style={styles.daysLeftText}>{streakDays} day on-budget streak 🔥</Text>

          {/* Visual & Side Navigation Arrows */}
          <View style={styles.visualWrapper}>
            <Pressable style={styles.leftCarouselButton}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>

            <Pressable style={styles.rightCarouselButton}>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </Pressable>

            <HabitsIllustration
              streakDays={streakDays}
              resistedAmount={resistedAmount}
              capAmount={capAmount}
            />
          </View>
        </View>

        {/* White Bottom Card Container */}
        <View style={styles.bottomCard}>
          <ThumbsUpHand />

          {/* Stats Split Row */}
          <View style={styles.statsRow}>
            {/* Left Metric: Guilty Pleasure Cap */}
            <View style={styles.statColumn}>
              <View style={styles.amountRow}>
                <Text style={styles.currencySymbol}>$</Text>
                <Text style={styles.statInteger}>16</Text>
                <Text style={styles.statDecimal}>.00</Text>
              </View>
              <View style={styles.statSubRow}>
                <Text style={styles.statSubTextMuted}>left of </Text>
                <Text style={styles.statSubTextBlue}>${capAmount} cap</Text>
                <View style={styles.pencilIconWrapper}>
                  <Svg width={14} height={14} viewBox="0 0 24 24">
                    <Path
                      d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
                      stroke="#1E3A8A"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <Path
                      d="M15 5l4 4"
                      stroke="#1E3A8A"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>
              </View>
            </View>

            {/* Vertical Divider */}
            <View style={styles.verticalDivider} />

            {/* Right Metric: Daily Limit */}
            <View style={styles.statColumn}>
              <View style={styles.amountRow}>
                <Text style={styles.currencySymbol}>$</Text>
                <Text style={styles.statInteger}>5</Text>
                <Text style={styles.statDecimal}>.20</Text>
              </View>
              <Text style={styles.statSubTextMuted}>safe daily split</Text>
            </View>
          </View>

          {/* Mascot Insight Banner */}
          {showInsightBanner && (
            <View style={styles.insightBanner}>
              <SettlrMouth />
              <Text style={styles.insightText}>
                You stayed under your solo takeout budget 4 days in a row! Roast averted 💀
              </Text>
              <Pressable
                hitSlop={8}
                style={styles.closeBannerButton}
                onPress={() => setShowInsightBanner(false)}>
                <Ionicons name="close" size={16} color="#667085" />
              </Pressable>
            </View>
          )}

          {/* Recent Split Expenses Section */}
          <View style={styles.sectionHeaderWrapper}>
            <Pressable
              onPress={() => setExpanded((prev) => !prev)}
              style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>RECENT SPLITS</Text>
              <Feather name={expanded ? "chevron-up" : "arrow-right"} size={24} color="#000000" />
            </Pressable>
          </View>

          {/* Expenses List */}
          <View style={styles.pleasuresList}>
            {expenses.map((item) => (
              <View key={item.id} style={styles.pleasureRow}>
                <View style={styles.pleasureLeft}>
                  {item.icon}
                  <Text style={styles.pleasureName} numberOfLines={1}>
                    {item.title}
                  </Text>
                </View>

                <View style={styles.amountContainer}>
                  <Text
                    style={[
                      styles.pleasureAmount,
                      item.isPositive ? styles.positiveAmount : styles.neutralAmount,
                    ]}>
                    {item.amount}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* View More Link */}
          <Pressable
            onPress={() => setExpanded((prev) => !prev)}
            style={styles.viewMoreButton}>
            <Text style={styles.viewMoreText}>
              {expanded ? 'Show less' : 'View more'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#151C8A',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    backgroundColor: '#151C8A',
    alignItems: 'center',
    paddingBottom: 22,
    position: 'relative',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 4,
  },
  headerSpacer: {
    width: 24,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  settingsButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSubtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 6,
    opacity: 0.95,
  },
  progressBarTrack: {
    width: 140,
    height: 6.5,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '92%',
    height: '100%',
    backgroundColor: '#00F58D',
    borderRadius: 4,
  },
  daysLeftText: {
    color: '#00F58D',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: -0.1,
  },
  visualWrapper: {
    width: '100%',
    position: 'relative',
    marginTop: 6,
  },
  leftCarouselButton: {
    position: 'absolute',
    left: 0,
    top: '48%',
    width: 44,
    height: 48,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    paddingRight: 6,
  },
  rightCarouselButton: {
    position: 'absolute',
    right: 0,
    top: '48%',
    width: 44,
    height: 48,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    paddingLeft: 6,
  },
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 24,
    position: 'relative',
    flex: 1,
    minHeight: 280,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currencySymbol: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  statInteger: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  statDecimal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  statSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statSubTextMuted: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  statSubTextBlue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  pencilIconWrapper: {
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 52,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 10,
  },
  insightBanner: {
    backgroundColor: '#E8FAF1',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 24,
  },
  insightText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14.5,
    fontWeight: '600',
    marginLeft: 10,
    marginRight: 6,
    lineHeight: 20,
  },
  closeBannerButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderWrapper: {
    marginTop: 26,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  sectionTitle: {
    color: '#000000',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pleasuresList: {
    gap: 16,
  },
  pleasureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  pleasureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  pleasureName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
  amountContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  pleasureAmount: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  positiveAmount: {
    color: '#059669',
  },
  neutralAmount: {
    color: '#0F172A',
  },
  viewMoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 6,
  },
  viewMoreText: {
    color: '#1E293B',
    fontSize: 15.5,
    fontWeight: '700',
  },
});
