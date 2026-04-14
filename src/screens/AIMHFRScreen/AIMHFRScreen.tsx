import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { RootStackParamList } from '../../types/navigation';
import {
  colors,
  fonts,
  fontSizes,
  spacing,
  borderRadius,
} from '../../theme';
import { request } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeEdges } from '../../contexts/MHFRContext';
import { logger } from '../../lib/logger';
import ChatMessage from './components/ChatMessage';
import MessageInput from './components/MessageInput';
import ConsentModal from './components/ConsentModal';

type Message = { role: 'user' | 'ai'; text: string; _streaming?: boolean };

// ─── Animated orb (decorative, shown while AI responds) ──────────────
const ORB_BASE = 120;
const ORB_MAX = 160;

function PulseOrb({ isActive }: { isActive: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    let scaleAnim: Animated.CompositeAnimation;
    let opacityAnim: Animated.CompositeAnimation;

    if (isActive) {
      scaleAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: ORB_MAX / ORB_BASE, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.05, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      );
      opacityAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0.8, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
      );
    } else {
      scaleAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.08, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      );
      opacityAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0.6, duration: 1800, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.35, duration: 1800, useNativeDriver: true }),
        ]),
      );
    }

    scaleAnim.start();
    opacityAnim.start();

    return () => {
      scaleAnim.stop();
      opacityAnim.stop();
    };
  }, [isActive]);

  const glowScale = Animated.multiply(scale, 1.3);

  return (
    <View style={orbStyles.wrapper}>
      <Animated.View style={[orbStyles.glow, { opacity: pulseOpacity, transform: [{ scale: glowScale }] }]}>
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

      <Animated.View style={[orbStyles.orb, { transform: [{ scale }] }]}>
        <Svg width={ORB_BASE} height={ORB_BASE} viewBox={`0 0 ${ORB_BASE} ${ORB_BASE}`}>
          <Defs>
            <RadialGradient id="orbGrad" cx="40%" cy="38%" rx="55%" ry="55%">
              <Stop offset="0%" stopColor={colors.primaryGradientEnd} stopOpacity="1" />
              <Stop offset="50%" stopColor={colors.primary} stopOpacity="1" />
              <Stop offset="100%" stopColor={colors.darkForest} stopOpacity="1" />
            </RadialGradient>
          </Defs>
          <Circle cx={ORB_BASE / 2} cy={ORB_BASE / 2} r={ORB_BASE / 2} fill="url(#orbGrad)" />
        </Svg>
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
});

// ─── WebSocket-based conversation manager ────────────────────────────
// Uses ElevenLabs Conversational AI WebSocket protocol directly,
// bypassing the native SDK that crashes on mount.
function useElevenLabsChat(dynamicVars: { user_name: string; emotion: string }) {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Accumulate streamed text for current agent turn
  const agentTextRef = useRef('');
  const streamHandledRef = useRef(false);

  const connect = useCallback(async () => {
    if (wsRef.current) return;
    setStatus('connecting');
    setError(null);

    try {
      logger.log('[AI] Fetching signed URL via Xano...');
      const raw = await request<any>('POST', '/auth/elevenlabs/token');
      let signedUrl: string;
      if (typeof raw === 'string') {
        signedUrl = raw;
      } else if (raw?.signed_url) {
        signedUrl = raw.signed_url;
      } else {
        throw new Error('Unexpected response format');
      }
      if (!signedUrl || !signedUrl.startsWith('wss://')) throw new Error('Invalid signed URL');

      logger.log('[AI] Connecting WebSocket...');
      const ws = new WebSocket(signedUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        logger.log('[AI] WebSocket opened');
        setStatus('connected');
        ws.send(JSON.stringify({
          type: 'conversation_initiation_client_data',
          dynamic_variables: dynamicVars,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'conversation_initiation_metadata':
              logger.log('[AI] Conversation started:', data.conversation_initiation_metadata_event?.conversation_id);
              break;

            // Full agent response (non-streamed) — skip if streaming already handled it
            case 'agent_response':
              logger.log('[AI] agent_response (streamHandled:', streamHandledRef.current, ')');
              if (!streamHandledRef.current) {
                setMessages((prev) => [...prev, { role: 'ai', text: data.agent_response_event?.agent_response }]);
              }
              setIsResponding(false);
              agentTextRef.current = '';
              streamHandledRef.current = false;
              break;

            // Streamed text response parts
            case 'agent_chat_response_part': {
              const part = data.text_response_part;
              if (part?.type === 'delta' && part.text) {
                const isFirst = agentTextRef.current === '';
                agentTextRef.current += part.text;
                streamHandledRef.current = true;
                const accumulated = agentTextRef.current;
                if (isFirst) {
                  // Add new AI message
                  setMessages((prev) => [...prev, { role: 'ai', text: accumulated }]);
                } else {
                  // Update last AI message in-place
                  setMessages((prev) => {
                    const copy = [...prev];
                    copy[copy.length - 1] = { role: 'ai', text: accumulated };
                    return copy;
                  });
                }
                setIsResponding(false);
              } else if (part?.type === 'stop') {
                agentTextRef.current = '';
              }
              break;
            }

            // Replace last AI message with corrected full text
            case 'agent_response_correction':
              if (data.agent_response_correction_event?.corrected_text) {
                const corrected = data.agent_response_correction_event.corrected_text;
                setMessages((prev) => {
                  const copy = [...prev];
                  const lastAi = copy.findLastIndex((m) => m.role === 'ai');
                  if (lastAi >= 0) copy[lastAi] = { role: 'ai', text: corrected };
                  return copy;
                });
              }
              break;

            case 'user_transcript':
              // Already added locally on send
              break;

            case 'ping':
              ws.send(JSON.stringify({ type: 'pong', event_id: data.ping_event?.event_id }));
              break;

            case 'audio':
              // Audio chunks — ignore for now (text-only chat)
              break;

            case 'interruption':
              setIsResponding(false);
              break;

            default:
              logger.log('[AI] WS:', data.type, JSON.stringify(data).slice(0, 300));
              break;
          }
        } catch {
          // binary audio frame or unparseable — ignore
        }
      };

      ws.onerror = (e) => {
        logger.error('[AI] WebSocket error');
        setError('Connection error');
        setStatus('disconnected');
      };

      ws.onclose = (e) => {
        logger.log('[AI] WebSocket closed:', e.code, e.reason);
        wsRef.current = null;
        setStatus('disconnected');
        setIsResponding(false);
      };
    } catch (e: any) {
      setError(e.message ?? 'Failed to connect');
      setStatus('disconnected');
    }
  }, [dynamicVars]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setStatus('disconnected');
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setIsResponding(true);

    // Connect if not already
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      await connect();
      await new Promise<void>((resolve, reject) => {
        const check = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            clearInterval(check);
            resolve();
          }
        }, 100);
        setTimeout(() => { clearInterval(check); reject(new Error('Connection timeout')); }, 10000);
      });
    }

    // ElevenLabs direct WebSocket text input format
    const msg = JSON.stringify({ type: 'user_message', text });
    logger.log('[AI] Sending text:', text.slice(0, 80));
    wsRef.current?.send(msg);
    // Reset stream tracking for next response
    streamHandledRef.current = false;
  }, [connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  return { status, messages, isResponding, error, connect, disconnect, sendMessage, setError };
}

