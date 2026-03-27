import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Mic, Send, MessageSquare } from 'lucide-react-native';
// Safe import — SDK may fail to load if LiveKit native modules aren't linked
let _useConversation: any = null;
let _sdkAvailable = false;
try {
  _useConversation = require('@elevenlabs/react-native').useConversation;
  _sdkAvailable = typeof _useConversation === 'function';
} catch {
  // Will fall back to mock
}

// Stable hook wrapper — always calls the hook if SDK loaded, never if it didn't
function useConversationSafe(opts: any) {
  if (_sdkAvailable) {
    return _useConversation(opts);
  }
  return null;
}
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { RootStackParamList } from '../../types/navigation';
import {
  colors,
  fonts,
  fontSizes,
  spacing,
  borderRadius,
} from '../../theme';
import ConfirmModal from '../../components/ConfirmModal';

const AGENT_ID = '1774497719828';

type Tab = 'chat' | 'voice';
type Message = { role: 'user' | 'ai'; text: string };

const CONSENT_MESSAGE =
  'This AI supports self-reflection but does not replace professional help. ' +
  'ShareTree encourages professional support when you feel distressed. ' +
  'By clicking "Agree," you consent to the recording of your conversation, ' +
  'which will be kept confidential. If there\'s serious risk of harm, we may ' +
  'share information by appropriate means to protect you or others.';

async function requestMicPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone Permission',
        message: 'Pulse AI needs microphone access for voice conversations.',
        buttonPositive: 'OK',
        buttonNegative: 'Cancel',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}

// ─── Animated voice orb ─────────────────────────────────────────────
const ORB_BASE = 120;
const ORB_MAX = 160;

function VoiceOrb({ isSpeaking }: { isSpeaking: boolean }) {
  const scale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);

  useEffect(() => {
    if (isSpeaking) {
      // When agent speaks, grow larger and pulse faster
      scale.value = withRepeat(
        withSequence(
          withTiming(ORB_MAX / ORB_BASE, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.05, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
        true,
      );
    } else {
      // Idle connected state — gentle breathing
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1800 }),
          withTiming(0.35, { duration: 1800 }),
        ),
        -1,
        true,
      );
    }

    return () => {
      cancelAnimation(scale);
      cancelAnimation(pulseOpacity);
    };
  }, [isSpeaking]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: scale.value * 1.3 }],
  }));

  return (
    <View style={orbStyles.wrapper}>
      {/* Outer glow ring */}
      <Animated.View style={[orbStyles.glow, glowStyle]}>
        <Svg width={ORB_MAX * 1.6} height={ORB_MAX * 1.6} viewBox={`0 0 ${ORB_MAX * 1.6} ${ORB_MAX * 1.6}`}>
          <Defs>
            <RadialGradient id="glowGrad" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.35" />
              <Stop offset="70%" stopColor={colors.primary} stopOpacity="0.08" />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={ORB_MAX * 0.8} cy={ORB_MAX * 0.8} r={ORB_MAX * 0.8} fill="url(#glowGrad)" />
        </Svg>
      </Animated.View>

      {/* Main orb */}
      <Animated.View style={[orbStyles.orb, orbStyle]}>
        <Svg width={ORB_BASE} height={ORB_BASE} viewBox={`0 0 ${ORB_BASE} ${ORB_BASE}`}>
          <Defs>
            <RadialGradient id="orbGrad" cx="40%" cy="38%" rx="55%" ry="55%">
              <Stop offset="0%" stopColor="#A8B896" stopOpacity="1" />
              <Stop offset="50%" stopColor={colors.primary} stopOpacity="1" />
              <Stop offset="100%" stopColor="#30442B" stopOpacity="1" />
            </RadialGradient>
          </Defs>
          <Circle cx={ORB_BASE / 2} cy={ORB_BASE / 2} r={ORB_BASE / 2} fill="url(#orbGrad)" />
        </Svg>
        <Mic color={colors.textOnPrimary} size={36} style={orbStyles.micIcon} />
      </Animated.View>
    </View>
  );
}

