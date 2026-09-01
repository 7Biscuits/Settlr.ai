import React, { useRef, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Keyboard,
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
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { chat, confirm } from '../../api/agent';
import type { AgentReply, PendingAction } from '../../api/types';
import { ConfirmSheet } from '../ConfirmSheet';
import { ApiError } from '../../api/client';
import { transcribe } from '../../api/voice';
import { useVoiceRecorder } from '../../features/ai/useVoiceRecorder';
import { useVoicePlayer } from '../../features/ai/useVoicePlayer';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  isError?: boolean;
}

interface ChatScreenProps {
  onOpenSettings?: () => void;
  onVoiceRecord?: () => void;
}

function mimeTypeForUri(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.webm')) return 'audio/webm';
  if (lower.endsWith('.mp4')) return 'audio/mp4';
  return 'audio/m4a';
}

function formatActionDetails(tool: string, args: unknown): string {
  const a = (args || {}) as Record<string, unknown>;
  switch (tool) {
    case 'create_group':
      return `Create group "${a.name}"`;
    case 'invite_to_group':
      return `Add ${a.query || a.email || a.phone || (Array.isArray(a.members) ? a.members.join(', ') : 'member')} to group`;
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

export function ChatScreen({ onOpenSettings }: ChatScreenProps) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 24);
  const scrollRef = useRef<ScrollView>(null);

  const voice = useVoiceRecorder();
  const player = useVoicePlayer();

  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [conversation, setConversation] = useState<unknown[] | undefined>();

  // Sensitive action confirmation state
  const [pending, setPending] = useState<{
    action: PendingAction;
    content: string;
    speakReply: boolean;
  } | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, loading, transcribing]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
    );
    return () => showSub.remove();
  }, []);


  const applyReply = async (reply: AgentReply, speakReply = false) => {
    setConversation(reply.messages);
    if (reply.type === 'confirmation_required' && reply.pendingAction) {
      setPending({
        action: reply.pendingAction,
        content: reply.content,
        speakReply,
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

    if (speakReply && reply.content) {
      try {
        await player.speak(reply.content);
      } catch {
        // Audio playback error is handled by useVoicePlayer
      }
    }
  };


  const handleSend = async (customText?: string, speakReply = false) => {
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
      await applyReply(res, speakReply);
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
      if (speakReply) {
        await player.speak("I encountered an issue processing your request.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMicToggle = async () => {
    if (player.speaking) {
      await player.stop();
      return;
    }

    if (voice.recording) {
      setTranscribing(true);
      const uri = await voice.stop();
      if (!uri) {
        setTranscribing(false);
        return;
      }
      try {
        const audioBase64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const mimeType = mimeTypeForUri(uri);
        const { text } = await transcribe(audioBase64, mimeType);
        const trimmed = text.trim();
        setTranscribing(false);
        if (!trimmed) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              sender: 'assistant',
              text: "🎤 I couldn't hear any audio. Please try speaking again.",
            },
          ]);
          return;
        }
        await handleSend(trimmed, true);
      } catch (err) {
        setTranscribing(false);
        const errMsg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : "Voice transcription unavailable. Please check DEEPGRAM_API_KEY in backend/.env.";
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'assistant',
            text: `⚠️ ${errMsg}`,
            isError: true,
          },
        ]);
      }
    } else {
      await voice.start();
    }
  };


  const handleConfirmAction = async () => {
    if (!pending) return;
    setConfirming(true);
    const speakReply = pending.speakReply;
    try {
      const reply = await confirm(pending.action.proposalId);
      setPending(null);
      await applyReply(reply, speakReply);
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.keyboardView}>
        {/* Background Watermark */}
        <View style={styles.watermarkContainer} pointerEvents="none">
          <Text style={styles.watermarkText}>SETTLR{'\n'}AI</Text>
        </View>

        {/* Top Header Row */}
        <View style={[styles.headerRow, { paddingTop: topInset + 4 }]}>
          <View style={styles.headerStatus}>
            {player.speaking ? (
              <Pressable onPress={() => player.stop()} style={styles.speakingIndicator}>
                <Ionicons name="volume-high" size={18} color="#2738F5" />
                <Text style={styles.speakingText}>Playing voice… (tap to stop)</Text>
              </Pressable>
            ) : null}
          </View>
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
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={styles.chatScrollContent}>

          {/* Welcome Card & Suggested Prompts when empty */}
          {messages.length === 0 ? (
            <View style={styles.welcomeContainer}>
              <View style={styles.overviewCard}>
                <Text style={styles.welcomeHeading}>👋 Hi! I'm Settlr AI</Text>
                <Text style={styles.welcomeSubheading}>
                  Ask me questions or tap the microphone to speak! I can track balances, split bills, add friends, and settle debts automatically.
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
                    {!msg.isError && (
                      <Pressable
                        onPress={() => player.speak(msg.text)}
                        style={styles.listenAgainButton}>
                        <Ionicons name="volume-medium-outline" size={16} color="#64748B" />
                        <Text style={styles.listenAgainText}>Listen</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            ))
          )}

          {transcribing ? (
            <View style={styles.cleoMessageContainer}>
              <View style={[styles.overviewCard, styles.loadingCard]}>
                <ActivityIndicator size="small" color="#2738F5" />
                <Text style={styles.loadingText}>Transcribing your voice with Deepgram STT…</Text>
              </View>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.cleoMessageContainer}>
              <View style={[styles.overviewCard, styles.loadingCard]}>
                <ActivityIndicator size="small" color="#2738F5" />
                <Text style={styles.loadingText}>Thinking & executing tools…</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        {/* Voice recording banner if active */}
        {voice.recording ? (
          <View style={styles.recordingBanner}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingBannerText}>Listening… Tap the mic button to finish</Text>
          </View>
        ) : null}

        {/* Floating Chat Input & Single Mic/Action Bar */}
        <View style={styles.inputBarWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
              placeholder={
                voice.recording
                  ? "Listening to your voice…"
                  : player.speaking
                  ? "Settlr is speaking… (tap mic to stop)"
                  : "Ask Settlr AI..."
              }
              placeholderTextColor="#94A3B8"
              editable={!voice.recording}
              style={styles.textInput}
            />
            {inputText.length > 0 && (
              <Pressable
                hitSlop={8}
                onPress={() => setInputText("")}
                style={styles.clearTextButton}>
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </Pressable>
            )}
          </View>

          {/* Single Action Button: Send when text typed, Mic/Stop when empty, or Stop TTS when speaking */}
          {inputText.trim().length > 0 ? (
            <Pressable
              onPress={() => handleSend()}
              style={[styles.homeActionButton, styles.homeActionSend]}>
              <Ionicons name="arrow-up" size={24} color="#FFFFFF" />
            </Pressable>
          ) : (
            <Pressable
              onPress={handleMicToggle}
              style={[
                styles.homeActionButton,
                voice.recording
                  ? styles.homeActionActive
                  : player.speaking
                  ? styles.homeActionSpeaking
                  : styles.homeActionDefault,
              ]}>
              <Ionicons
                name={
                  voice.recording
                    ? "stop"
                    : player.speaking
                    ? "volume-mute"
                    : "mic"
                }
                size={22}
                color="#FFFFFF"
              />
            </Pressable>
          )}
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
  headerStatus: {
    flex: 1,
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  speakingText: {
    fontSize: 12,
    color: '#2738F5',
    fontWeight: '600',
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
  listenAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  listenAgainText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
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
  recordingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 14,
    marginBottom: 6,
    borderRadius: 12,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  recordingBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '700',
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
  clearTextButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  homeActionDefault: {
    backgroundColor: '#2738F5',
  },
  homeActionSend: {
    backgroundColor: '#2738F5',
  },
  homeActionActive: {
    backgroundColor: '#EF4444',
  },
  homeActionSpeaking: {
    backgroundColor: '#059669',
  },
});