// ─── Main screen ─────────────────────────────────────────────────────
export default function AIMHFRScreen() {
  const safeEdges = useSafeEdges(['top']);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [showConsent, setShowConsent] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const dynamicVars = React.useMemo(
    () => ({
      user_name: user?.firstName ?? user?.name ?? 'User',
      emotion: user?.recentCheckInEmotion?.Display ?? 'neutral',
    }),
    [user?.firstName, user?.name, user?.recentCheckInEmotion?.Display],
  );
  const { status, messages, isResponding, error, connect, sendMessage, setError } = useElevenLabsChat(dynamicVars);

  // Auto-scroll on every message update (including streaming deltas)
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;

    setInputText('');
    try {
      await sendMessage(text);
    } catch (e: any) {
      setError(e.message ?? 'Failed to send');
    }
  }, [inputText, sendMessage, setError]);

  const handleConsentAccept = useCallback(async () => {
    setHasConsented(true);
    setShowConsent(false);
    // Connect immediately so the agent's first message arrives
    try {
      await connect();
    } catch {}
    // Re-trigger send if there was pending text
    if (inputText.trim()) {
      const text = inputText.trim();
      setInputText('');
      sendMessage(text).catch((e: any) => setError(e.message ?? 'Failed to send'));
    }
  }, [inputText, connect, sendMessage, setError]);

  return (
    <SafeAreaView style={styles.container} edges={safeEdges}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.textSecondary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>AI MHFR</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Chat content */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
        >
          {messages.length === 0 && (
            <View style={styles.emptyChat}>
              <PulseOrb isActive={false} />
              <Text style={styles.emptyChatHeading}>
                How are you feeling today?
              </Text>
              <Text style={styles.emptyChatText}>
                Speak with an AI MHFR to get immediate support.
              </Text>
            </View>
          )}
          {messages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} text={msg.text} />
          ))}
          {isResponding && <ChatMessage role="ai" text="..." />}
          {error && (
            <View style={styles.chatError}>
              <Text style={styles.chatErrorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        <MessageInput
          hasConsented={hasConsented}
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          onStart={() => setShowConsent(true)}
        />
      </KeyboardAvoidingView>

      {/* Consent modal */}
      <ConsentModal
        visible={showConsent}
        onClose={() => setShowConsent(false)}
        onConfirm={handleConsentAccept}
      />
    </SafeAreaView>
  );
}

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
  backButton: { width: 24, alignItems: 'flex-start' as const },
  title: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
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
    gap: spacing.xs,
    paddingVertical: spacing['4xl'],
  },
  emptyChatHeading: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.base + 4,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  emptyChatText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textPlaceholder,
    textAlign: 'center',
  },
  chatError: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  chatErrorText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
