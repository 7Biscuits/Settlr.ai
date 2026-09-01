import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';

import { SettlrMouth } from '../illustrations/SettlrMouth';
import { ThumbsUpHand } from '../illustrations/ThumbsUpHand';
import {
  BankBuildingIcon,
  MoneyBagIcon,
  SkullSparkleIcon,
} from '../illustrations/TransactionIcons';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  backendOnline?: boolean;
}

export function SettingsModal({
  visible,
  onClose,
  onLogout,
  userName = 'ALEX JOHNSON',
  userEmail = 'alex.johnson@settlr.ai',
  userPhone,
  backendOnline = true,
}: SettingsModalProps) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 24);

  // Settings State
  const [roastMode, setRoastMode] = useState<'savage' | 'gentle' | 'off'>('savage');
  const [biometrics, setBiometrics] = useState(true);
  const [dailyBriefing, setDailyBriefing] = useState(true);
  const [lowBalanceAlert, setLowBalanceAlert] = useState(true);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name[0] || 'U').toUpperCase();
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Log Out of Settlr?',
      'Are you sure you want to log out? Your group balances and roast streaks will miss you 🥺',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            onClose();
            onLogout();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={styles.safeArea}>
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {/* Top Royal Blue Header Section */}
          <View style={[styles.topSection, { paddingTop: topInset + 4 }]}>
            {/* Header Navigation Row */}
            <View style={styles.headerRow}>
              <View style={styles.headerSpacer} />
              <Text style={styles.headerTitle}>PROFILE & SETTINGS</Text>
              <Pressable
                hitSlop={14}
                style={styles.closeButton}
                onPress={onClose}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* Profile Avatar & Info */}
            <View style={styles.profileSummaryContainer}>
              <View style={styles.avatarGlowWrapper}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitials}>{getInitials(userName)}</Text>
                </View>
                <View style={styles.avatarStarBadge}>
                  <Ionicons name="sparkles" size={13} color="#FFFFFF" />
                </View>
              </View>

              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.profileEmail}>{userEmail}</Text>
              {userPhone ? <Text style={styles.profilePhone}>{userPhone}</Text> : null}

              {/* Settlr VIP Badge */}
              <View style={styles.plusPillBadge}>
                <Text style={styles.plusBadgeText}>⭐ SETTLR PLUS VIP</Text>
              </View>
            </View>
          </View>

          {/* White Bottom Card Container */}
          <View style={styles.bottomCard}>
            <ThumbsUpHand />

            {/* Split Metrics Row: Advance & Score */}
            <View style={styles.statsRow}>
              {/* Left Metric: Advance Limit */}
              <View style={styles.statColumn}>
                <View style={styles.amountRow}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <Text style={styles.statInteger}>250</Text>
                  <Text style={styles.statDecimal}>.00</Text>
                </View>
                <View style={styles.statSubRow}>
                  <Text style={styles.statSubTextMuted}>instant </Text>
                  <Text style={styles.statSubTextBlue}>limit</Text>
                </View>
              </View>

              {/* Vertical Divider */}
              <View style={styles.verticalDivider} />

              {/* Right Metric: Settlr Trust Score */}
              <View style={styles.statColumn}>
                <View style={styles.amountRow}>
                  <Text style={styles.statInteger}>740</Text>
                </View>
                <View style={styles.statSubRow}>
                  <Text style={styles.statSubTextMuted}>trust score </Text>
                  <Text style={styles.statSubTextGreen}>+28 pts</Text>
                </View>
              </View>
            </View>

            {/* Mascot Insight Banner */}
            <View style={styles.insightBanner}>
              <SettlrMouth />
              <Text style={styles.insightText}>
                {roastMode === 'savage'
                  ? 'Roast mode is Savage. Your $32 late-night snack splits are NOT safe 🔥'
                  : roastMode === 'gentle'
                  ? 'Gentle mode active. We will gently remind friends who owe you 🌸'
                  : 'Neutral mode active. Just the cold hard facts 🤖'}
              </Text>
            </View>

            {/* 1. Assistant Roast Mode Selector */}
            <View style={styles.sectionWrapper}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>SETTLR AI PERSONA</Text>
              </View>

              <View style={styles.roastPillsRow}>
                <Pressable
                  onPress={() => setRoastMode('savage')}
                  style={[
                    styles.roastPill,
                    roastMode === 'savage' && styles.roastPillActive,
                  ]}>
                  <Text
                    style={[
                      styles.roastPillText,
                      roastMode === 'savage' && styles.roastPillTextActive,
                    ]}>
                    SAVAGE 🔥
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setRoastMode('gentle')}
                  style={[
                    styles.roastPill,
                    roastMode === 'gentle' && styles.roastPillActive,
                  ]}>
                  <Text
                    style={[
                      styles.roastPillText,
                      roastMode === 'gentle' && styles.roastPillTextActive,
                    ]}>
                    GENTLE 🌸
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setRoastMode('off')}
                  style={[
                    styles.roastPill,
                    roastMode === 'off' && styles.roastPillActive,
                  ]}>
                  <Text
                    style={[
                      styles.roastPillText,
                      roastMode === 'off' && styles.roastPillTextActive,
                    ]}>
                    OFF 🤖
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* 2. Connected Wallets & Groups */}
            <View style={styles.sectionWrapper}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>CONNECTED WALLETS</Text>
                <Feather name="arrow-right" size={24} color="#000000" />
              </View>

              <View style={styles.accountsList}>
                <View style={styles.accountRow}>
                  <View style={styles.accountIconBox}>
                    <BankBuildingIcon />
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>Settlr Primary Wallet</Text>
                    <Text style={styles.accountSubtitle}>Zero-fee Instant P2P</Text>
                  </View>
                  <View style={styles.balanceContainer}>
                    <Text style={styles.accountBalance}>$1,274.87</Text>
                    <Text style={styles.statusConnected}>● Active</Text>
                  </View>
                </View>

                <View style={styles.accountRow}>
                  <View style={styles.accountIconBox}>
                    <SkullSparkleIcon />
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>Settlr Group Vault</Text>
                    <Text style={styles.accountSubtitle}>Shared Emergency Fund</Text>
                  </View>
                  <View style={styles.balanceContainer}>
                    <Text style={styles.accountBalance}>$850.00</Text>
                    <Text style={styles.statusActive}>Locked 🔒</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 3. Security & Toggles */}
            <View style={styles.sectionWrapper}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>SECURITY & PREFERENCES</Text>
              </View>

              <View style={styles.toggleCard}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextGroup}>
                    <Text style={styles.toggleTitle}>Face ID / Biometrics</Text>
                    <Text style={styles.toggleDesc}>
                      Protect wallet transactions with biometrics
                    </Text>
                  </View>
                  <Switch
                    value={biometrics}
                    onValueChange={setBiometrics}
                    trackColor={{ false: '#E2E8F0', true: '#00F58D' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.toggleDivider} />

                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextGroup}>
                    <Text style={styles.toggleTitle}>Daily Settlement Nudges</Text>
                    <Text style={styles.toggleDesc}>
                      Automated morning summary of owed balances
                    </Text>
                  </View>
                  <Switch
                    value={dailyBriefing}
                    onValueChange={setDailyBriefing}
                    trackColor={{ false: '#E2E8F0', true: '#00F58D' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.toggleDivider} />

                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextGroup}>
                    <Text style={styles.toggleTitle}>Low Balance Warning</Text>
                    <Text style={styles.toggleDesc}>
                      Alert when wallet balance is under $50
                    </Text>
                  </View>
                  <Switch
                    value={lowBalanceAlert}
                    onValueChange={setLowBalanceAlert}
                    trackColor={{ false: '#E2E8F0', true: '#00F58D' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            </View>

            {/* 4. Backend Health Status */}
            <View style={styles.sectionWrapper}>
              <View style={styles.healthRow}>
                <View style={styles.healthLeft}>
                  <View style={[styles.healthDot, backendOnline ? styles.healthOnline : styles.healthOffline]} />
                  <Text style={styles.healthTitle}>
                    {backendOnline ? 'Backend Server Connected' : 'Connecting to Server...'}
                  </Text>
                </View>
                <Text style={styles.healthStatus}>
                  {backendOnline ? 'Online ⚡' : 'Offline'}
                </Text>
              </View>
            </View>

            {/* 5. Support & Legal */}
            <View style={styles.sectionWrapper}>
              <Pressable style={styles.legalNavRow}>
                <View style={styles.legalLeft}>
                  <Ionicons name="chatbubbles-outline" size={22} color="#0F172A" />
                  <Text style={styles.legalTitle}>Talk to Settlr AI Support</Text>
                </View>
                <Feather name="arrow-right" size={20} color="#000000" />
              </Pressable>

              <Pressable style={styles.legalNavRow}>
                <View style={styles.legalLeft}>
                  <Ionicons name="shield-checkmark-outline" size={22} color="#0F172A" />
                  <Text style={styles.legalTitle}>Privacy & Data Protection</Text>
                </View>
                <Feather name="arrow-right" size={20} color="#000000" />
              </Pressable>
            </View>

            {/* 6. Log Out Button */}
            <Pressable
              onPress={handleLogoutPress}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.logoutButtonText}>Log out of Settlr 🥺</Text>
            </Pressable>

            <Text style={styles.versionFooter}>
              Settlr.ai Mobile • Build 1.0.0 • Verified
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
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
    paddingBottom: 24,
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
    width: 32,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSummaryContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  avatarGlowWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2738F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#00F58D',
    shadowColor: '#00F58D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },
  avatarStarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#00F58D',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#151C8A',
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  profileEmail: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  profilePhone: {
    color: '#93C5FD',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  plusPillBadge: {
    backgroundColor: '#00F58D',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 8,
  },
  plusBadgeText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
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
    minHeight: 400,
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
  statSubTextGreen: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
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
    marginTop: 20,
    marginBottom: 10,
  },
  insightText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
    lineHeight: 19,
  },
  sectionWrapper: {
    marginTop: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  roastPillsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roastPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  roastPillActive: {
    backgroundColor: '#2738F5',
    borderColor: '#2738F5',
    shadowColor: '#2738F5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  roastPillText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 0.3,
  },
  roastPillTextActive: {
    color: '#FFFFFF',
  },
  accountsList: {
    gap: 14,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  accountIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  accountSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 2,
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusConnected: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  statusActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
    marginTop: 2,
  },
  toggleCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleTextGroup: {
    flex: 1,
    paddingRight: 14,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  toggleDesc: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  toggleDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  healthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthOnline: {
    backgroundColor: '#10B981',
  },
  healthOffline: {
    backgroundColor: '#EF4444',
  },
  healthTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  healthStatus: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '700',
  },
  legalNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  legalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legalTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#161A36',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
    marginBottom: 12,
  },
  logoutButtonText: {
    color: '#161A36',
    fontSize: 16,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  versionFooter: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 4,
  },
});