const orbStyles = StyleSheet.create({
  wrapper: {
    width: ORB_MAX * 1.6,
    height: ORB_MAX * 1.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
  },
  orb: {
    width: ORB_BASE,
    height: ORB_BASE,
    borderRadius: ORB_BASE / 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  micIcon: {
    position: 'absolute',
  },
});

// ─── Main screen ─────────────────────────────────────────────────────
export default function AIMHFRScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showConsent, setShowConsent] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const realConversation = useConversationSafe({
    onMessage: (message: any) => {
      if (message.source === 'user') {
        setMessages((prev) => [...prev, { role: 'user', text: message.message }]);
      } else if (message.source === 'ai') {
        setMessages((prev) => [...prev, { role: 'ai', text: message.message }]);
      }
    },
    onError: (err: any) => {
      setError(typeof err === 'string' ? err : err?.message ?? 'Something went wrong');
    },
  });

  const conversation = realConversation ?? {
    status: 'disconnected' as const,
    isSpeaking: false,
    startSession: async (_cfg: any) => { setError('ElevenLabs SDK not available — rebuild required'); },
    endSession: async () => {},
    sendUserMessage: (_text: string) => {},
    setMicMuted: (_muted: boolean) => {},
  };

  const isConnected = conversation.status === 'connected';

  // Cleanup session on unmount
  useEffect(() => {
    return () => {
      if (conversation.status === 'connected') {
        conversation.endSession();
      }
    };
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const startSession = useCallback(async () => {
    setError(null);
    const hasPermission = await requestMicPermission();
    if (!hasPermission) {
      setError('Microphone permission is required.');
      return false;
    }
    try {
      await conversation.startSession({ agentId: AGENT_ID });
      return true;
    } catch (e: any) {
      setError(e.message ?? 'Failed to connect');
      return false;
    }
  }, [conversation]);

  const ensureSession = useCallback(async () => {
    if (isConnected) return true;
    return startSession();
  }, [isConnected, startSession]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    const started = await ensureSession();
    if (!started) return;
    conversation.sendUserMessage(text);
  }, [inputText, ensureSession, conversation]);

  const handleVoiceToggle = useCallback(() => {
    if (isConnected) {
      conversation.endSession();
      return;
    }
    // Show consent modal if user hasn't agreed yet this session
    if (!hasConsented) {
      setShowConsent(true);
      return;
    }
    startSession();
  }, [isConnected, hasConsented, conversation, startSession]);

  const handleConsentAccept = useCallback(async () => {
    setHasConsented(true);
    setShowConsent(false);
    await startSession();
  }, [startSession]);

  // Mute mic when on chat tab, unmute on voice tab
  useEffect(() => {
    if (isConnected) {
      conversation.setMicMuted(activeTab === 'chat');
    }
  }, [activeTab, isConnected]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.textSecondary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Pulse AI</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
          onPress={() => setActiveTab('chat')}
        >
          <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>
            Chat
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'voice' && styles.activeTab]}
          onPress={() => setActiveTab('voice')}
        >
          <Text style={[styles.tabText, activeTab === 'voice' && styles.activeTabText]}>
            Voice
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'chat' ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={80}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
          >
            {messages.length === 0 && (
              <View style={styles.emptyChat}>
                <MessageSquare color={colors.textPlaceholder} size={40} />
                <Text style={styles.emptyChatText}>
                  Send a message to start a conversation
                </Text>
              </View>
            )}
            {messages.map((msg, i) => (
              <View
                key={i}
                style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAi,
                  ]}
                >
                  {msg.text}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={colors.textPlaceholder}
              value={inputText}
              onChangeText={setInputText}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Send color={colors.textOnPrimary} size={20} />
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.voiceBody}>
          <Text style={styles.statusLabel}>
            {isConnected
              ? conversation.isSpeaking
                ? 'Pulse AI is speaking...'
                : 'Listening...'
              : 'Tap to start a conversation'}
          </Text>

          {isConnected ? (
            <TouchableOpacity onPress={handleVoiceToggle} activeOpacity={0.8}>
              <VoiceOrb isSpeaking={conversation.isSpeaking} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleVoiceToggle}
              activeOpacity={0.8}
              style={styles.micButton}
            >
              <Mic color={colors.primary} size={36} />
            </TouchableOpacity>
          )}

          <Text style={styles.hint}>
            {isConnected ? 'Tap to end' : 'Your mental health first responder'}
          </Text>

          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      )}

      {/* Voice consent modal */}
      <ConfirmModal
        visible={showConsent}
        onClose={() => setShowConsent(false)}
        onConfirm={handleConsentAccept}
        title=""
        message={CONSENT_MESSAGE}
        confirmText="Accept"
        cancelText="Cancel"
        variant="bottom"
      />
    </SafeAreaView>
  );
}

const MIC_SIZE = 80;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
  },
  backButton: { width: 24, alignItems: 'flex-start' },
  title: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.base,
  },
  tab: {
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: spacing.xl,
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.primary,
  },

  // Chat
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    flexGrow: 1,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.base,
    paddingVertical: spacing['4xl'],
  },
  emptyChatText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textPlaceholder,
    textAlign: 'center',
  },
  bubble: {
    maxWidth: '80%',
    padding: spacing.lg,
    borderRadius: borderRadius.button,
    marginBottom: spacing.base,
  },
  bubbleUser: {
    backgroundColor: colors.chatBubbleUser,
    alignSelf: 'flex-end',
    borderTopRightRadius: spacing.xs,
  },
  bubbleAi: {
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
    borderTopLeftRadius: spacing.xs,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: { fontSize: fontSizes.base, fontFamily: fonts.body },
  bubbleTextUser: { color: colors.textOnPrimary },
  bubbleTextAi: { color: colors.textPrimary },
  inputRow: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textPrimary,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Voice
  voiceBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  statusLabel: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  micButton: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: colors.border,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.base,
    textAlign: 'center',
  },
  error: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.destructive,
    marginTop: spacing.base,
    textAlign: 'center',
    paddingHorizontal: spacing.base,
  },
});
