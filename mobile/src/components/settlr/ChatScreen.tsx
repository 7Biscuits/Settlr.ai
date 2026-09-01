import React, { useRef, useState, useEffect } from 'react';
import {
  ActivityIndicator,
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
import { chat, confirm } from '../../api/agent';
import type { AgentReply, PendingAction } from '../../api/types';
import { ConfirmSheet } from '../ConfirmSheet';
import { ApiError } from '../../api/client';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  isError?: boolean;
}

interface ChatScreenProps {
  onOpenSettings?: () => void;
  onVoiceRecord?: () => void;
  isRecording?: boolean;
}

function formatActionDetails(tool: string, args: unknown): string {
  const a = (args || {}) as Record<string, unknown>;
  switch (tool) {
    case 'create_group':
      return `Create group "${a.name}"`;
    case 'invite_to_group':
      return `Add ${a.query || a.email || a.phone || 'member'} to group`;
    case 'create_expense': {
      const amountRupees = typeof a.amount === 'number' ? (a.amount / 100).toFixed(2) : '?';
      return `₹${amountRupees} for "${a.description}" split ${a.splitType || 'equal'}`;
    }
    case 'settle_debt':
      return `Settle debt of ₹${typeof a.amount === 'number' ? (a.amount / 100).toFixed(2) : '?'}`;
    case 'transfer_wallet_funds':
      return `Transfer ₹${typeof a.amount === 'number' ? (a.amount / 100).toFixed(2) : '?'}`;
    default:
      return JSON.stringify(args);
  }
}

