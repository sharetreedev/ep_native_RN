import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageCircleMore, Sparkles } from 'lucide-react-native';
import { colors, fonts, fontSizes } from '../theme';

interface AIMHFRCardProps {
  onPress: () => void;
}

export default function AIMHFRCard({ onPress }: AIMHFRCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.outer}>
      <LinearGradient
        colors={['#7E8FA6', '#6A7B92']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Decorative rings — top-right */}
        <View style={styles.decoWrap}>
          <View style={styles.decoRing1} />
          <View style={styles.decoRing2} />
          <View style={styles.decoRing3} />
        </View>

        {/* Sparkle accent — top-right area */}
        <View style={styles.sparkleWrap}>
          <Sparkles color="rgba(255, 255, 255, 0.15)" size={32} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <MessageCircleMore color="rgba(255, 255, 255, 0.9)" size={20} />
          </View>
          <View style={styles.textArea}>
            <Text style={styles.title}>Talk to Pulse AI</Text>
            <Text style={styles.subtitle}>Your mental health first responder</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const R = 64;

const styles = StyleSheet.create({
  outer: {
    borderRadius: 20,
    marginTop: 12,
    marginBottom: 0,
    shadowColor: '#3A4560',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    overflow: 'hidden',
  },

  // Decorative rings — top-right
  decoWrap: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: R + 40,
    height: R + 40,
  },
  decoRing1: {
    position: 'absolute',
    width: R + 24,
    height: R + 24,
    borderRadius: (R + 24) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    right: 0,
    top: 0,
  },
  decoRing2: {
    position: 'absolute',
    width: R,
    height: R,
    borderRadius: R / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    right: 12,
    top: 12,
  },
  decoRing3: {
    position: 'absolute',
    width: R - 24,
    height: R - 24,
    borderRadius: (R - 24) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    right: 24,
    top: 24,
  },

  // Sparkle accent
  sparkleWrap: {
    position: 'absolute',
    right: 16,
    bottom: 14,
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textArea: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.heading,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.body,
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 0.1,
  },
});
