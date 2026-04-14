import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../../theme';
import { Quadrant, QUADRANTS, TILE_SIZE } from './quadrantGridUtils';

interface QuadrantStepProps {
  tileAnims: Animated.Value[];
  onQuadrantPress: (quadrant: Quadrant) => void;
}

export default function QuadrantStep({ tileAnims, onQuadrantPress }: QuadrantStepProps) {
  return (
    <>
      <Text style={styles.heading}>How are you feeling?</Text>
      <View style={styles.grid}>
        <View style={styles.gridRow}>
          {QUADRANTS.slice(0, 2).map((q, i) => (
            <Animated.View
              key={q.key}
              style={{
                opacity: tileAnims[i],
                transform: [{ scale: tileAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
              }}
            >
              <TouchableOpacity
                style={[styles.quadrantTile, { backgroundColor: q.color }]}
                onPress={() => onQuadrantPress(q)}
                activeOpacity={0.8}
              >
                <Text style={[styles.quadrantLabel, { color: q.fontColor }]}>
                  {q.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
        <View style={styles.gridRow}>
          {QUADRANTS.slice(2, 4).map((q, i) => (
            <Animated.View
              key={q.key}
              style={{
                opacity: tileAnims[i + 2],
                transform: [{ scale: tileAnims[i + 2].interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
              }}
            >
              <TouchableOpacity
                style={[styles.quadrantTile, { backgroundColor: q.color }]}
                onPress={() => onQuadrantPress(q)}
                activeOpacity={0.8}
              >
                <Text style={[styles.quadrantLabel, { color: q.fontColor }]}>
                  {q.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </View>
      <View style={styles.centeringSpacer} />
    </>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.heading,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 32,
  },
  grid: {
    // no gap — tiles flush against each other
  },
  gridRow: {
    flexDirection: 'row',
  },
  quadrantTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: borderRadius.xl + 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
  },
  quadrantLabel: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.headingSemiBold,
    textAlign: 'center',
    lineHeight: 24,
  },
  centeringSpacer: {
    height: 28,
  },
});
