import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  colors,
  fonts,
  fontSizes,
  spacing,
  borderRadius,
} from '../../../theme';

export type ChatMessageRole = 'user' | 'ai';

interface ChatMessageProps {
  role: ChatMessageRole;
  text: string;
}

function ChatMessageImpl({ role, text }: ChatMessageProps) {
  const isUser = role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
      <Text
        style={[
          styles.bubbleText,
          isUser ? styles.bubbleTextUser : styles.bubbleTextAi,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const ChatMessage = React.memo(ChatMessageImpl);
export default ChatMessage;

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.button,
    marginBottom: spacing.sm,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
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
});