export function ChatScreen({ onOpenSettings, onVoiceRecord, isRecording = false }: ChatScreenProps) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 24);
  const scrollRef = useRef<ScrollView>(null);

  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<unknown[] | undefined>();

  // Sensitive action confirmation state
  const [pending, setPending] = useState<{
    action: PendingAction;
    content: string;
  } | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, loading]);

  const applyReply = (reply: AgentReply) => {
    setConversation(reply.messages);
    if (reply.type === 'confirmation_required' && reply.pendingAction) {
      setPending({
        action: reply.pendingAction,
        content: reply.content,
      });
      if (reply.content) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'assistant',
            text: reply.content,
          },
        ]);
      }
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: reply.content || 'Done!',
        },
      ]);
    }
  };

  const handleSend = async (customText?: string) => {
    const text = (customText ?? inputText).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await chat(text, conversation);
      applyReply(res);
    } catch (err) {
      const errMsg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Unable to connect to AI Assistant. Please check backend connection.';
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `⚠️ ${errMsg}`,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!pending) return;
    setConfirming(true);
    try {
      const reply = await confirm(pending.action.proposalId);
      setPending(null);
      applyReply(reply);
    } catch (err) {
      setPending(null);
      const errMsg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'The action could not be completed.';
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `⚠️ ${errMsg}`,
          isError: true,
        },
      ]);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        {/* Background Watermark */}
        <View style={styles.watermarkContainer} pointerEvents="none">
          <Text style={styles.watermarkText}>SETTLR{'\n'}AI</Text>
        </View>

        {/* Top Header Row */}
        <View style={[styles.headerRow, { paddingTop: topInset + 4 }]}>
          <View style={styles.headerSpacer} />
          <View style={styles.headerActions}>
            <Pressable onPress={onOpenSettings} style={styles.iconButton}>
              <Ionicons name="person-circle-outline" size={32} color="#0F172A" />
            </Pressable>
          </View>
        </View>

        {/* Chat Scrollable Message Stream */}
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatScrollContent}>
          {/* Welcome Card & Suggested Prompts when empty */}
          {messages.length === 0 ? (
            <View style={styles.welcomeContainer}>
              <View style={styles.overviewCard}>
                <Text style={styles.welcomeHeading}>👋 Hi! I'm Settlr AI</Text>
                <Text style={styles.welcomeSubheading}>
                  Ask me about your group balances, who owes you money, or let me record expenses and settle debts for you!
                </Text>
              </View>

              <View style={styles.quickRepliesContainer}>
                <Text style={styles.quickRepliesHeader}>Try asking:</Text>
                {[
                  'Who owes me money? 🧠',
                  'How much do I owe? 💸',
                  'Create a group called Goa Trip 🏖️',
                  'Add Alice and Bob and split ₹600 for lunch 🍕',
                  'Settle all my group balances 💳',
                ].map((promptText) => (
                  <Pressable
                    key={promptText}
                    onPress={() => handleSend(promptText.replace(/[^\w\s₹?]/gi, '').trim())}
                    style={styles.quickReplyPill}>
                    <Text style={styles.quickReplyText}>{promptText}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            messages.map((msg) => (
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
                  <View
                    style={[
                      styles.overviewCard,
                      msg.isError ? styles.errorCard : null,
                    ]}>
                    <Text
                      style={[
                        styles.messageHeading,
                        msg.isError ? styles.errorMessageText : null,
                      ]}>
                      {msg.text}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}

          {loading ? (
            <View style={styles.cleoMessageContainer}>
              <View style={[styles.overviewCard, styles.loadingCard]}>
                <ActivityIndicator size="small" color="#2738F5" />
                <Text style={styles.loadingText}>Thinking…</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        {/* Floating Chat Input & Mic Bar */}
        <View style={styles.inputBarWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
              placeholder="Ask Settlr AI..."
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
            />
            {inputText.length > 0 ? (
              <Pressable onPress={() => handleSend()} style={styles.sendIconWrapper}>
                <Ionicons name="arrow-up-circle" size={32} color="#2738F5" />
              </Pressable>
            ) : (
              <Pressable onPress={onVoiceRecord} style={styles.sendIconWrapper}>
                <Ionicons
                  name={isRecording ? 'mic' : 'mic-outline'}
                  size={24}
                  color={isRecording ? '#EF4444' : '#2738F5'}
                />
              </Pressable>
            )}
          </View>

          <Pressable onPress={onVoiceRecord} style={styles.homeActionButton}>
            <Ionicons
              name={isRecording ? 'radio' : 'sparkles'}
              size={22}
              color={isRecording ? '#EF4444' : '#2738F5'}
            />
          </Pressable>
        </View>

        {/* Sensitive Action Confirmation Sheet */}
        <ConfirmSheet
          visible={!!pending}
          title="Confirm this action?"
          description={
            pending?.content ??
            'Settlr will execute this action on the backend once confirmed.'
          }
          rows={
            pending
              ? [
                  {
                    label: 'Action',
                    value: pending.action.tool.replace(/_/g, ' '),
                  },
                  {
                    label: 'Details',
                    value: formatActionDetails(
                      pending.action.tool,
                      pending.action.arguments,
                    ),
                  },
                ]
              : []
          }
          confirmLabel="Confirm & execute"
          loading={confirming}
          onConfirm={handleConfirmAction}
          onCancel={() => setPending(null)}
        />
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
  chatScrollContent: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 16,
    zIndex: 5,
    flexGrow: 1,
  },
  welcomeContainer: {
    gap: 14,
    paddingTop: 8,
  },
  welcomeHeading: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  welcomeSubheading: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
  quickRepliesHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  cleoMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    maxWidth: '85%',
    position: 'relative',
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    flex: 1,
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorMessageText: {
    color: '#B91C1C',
    fontSize: 14,
    lineHeight: 20,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  messageHeading: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  userMessageBubble: {
    backgroundColor: '#2738F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-end',
    marginBottom: 14,
    maxWidth: '80%',
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
    lineHeight: 20,
  },
  quickRepliesContainer: {
    marginTop: 6,
    gap: 8,
  },
  quickReplyPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#2738F5',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  quickReplyText: {
    color: '#2738F5',
    fontSize: 14,
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
