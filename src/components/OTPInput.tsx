import React, { useRef, useState, useCallback } from 'react';
import { View, TextInput, StyleSheet, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../theme';

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
}

export default function OTPInput({ length = 4, onComplete }: OTPInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = useCallback((text: string, index: number) => {
    // Handle paste of full code
    if (text.length === length) {
      const digits = text.slice(0, length).split('');
      setValues(digits);
      inputs.current[length - 1]?.focus();
      onComplete(digits.join(''));
      return;
    }

    const digit = text.slice(-1);
    const next = [...values];
    next[index] = digit;
    setValues(next);

    if (digit && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }

    if (next.every((v) => v !== '')) {
      onComplete(next.join(''));
    }
  }, [values, length, onComplete]);

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
      if (e.nativeEvent.key === 'Backspace' && !values[index] && index > 0) {
        const next = [...values];
        next[index - 1] = '';
        setValues(next);
        inputs.current[index - 1]?.focus();
      }
    },
    [values],
  );

  return (
    <View style={styles.container}>
      {values.map((val, i) => (
        <TextInput
          key={i}
          ref={(r) => { inputs.current[i] = r; }}
          style={[styles.box, val ? styles.boxFilled : null]}
          value={val}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={length}
          selectTextOnFocus
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  box: {
    width: 56,
    height: 64,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    textAlign: 'center',
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  boxFilled: {
    borderColor: colors.primary,
  },
});
