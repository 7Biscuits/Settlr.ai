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

import { SettlrPlanetCardCarousel } from './illustrations/SettlrPlanetCard';
import {
  BankBuildingIcon,
  MoneyBagIcon,
  SkullSparkleIcon,
} from './illustrations/TransactionIcons';
import { formatAmount } from '../../lib/money';
import type { ActivityItem } from '../../api/types';

interface SpendScreenProps {
  onOpenSettings?: () => void;
  onOpenTopUp?: () => void;
  onOpenScan?: () => void;
  onOpenAssistant?: () => void;
  balance?: number;
  totalOwed?: number;
  totalOwing?: number;
  recentActivity?: ActivityItem[];
}

export function SpendScreen({
  onOpenSettings,
  onOpenTopUp,
  onOpenScan: _onOpenScan,
  onOpenAssistant: _onOpenAssistant,
  balance = 0,
  totalOwed = 0,
  totalOwing = 0,
  recentActivity = [],
}: SpendScreenProps) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 24);
  const [expanded, setExpanded] = useState(false);

  // Normalize balance to major units for planet card (if in minor units / paise)
  const majorBalance = balance > 10000 ? balance / 100 : balance;

  const displayedActivities = expanded
    ? recentActivity
    : recentActivity.slice(0, 3);

  return (
    <View style={styles.safeArea}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Top Section with Cards */}
        <View style={[styles.topSection, { paddingTop: topInset + 8 }]}>
          <SettlrPlanetCardCarousel
            balance={majorBalance}
            onTopUp={onOpenTopUp}
            onConnect={onOpenSettings}
          />

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            {/* Top Up */}
            <View style={styles.actionButtonContainer}>
              <Pressable
                onPress={onOpenTopUp}
                style={styles.actionCircleButton}>
                <Feather name="plus" size={26} color="#0F172A" />
              </Pressable>
              <Text style={styles.actionLabel}>Add{'\n'}funds</Text>
            </View>

            {/* Manage Accounts / Settings */}
            <View style={styles.actionButtonContainer}>
              <Pressable
                onPress={onOpenSettings}
                style={styles.actionCircleButton}>
                <Ionicons name="settings-outline" size={24} color="#0F172A" />
              </Pressable>
              <Text style={styles.actionLabel}>Profile &{'\n'}settings</Text>
            </View>
          </View>
        </View>

        {/* Quick Debt Snapshot Row */}
        <View style={styles.snapshotRow}>
          <View style={styles.snapshotCard}>
            <Text style={styles.snapshotLabel}>You are owed</Text>
            <Text style={styles.snapshotOwed}>{formatAmount(totalOwed)}</Text>
          </View>
          <View style={styles.snapshotCard}>
            <Text style={styles.snapshotLabel}>You owe</Text>
            <Text style={styles.snapshotOwing}>{formatAmount(totalOwing)}</Text>
          </View>
        </View>

        {/* RECENT TRANSACTIONS Card */}
        <View style={styles.transactionsCard}>
          {/* Header Row */}
          <View style={styles.transactionsHeader}>
            <Text style={styles.transactionsTitle}>RECENT SETTLR ACTIVITY</Text>
            {recentActivity.length > 3 && (
              <Pressable
                onPress={() => setExpanded((prev) => !prev)}
                style={styles.editButton}>
                <Feather
                  name={expanded ? "minimize-2" : "maximize-2"}
                  size={17}
                  color="#0F172A"
                />
              </Pressable>
            )}
          </View>

          {/* Transaction List */}
          {recentActivity.length === 0 ? (
            <View style={styles.emptyActivityBox}>
              <Text style={styles.emptyActivityTitle}>No recent activity yet</Text>
              <Text style={styles.emptyActivitySub}>
                Add funds, transfer to friends, or split an expense to see activity here.
              </Text>
            </View>
          ) : (
            <View style={styles.transactionList}>
              {displayedActivities.map((item) => {
                const isPositive = item.amount > 0;
                return (
                  <View key={item.id} style={styles.transactionRow}>
                    {/* Left Icon & Name */}
                    <View style={styles.transactionLeft}>
                      {item.type.toLowerCase().includes('top') ? (
                        <BankBuildingIcon />
                      ) : item.type.toLowerCase().includes('settl') ? (
                        <SkullSparkleIcon />
                      ) : (
                        <MoneyBagIcon />
                      )}
                      <Text style={styles.transactionName} numberOfLines={1}>
                        {item.type}
                      </Text>
                    </View>

                    {/* Right Amount */}
                    <View style={styles.amountContainer}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          isPositive ? styles.positiveAmount : styles.neutralAmount,
                        ]}>
                        {formatAmount(Math.abs(item.amount))}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* View More Link */}
          {recentActivity.length > 3 && (
            <Pressable
              onPress={() => setExpanded((prev) => !prev)}
              style={styles.viewMoreButton}>
              <Text style={styles.viewMoreText}>
                {expanded ? 'Show less' : 'View more activity'}
              </Text>
            </Pressable>
          )}
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
    backgroundColor: '#F3F6FB',
  },
  topSection: {
    backgroundColor: '#F3F6FB',
    paddingBottom: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    gap: 48,
  },
  actionButtonContainer: {
    alignItems: 'center',
  },
  actionCircleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  actionLabel: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  snapshotRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  snapshotCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  snapshotLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  snapshotOwed: {
    fontSize: 22,
    fontWeight: '900',
    color: '#059669',
    marginTop: 4,
  },
  snapshotOwing: {
    fontSize: 22,
    fontWeight: '900',
    color: '#DC2626',
    marginTop: 4,
  },
  transactionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  transactionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  transactionsTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionList: {
    gap: 16,
  },
  emptyActivityBox: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  emptyActivityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyActivitySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  transactionName: {
    color: '#0F172A',
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
  amountContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  transactionAmount: {
    fontSize: 16.5,
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
    fontSize: 15,
    fontWeight: '700',
  },
});
