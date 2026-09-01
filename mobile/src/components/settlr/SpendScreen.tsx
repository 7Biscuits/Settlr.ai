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

interface TransactionItem {
  id: string;
  title: string;
  amount: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

const DEFAULT_TRANSACTIONS: TransactionItem[] = [
  {
    id: '1',
    title: 'Group Dinner Split • Goa Trip',
    amount: '+$40.33',
    isPositive: true,
    icon: <MoneyBagIcon />,
  },
  {
    id: '2',
    title: 'Wallet Top Up • Instant Bank',
    amount: '+$150.00',
    isPositive: true,
    icon: <BankBuildingIcon />,
  },
  {
    id: '3',
    title: 'Settle Debt to Rahul',
    amount: '$169.50',
    isPositive: false,
    icon: <SkullSparkleIcon />,
  },
  {
    id: '4',
    title: 'Whole Foods Split • Flatmates',
    amount: '$64.20',
    isPositive: false,
    icon: <MoneyBagIcon />,
  },
  {
    id: '5',
    title: 'Netflix Subscription Split',
    amount: '$15.99',
    isPositive: false,
    icon: <SkullSparkleIcon />,
  },
  {
    id: '6',
    title: 'Uber Ride Split • Airport',
    amount: '+$24.50',
    isPositive: true,
    icon: <BankBuildingIcon />,
  },
];

interface SpendScreenProps {
  onOpenSettings?: () => void;
  onOpenTopUp?: () => void;
  balance?: number;
  transactions?: TransactionItem[];
}

export function SpendScreen({
  onOpenSettings,
  onOpenTopUp,
  balance = 1274.87,
  transactions = DEFAULT_TRANSACTIONS,
}: SpendScreenProps) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 24);
  const [expanded, setExpanded] = useState(false);

  const displayedTransactions = expanded
    ? transactions
    : transactions.slice(0, 3);

  return (
    <View style={styles.safeArea}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Top Section with Cards */}
        <View style={[styles.topSection, { paddingTop: topInset + 8 }]}>
          <SettlrPlanetCardCarousel
            balance={balance}
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
              <Text style={styles.actionLabel}>Manage{'\n'}wallets</Text>
            </View>
          </View>
        </View>

        {/* RECENT TRANSACTIONS Card */}
        <View style={styles.transactionsCard}>
          {/* Header Row */}
          <View style={styles.transactionsHeader}>
            <Text style={styles.transactionsTitle}>RECENT ACTIVITY</Text>
            <Pressable
              onPress={() => setExpanded((prev) => !prev)}
              style={styles.editButton}>
              <Feather name={expanded ? "minimize-2" : "edit-2"} size={17} color="#0F172A" />
            </Pressable>
          </View>

          {/* Transaction List */}
          <View style={styles.transactionList}>
            {displayedTransactions.map((item) => (
              <View key={item.id} style={styles.transactionRow}>
                {/* Left Icon & Name */}
                <View style={styles.transactionLeft}>
                  {item.icon}
                  <Text style={styles.transactionName} numberOfLines={1}>
                    {item.title}
                  </Text>
                </View>

                {/* Right Amount */}
                <View style={styles.amountContainer}>
                  <Text
                    style={[
                      styles.transactionAmount,
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
    backgroundColor: '#F3F6FB',
  },
  topSection: {
    backgroundColor: '#F3F6FB',
    paddingBottom: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
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
  transactionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 24,
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
    fontSize: 19,
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
    gap: 18,
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
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
  amountContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  transactionAmount: {
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
    marginTop: 22,
    paddingVertical: 6,
  },
  viewMoreText: {
    color: '#1E293B',
    fontSize: 15.5,
    fontWeight: '700',
  },
});
