import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, fontSizes } from '../theme';

type QuickLinkVariant = 'checkIn' | 'support' | 'trends' | 'lesson';

const variantConfig = {
  checkIn: {
    gradient: ['#7A8F66', '#6B7D5A'] as [string, string],
    subtitle: 'Your emotional pulse',
  },
  support: {
    gradient: ['#B8907A', '#A07A66'] as [string, string],
    subtitle: 'Crisis & helplines',
  },
  trends: {
    gradient: ['#6E7F8D', '#5A6B78'] as [string, string],
    subtitle: 'Your journey',
  },
  lesson: {
    gradient: ['#6A8F8A', '#587B76'] as [string, string],
    subtitle: 'Build your skills',
  },
} as const;

interface QuickLinkCardProps {
  variant: QuickLinkVariant;
  title: string;
  subtitle?: string;
  onPress: () => void;
  icon: React.ReactNode;
}

export default function QuickLinkCard({ variant, title, subtitle, onPress, icon }: QuickLinkCardProps) {
  const config = variantConfig[variant];
  const displaySubtitle = subtitle ?? config.subtitle;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.outer}>
      <LinearGradient
        colors={config.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tile}
      >
        {/* Organic decorative rings — bottom-right */}
        <View style={styles.decoWrap}>
          <View style={styles.decoRing1} />
          <View style={styles.decoRing2} />
          <View style={styles.decoRing3} />
        </View>

        {/* Icon — top left */}
        <View style={styles.iconWrap}>
          {icon}
        </View>

        {/* Text — bottom left */}
        <View style={styles.textArea}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{displaySubtitle}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const R = 56; // ring base size

const styles = StyleSheet.create({
  outer: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    height: 110,
    borderRadius: 20,
    shadowColor: '#2D3A25',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  tile: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },

  // ── Decorative organic rings ──
  decoWrap: {
    position: 'absolute',
    right: -16,
    bottom: -16,
    width: R + 30,
    height: R + 30,
  },
  decoRing1: {
    position: 'absolute',
    width: R + 20,
    height: R + 20,
    borderRadius: (R + 20) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    right: 0,
    bottom: 0,
  },
  decoRing2: {
    position: 'absolute',
    width: R,
    height: R,
    borderRadius: R / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    right: 10,
    bottom: 10,
  },
  decoRing3: {
    position: 'absolute',
    width: R - 22,
    height: R - 22,
    borderRadius: (R - 22) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    right: 21,
    bottom: 21,
  },

  // ── Icon ──
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Text ──
  textArea: {
    gap: 2,
  },
  title: {
    fontSize: fontSizes.base + 2,
    fontFamily: fonts.heading,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.1,
  },
});
