import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
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

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  isCard?: boolean;
}

interface ChatScreenProps {
  onOpenSettings?: () => void;
  onVoiceRecord?: () => void;
  isRecording?: boolean;
}

export function ChatScreen({ onOpenSettings, onVoiceRecord, isRecording = false }: ChatScreenProps) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 24);

  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    const query = inputText.trim().toLowerCase();
    setInputText('');

    // Simulate smart agent response
    setTimeout(() => {
      let reply = "I've analyzed your balances across all active groups. You're net positive by $326.00! Rahul owes you $145.50 from Goa Trip.";
      if (query.includes('category') || query.includes('spend')) {
        reply = "Here's your top spending categories this month: 🍔 Food & Dining ($170), 🚗 Transport ($64.20), 🎬 Entertainment ($15.99).";
      } else if (query.includes('settle') || query.includes('pay')) {
        reply = "You can settle $68.20 directly to Priya in 'Apartment 402' via 1-tap transfer with 0 fees!";
      }
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: reply,
        },
      ]);
    }, 600);
  };

  const handleQuickReply = (replyText: string) => {
    setInputText(replyText);
  };

  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        {/* Background Watermark "SETTLR AI" */}
        <View style={styles.watermarkContainer} pointerEvents="none">
          <Text style={styles.watermarkText}>SETTLR{'\n'}AI</Text>
        </View>

        {/* Top Header Row */}
        <View style={[styles.headerRow, { paddingTop: topInset + 4 }]}>
          <View style={styles.headerSpacer} />
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setShowNotificationPopup((prev) => !prev)}
              style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color="#0F172A" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>!</Text>
              </View>
            </Pressable>

            <Pressable onPress={onOpenSettings} style={styles.iconButton}>
              <Ionicons name="person-circle-outline" size={32} color="#0F172A" />
            </Pressable>
          </View>
        </View>

        {/* Notification Dropdown */}
        {showNotificationPopup && (
          <View style={styles.notificationBanner}>
            <Text style={styles.notifTitle}>⚡ Settlr Alert</Text>
            <Text style={styles.notifDesc}>
              Rahul settled \$45.00 for the Goa Trip. Your new balance is \$1,274.87.
            </Text>
            <Pressable
              onPress={() => setShowNotificationPopup(false)}
              style={styles.dismissNotif}>
              <Text style={styles.dismissNotifText}>Dismiss</Text>
            </Pressable>
          </View>
        )}

        {/* Chat Scrollable Message Stream */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatScrollContent}>
          {/* Message 1: Overview */}
          <View style={styles.cleoMessageContainer}>
            <View style={styles.overviewCard}>
              <Text style={styles.messageHeading}>
                Here's your active expense snapshot for March 2026:
              </Text>
              <View style={styles.overviewStats}>
                <Text style={styles.statLine}>+ $326 Owed to You 💰</Text>
                <Text style={styles.statLine}>- $188 You Owe 💸</Text>
                <Text style={styles.statLine}>= $138 Net Receivable 📈</Text>
              </View>
            </View>

            <View style={styles.cleoPillBadge}>
              <Text style={styles.cleoPillText}>SETTLR</Text>
            </View>
          </View>

          {/* User Message Sample */}
          <View style={styles.userMessageBubble}>
            <Text style={styles.userMessageText}>by categories 📦</Text>
          </View>

          {/* Message 2: Category Breakdown Card */}
          <View style={styles.categoryCard}>
            <View style={styles.categoryCardBody}>
              <Text style={styles.messageHeading}>
                Group spending by category in March:
              </Text>

              <View style={styles.breakdownList}>
                <Text style={styles.breakdownItem}>$170 on Dinners & Bars 🍕</Text>
                <Text style={styles.breakdownItem}>$64.20 on Groceries 🛒</Text>
                <Text style={styles.breakdownItem}>$15.99 on Subscriptions 🍿</Text>
              </View>

              <Text style={styles.totalAmount}>$250.19 Total Split</Text>
            </View>

            <Pressable
              onPress={() => handleQuickReply('Show full spending category details')}
              style={styles.seeMoreButton}>
              <Text style={styles.seeMoreText}>See more details</Text>
            </Pressable>
          </View>

          {/* Render User Sent Messages */}
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={
                msg.sender === 'user'
                  ? styles.userMessageBubble
                  : styles.cleoMessageContainer
              }>
              {msg.sender === 'user' ? (
                <Text style={styles.userMessageText}>{msg.text}</Text>
              ) : (
                <View style={styles.overviewCard}>
                  <Text style={styles.messageHeading}>{msg.text}</Text>
                </View>
              )}
            </View>
          ))}

          {/* Suggested Quick Replies */}
          <View style={styles.quickRepliesContainer}>
            <Pressable
              onPress={() => handleQuickReply('who owes me money? 🧠')}
              style={styles.quickReplyPill}>
              <Text style={styles.quickReplyText}>who owes me? 🧠</Text>
            </Pressable>

            <Pressable
              onPress={() => handleQuickReply('settle all balances 💸')}
              style={styles.quickReplyPill}>
              <Text style={styles.quickReplyText}>settle balances 💸</Text>
            </Pressable>

            <Pressable
              onPress={() => handleQuickReply('split a new bill 👉')}
              style={styles.quickReplyPill}>
              <Text style={styles.quickReplyText}>split a bill 👉</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Floating Chat Input & Mic Bar */}
        <View style={styles.inputBarWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              placeholder="Ask Settlr AI..."
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
            />
            {inputText.length > 0 ? (
              <Pressable onPress={handleSend} style={styles.sendIconWrapper}>
                <Ionicons name="arrow-up-circle" size={32} color="#2738F5" />
              </Pressable>
            ) : (
              <Pressable onPress={onVoiceRecord} style={styles.sendIconWrapper}>
                <Ionicons
                  name={isRecording ? "mic" : "mic-outline"}
                  size={24}
                  color={isRecording ? "#EF4444" : "#2738F5"}
                />
              </Pressable>
            )}
          </View>

          <Pressable onPress={onVoiceRecord} style={styles.homeActionButton}>
            <Ionicons
              name={isRecording ? "radio" : "sparkles"}
              size={22}
              color={isRecording ? "#EF4444" : "#2738F5"}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EDF4FF',
  },
  keyboardView: {
    flex: 1,
    backgroundColor: '#EDF4FF',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  watermarkText: {
    fontSize: 72,
    fontWeight: '900',
    color: '#DCEBFC',
    textAlign: 'center',
    letterSpacing: 4,
    lineHeight: 82,
    opacity: 0.7,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 4,
    zIndex: 10,
  },
  headerSpacer: {
    width: 32,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    position: 'relative',
    padding: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EDF4FF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  notificationBanner: {
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 20,
  },
  notifTitle: {
    color: '#00F58D',
    fontSize: 14,
    fontWeight: '800',
  },
  notifDesc: {
    color: '#F8FAFC',
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  dismissNotif: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  dismissNotifText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '700',
  },
  chatScrollContent: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 16,
    zIndex: 5,
  },
  cleoMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    maxWidth: '82%',
    position: 'relative',
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    flex: 1,
  },
  messageHeading: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  overviewStats: {
    marginTop: 10,
    gap: 4,
  },
  statLine: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  cleoPillBadge: {
    position: 'absolute',
    right: -36,
    top: 36,
    backgroundColor: '#2738F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: '#2738F5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cleoPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  userMessageBubble: {
    backgroundColor: '#2738F5',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignSelf: 'flex-end',
    marginBottom: 16,
    shadowColor: '#2738F5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  userMessageText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    maxWidth: '82%',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  categoryCardBody: {
    padding: 16,
  },
  breakdownList: {
    marginTop: 14,
    gap: 6,
  },
  breakdownItem: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  totalAmount: {
    color: '#0F172A',
    fontSize: 15.5,
    fontWeight: '800',
    marginTop: 16,
    letterSpacing: -0.2,
  },
  seeMoreButton: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeMoreText: {
    color: '#2738F5',
    fontSize: 15,
    fontWeight: '700',
  },
  quickRepliesContainer: {
    alignItems: 'flex-end',
    marginTop: 6,
    gap: 10,
    marginBottom: 12,
  },
  quickReplyPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#2738F5',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 9,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  quickReplyText: {
    color: '#2738F5',
    fontSize: 14.5,
    fontWeight: '600',
  },
  inputBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: 'transparent',
  },
  inputContainer: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    height: '100%',
  },
  sendIconWrapper: {
    marginLeft: 6,
  },
  homeActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
});
