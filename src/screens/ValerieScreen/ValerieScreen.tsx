import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, Send, Sparkles } from 'lucide-react-native';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';
import { useSafeEdges } from '../../contexts/MHFRContext';

export default function ValerieScreen() {
  const safeEdges = useSafeEdges(['top']);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: "Hi, I'm Valerie. How are you feeling today?" },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    const newMsg = { role: 'user' as const, text: message };
    setConversation([...conversation, newMsg]);
    setMessage('');
    setTimeout(() => {
      setConversation((prev) => [...prev, { role: 'ai', text: "I hear you. Tell me more about that." }]);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container} edges={safeEdges}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Sparkles size={20} color={colors.accent} />
          </View>
          <View>
            <Text style={styles.title}>Valerie</Text>
            <Text style={styles.online}>● Online</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.callButton}>
          <Phone color={colors.primary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {conversation.map((msg, index) => (
          <View
            key={index}
            style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}
          >
            <Text style={[styles.bubbleText, msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAi]}>
              {msg.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.textPlaceholder}
            value={message}
            onChangeText={setMessage}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Send color={colors.textOnPrimary} size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    backgroundColor: colors.background,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accentLight,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: fontSizes.xl, fontFamily: fonts.heading, color: colors.textPrimary },
  online: { fontSize: fontSizes.xs, fontFamily: fonts.bodyMedium, color: colors.primary },
  callButton: {
    backgroundColor: colors.primaryLight,
    padding: spacing.xs,
    borderRadius: borderRadius.full,
  },
  scroll: { flex: 1, paddingHorizontal: spacing.base, paddingVertical: spacing.base },
  scrollContent: { paddingBottom: 100 },
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
    backgroundColor: colors.chatBubbleUser,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
