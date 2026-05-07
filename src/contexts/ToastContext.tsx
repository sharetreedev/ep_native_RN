import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, fontSizes } from '../theme';

type ToastVariant = 'default' | 'success' | 'error';

interface ShowToastOptions {
  duration?: number;
  variant?: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, options?: ShowToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 3000;
const FADE_MS = 200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [variant, setVariant] = useState<ToastVariant>('default');
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const showToast = useCallback((msg: string, options?: ShowToastOptions) => {
    clearTimer();
    setMessage(msg);
    setVariant(options?.variant ?? 'default');
    translateY.setValue(-20);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_MS,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: FADE_MS,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
    hideTimer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: FADE_MS,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: FADE_MS,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => setMessage(null));
    }, options?.duration ?? DEFAULT_DURATION);
  }, [opacity, translateY]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message ? (
        <SafeAreaView pointerEvents="none" style={styles.safeArea} edges={['top']}>
          <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
            <Text style={[styles.text, variantTextStyle(variant)]}>{message}</Text>
          </Animated.View>
        </SafeAreaView>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function variantTextStyle(variant: ToastVariant) {
  switch (variant) {
    case 'error': return { color: colors.destructive };
    case 'success': return { color: colors.primary };
    default: return { color: colors.primary };
  }
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    alignItems: 'center',
  },
  toast: {
    marginHorizontal: 24,
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    maxWidth: '92%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    textAlign: 'center',
  },
});
