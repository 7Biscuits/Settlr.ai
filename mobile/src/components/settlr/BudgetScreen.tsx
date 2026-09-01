import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

import { SettlrMouth } from './illustrations/SettlrMouth';
import { CoinStackIllustration } from './illustrations/CoinStackIllustration';
import { ThumbsUpHand } from './illustrations/ThumbsUpHand';
import type { Group } from '../../api/types';
import { createGroup } from '../../api/groups';

interface BudgetScreenProps {
  onOpenSettings?: () => void;
  onSelectGroup?: (groupId: string) => void;
  netBalance?: number;
  totalOwed?: number;
  totalOwing?: number;
  groups?: Group[];
  onRefreshGroups?: () => Promise<void> | void;
}

export function BudgetScreen({
  onOpenSettings,
  onSelectGroup,
  netBalance = 0,
  totalOwed = 0,
  totalOwing = 0,
  groups = [],
  onRefreshGroups,
}: BudgetScreenProps) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 24);
  const [showInsightBanner, setShowInsightBanner] = useState(true);

  // Quick Group Creation State
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const isNetNegative = netBalance < 0;
  const absNet = Math.abs(netBalance);
  const intPart = Math.floor(absNet);
  const decPart = (absNet % 1).toFixed(2).substring(1);

  let insightMessage = '';
  if (totalOwed > 0) {
    insightMessage = `You have ₹${totalOwed.toFixed(2)} receivable across your split groups. Want me to send friendly nudges? 💬`;
  } else if (totalOwing > 0) {
    insightMessage = `You have ₹${totalOwing.toFixed(2)} in shared group expenses to settle up! ⚡`;
  } else {
    insightMessage = `All group balances are settled! You're completely up to date. 🎉`;
  }

  const handleCreateGroup = async () => {
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    setCreating(true);
    setCreateError(null);
    try {
      await createGroup(trimmed);
      setNewGroupName('');
      await onRefreshGroups?.();
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

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
          <Text style={styles.dateSubtitle}>Active Billing Cycle • Settlr</Text>

          {/* Date Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View style={styles.progressBarFill} />
          </View>

          {/* Days Left Label */}
          <Text style={styles.daysLeftText}>Live Balances Synced</Text>

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
                <Text style={styles.currencySymbol}>{isNetNegative ? '-₹' : '₹'}</Text>
                <Text style={styles.statInteger}>{intPart.toLocaleString()}</Text>
                <Text style={styles.statDecimal}>{decPart}</Text>
              </View>
              <View style={styles.statSubRow}>
                <Text style={styles.statSubTextMuted}>net </Text>
                <Text style={styles.statSubTextBlue}>balance</Text>
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

            {/* Right Metric: Active Settlements */}
            <View style={styles.statColumn}>
              <View style={styles.amountRow}>
                <Text style={styles.currencySymbol}>₹</Text>
                <Text style={styles.statInteger}>{totalOwed.toFixed(0)}</Text>
                <Text style={styles.statDecimal}>
                  {(totalOwed % 1).toFixed(2).substring(1)}
                </Text>
              </View>
              <Text style={styles.statSubTextMuted}>receivable total</Text>
            </View>
          </View>

          {/* Mascot Insight Banner */}
          {showInsightBanner && (
            <View style={styles.insightBanner}>
              <SettlrMouth />
              <Text style={styles.insightText}>{insightMessage}</Text>
              <Pressable
                hitSlop={8}
                style={styles.closeBannerButton}
                onPress={() => setShowInsightBanner(false)}>
                <Ionicons name="close" size={16} color="#667085" />
              </Pressable>
            </View>
          )}

          {/* SETTLR GROUPS Section (Directly displays create form and active groups) */}
          <View style={styles.groupsSection}>
            <View style={styles.groupsSectionHeader}>
              <Text style={styles.groupsSectionTitle}>SETTLR GROUPS</Text>
            </View>

            {/* Inline Group Creation Form (Previously after plus icon) */}
            <View style={styles.createCard}>
              <Text style={styles.createTitle}>CREATE NEW GROUP</Text>
              <View style={styles.createInputRow}>
                <TextInput
                  value={newGroupName}
                  onChangeText={(t) => {
                    setNewGroupName(t);
                    if (createError) setCreateError(null);
                  }}
                  placeholder="e.g. Goa Trip 🏖️ or Flat 302 🏠"
                  placeholderTextColor="#94A3B8"
                  style={styles.createTextInput}
                />
                <Pressable
                  onPress={handleCreateGroup}
                  disabled={creating || !newGroupName.trim()}
                  style={[
                    styles.createButton,
                    (!newGroupName.trim() || creating) && styles.createButtonDisabled,
                  ]}>
                  {creating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.createButtonText}>Create 👉</Text>
                  )}
                </Pressable>
              </View>
              {createError ? <Text style={styles.errorText}>{createError}</Text> : null}
            </View>

            {/* Active Groups List */}
            {groups.length === 0 ? (
              <View style={styles.emptyGroupsBox}>
                <Text style={styles.emptyGroupsTitle}>No groups yet 🏝️</Text>
                <Text style={styles.emptyGroupsSub}>
                  Enter a group name above to start splitting bills and settling debts with friends!
                </Text>
              </View>
            ) : (
              <View style={styles.groupsList}>
                {groups.map((group) => (
                  <Pressable
                    key={group.id}
                    onPress={() => onSelectGroup?.(group.id)}
                    style={styles.groupCard}>
                    <View style={styles.groupLeft}>
                      <View style={styles.groupAvatar}>
                        <Text style={styles.groupInitial}>
                          {(group.name[0] || 'G').toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.groupInfo}>
                        <Text style={styles.groupName}>{group.name}</Text>
                        <Text style={styles.groupSub}>Tap to view balances & splits</Text>
                      </View>
                    </View>
                    <Feather name="chevron-right" size={20} color="#94A3B8" />
                  </Pressable>
                ))}
              </View>
            )}
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
    width: '75%',
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
    paddingBottom: 28,
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
  groupsSection: {
    marginTop: 26,
    paddingBottom: 10,
  },
  groupsSectionHeader: {
    paddingVertical: 4,
    marginBottom: 14,
  },
  groupsSectionTitle: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  createCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    marginBottom: 18,
    gap: 10,
  },
  createTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  createInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  createTextInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#2738F5',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12.5,
    fontWeight: '600',
  },
  emptyGroupsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyGroupsTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyGroupsSub: {
    fontSize: 13.5,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 19,
  },
  groupsList: {
    gap: 12,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 14,
  },
  groupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  groupAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2738F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  groupSub: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
});
