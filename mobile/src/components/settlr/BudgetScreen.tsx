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
import { CoinStackIllustration } from './illustrations/CoinStackIllustration';
import { ThumbsUpHand } from './illustrations/ThumbsUpHand';

interface GroupDebtItem {
  id: string;
  groupName: string;
  userOwes: boolean;
  amount: number;
  otherMember: string;
}

const DEFAULT_DEBTS: GroupDebtItem[] = [
  {
    id: '1',
    groupName: 'Goa Trip 🏖️',
    userOwes: false,
    amount: 145.50,
    otherMember: 'Rahul Verma',
  },
  {
    id: '2',
    groupName: 'Apartment 402 🏠',
    userOwes: true,
    amount: 68.20,
    otherMember: 'Priya Sharma',
  },
  {
    id: '3',
    groupName: 'Friday Dinners 🍕',
    userOwes: false,
    amount: 34.00,
    otherMember: 'Alex Chen',
  },
];

interface BudgetScreenProps {
  onOpenSettings?: () => void;
  onCreateGroup?: () => void;
  onSettleDebt?: (debt: GroupDebtItem) => void;
  netBalance?: number;
  totalOwed?: number;
  totalOwing?: number;
  groupDebts?: GroupDebtItem[];
}

export function BudgetScreen({
  onOpenSettings,
  onCreateGroup,
  onSettleDebt,
  netBalance = 1274.87,
  totalOwed = 326.00,
  totalOwing = 188.00,
  groupDebts = DEFAULT_DEBTS,
}: BudgetScreenProps) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 24);
  const [showInsightBanner, setShowInsightBanner] = useState(true);

  const intPart = Math.floor(netBalance);
  const decPart = (netBalance % 1).toFixed(2).substring(1);

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
            <Text style={styles.headerTitle}>GROUP BALANCES</Text>
            <Pressable
              hitSlop={14}
              style={styles.settingsButton}
              onPress={onOpenSettings}>
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Date Subtitle */}
          <Text style={styles.dateSubtitle}>Active Billing Cycle • March 2026</Text>

          {/* Date Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View style={styles.progressBarFill} />
          </View>

          {/* Days Left Label */}
          <Text style={styles.daysLeftText}>11 days until settlement</Text>

          {/* Coin Stacks & Side Navigation Arrows */}
          <View style={styles.coinsWrapper}>
            <Pressable style={styles.leftCarouselButton}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>

            <Pressable style={styles.rightCarouselButton}>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </Pressable>

            <CoinStackIllustration inAmount={totalOwed} outAmount={totalOwing} />
          </View>
        </View>

        {/* White Bottom Card Container */}
        <View style={styles.bottomCard}>
          {/* Mascot Hand */}
          <ThumbsUpHand />

          {/* Stats Split Row */}
          <View style={styles.statsRow}>
            {/* Left Metric: Net Group Balance */}
            <View style={styles.statColumn}>
              <View style={styles.amountRow}>
                <Text style={styles.currencySymbol}>₹</Text>
                <Text style={styles.statInteger}>{intPart.toLocaleString()}</Text>
                <Text style={styles.statDecimal}>{decPart}</Text>
              </View>
              <View style={styles.statSubRow}>
                <Text style={styles.statSubTextMuted}>net </Text>
                <Text style={styles.statSubTextBlue}>settlement</Text>
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

            {/* Right Metric: Daily Allowance */}
            <View style={styles.statColumn}>
              <View style={styles.amountRow}>
                <Text style={styles.currencySymbol}>₹</Text>
                <Text style={styles.statInteger}>115</Text>
                <Text style={styles.statDecimal}>.90</Text>
              </View>
              <Text style={styles.statSubTextMuted}>daily allowance</Text>
            </View>
          </View>

          {/* Mascot Insight Banner */}
          {showInsightBanner && (
            <View style={styles.insightBanner}>
              <SettlrMouth />
              <Text style={styles.insightText}>
                3 friends owe you ₹326. Want me to send friendly nudges? 💬
              </Text>
              <Pressable
                hitSlop={8}
                style={styles.closeBannerButton}
                onPress={() => setShowInsightBanner(false)}>
                <Ionicons name="close" size={16} color="#667085" />
              </Pressable>
            </View>
          )}

          {/* Group Debts / Outstanding Splits Section */}
          <View style={styles.billsDueSection}>
            <View style={styles.billsDueHeader}>
              <Text style={styles.billsDueTitle}>OUTSTANDING SETTLEMENTS</Text>
              <Pressable onPress={onCreateGroup} hitSlop={10}>
                <Feather name="plus-circle" size={22} color="#2738F5" />
              </Pressable>
            </View>

            <View style={styles.debtsList}>
              {groupDebts.map((item) => (
                <View key={item.id} style={styles.debtItemRow}>
                  <View style={styles.debtLeft}>
                    <View style={[styles.debtBadge, item.userOwes ? styles.debtBadgeOwe : styles.debtBadgeOwed]}>
                      <Text style={styles.debtBadgeText}>{item.userOwes ? 'You Owe' : 'Owed'}</Text>
                    </View>
                    <View style={styles.debtTextGroup}>
                      <Text style={styles.debtGroupName}>{item.groupName}</Text>
                      <Text style={styles.debtMember}>{item.otherMember}</Text>
                    </View>
                  </View>

                  <View style={styles.debtRight}>
                    <Text style={[styles.debtAmount, item.userOwes ? styles.debtOweAmount : styles.debtOwedAmount]}>
                      ₹{item.amount.toFixed(2)}
                    </Text>
                    <Pressable
                      onPress={() => onSettleDebt?.(item)}
                      style={styles.settleButton}>
                      <Text style={styles.settleButtonText}>Settle</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
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
    width: '58%',
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
  coinsWrapper: {
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
  billsDueSection: {
    marginTop: 26,
    paddingBottom: 10,
  },
  billsDueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 14,
  },
  billsDueTitle: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  debtsList: {
    gap: 12,
  },
  debtItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  debtLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  debtBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  debtBadgeOwe: {
    backgroundColor: '#FEE2E2',
  },
  debtBadgeOwed: {
    backgroundColor: '#DCFCE7',
  },
  debtBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  debtTextGroup: {
    flex: 1,
  },
  debtGroupName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  debtMember: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 1,
  },
  debtRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  debtAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  debtOweAmount: {
    color: '#DC2626',
  },
  debtOwedAmount: {
    color: '#059669',
  },
  settleButton: {
    backgroundColor: '#2738F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  settleButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
