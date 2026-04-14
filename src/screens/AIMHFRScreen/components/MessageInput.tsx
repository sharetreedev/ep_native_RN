import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Send } from 'lucide-react-native';
import {
  colors,
  fonts,
  fontSizes,
  spacing,
  borderRadius,
} from '../../../theme';

interface MessageInputProps {
  hasConsented: boolean;
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onStart: () => void;
}

export default function MessageInput({
  hasConsented,
  value,
  onChangeText,
  onSend,
  onStart,
}: MessageInputProps) {
  if (!hasConsented) {
    return (
      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.startButton} onPress={onStart}>
          <Text style={styles.startButtonText}>Start a conversation</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.inputRow}>
      <TextInput
        style={styles.input}
        placeholder="Type a message..."
        placeholderTextColor={colors.textPlaceholder}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="send"
        onSubmitEditing={onSend}
      />
      <TouchableOpacity style={styles.sendButton} onPress={onSend}>
        <Send color={colors.textOnPrimary} size={20} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    paddingBottom: spacing['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
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
  startButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.base,
  },
  startButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.base,
    color: colors.textOnPrimary,
  },
});
