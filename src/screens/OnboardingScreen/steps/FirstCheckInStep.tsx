import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MeshGradientSlider } from '../../../components/checkin';
import { CheckInTouchGrid, CheckInConfirmModal } from '../../../components/checkin/CheckInOverlay';
import PulseGrid from '../../../components/visualization/PulseGrid';
import { MappedEmotion } from '../../../hooks/useEmotionStates';
import { useStateCoordinates } from '../../../hooks/useStateCoordinates';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../../theme';

interface FirstCheckInStepProps {
  onComplete: (emotion: MappedEmotion, coordinateId: number, checkinView: 'slider' | 'grid') => void;
  emotionStates: MappedEmotion[];
}

export default function FirstCheckInStep({
  onComplete,
  emotionStates,
}: FirstCheckInStepProps) {
  const { coordinates } = useStateCoordinates();
  const [viewMode, setViewMode] = useState<'slider' | 'grid'>('slider');
  const [selectedCoord, setSelectedCoord] = useState<{
    emotion: MappedEmotion;
    coordinateId: number;
    needsAttention: boolean;
  } | null>(null);

  const handleComplete = useCallback(
    (emotion: MappedEmotion, coordinateId: number) => {
      onComplete(emotion, coordinateId, viewMode);
    },
    [onComplete, viewMode],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.tabContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => setViewMode('slider')}
            style={[styles.tab, viewMode === 'slider' && styles.activeTab]}
          >
            <Text style={[styles.tabText, viewMode === 'slider' && styles.activeTabText]}>
              Slider
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('grid')}
            style={[styles.tab, viewMode === 'grid' && styles.activeTab]}
          >
            <Text style={[styles.tabText, viewMode === 'grid' && styles.activeTabText]}>
              Grid
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'grid' ? (
        <View style={styles.gridContainer}>
          <Text style={styles.title}>How are you feeling?</Text>
          <View style={styles.gridWrapper}>
            <PulseGrid mode="checkin" isInteractive={false}>
              <CheckInTouchGrid
                coordinates={coordinates}
                emotions={emotionStates}
                selectedId={selectedCoord?.coordinateId ?? null}
                onSelect={(cell) =>
                  setSelectedCoord({
                    emotion: cell.emotion,
                    coordinateId: cell.coordinate.id,
                    needsAttention: !!cell.coordinate.needs_attention,
                  })
                }
              />
            </PulseGrid>
          </View>
        </View>
      ) : (
        <View style={styles.viewContainer}>
          <MeshGradientSlider
            emotions={emotionStates}
            coordinates={coordinates}
            onComplete={handleComplete}
          />
        </View>
      )}

      {selectedCoord && (
        <CheckInConfirmModal
          emotion={selectedCoord.emotion}
          onConfirm={() => {
            const { emotion, coordinateId } = selectedCoord;
            setSelectedCoord(null);
            handleComplete(emotion, coordinateId);
          }}
          onCancel={() => setSelectedCoord(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 16,
    zIndex: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    padding: 4,
    borderRadius: borderRadius.full,
  },
  tab: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
  },
  activeTab: {
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.textPrimary,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  gridContainer: {
    flex: 1,
    marginTop: -80,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gridWrapper: {
    paddingHorizontal: spacing.lg,
  },
  viewContainer: {
    flex: 1,
    overflow: 'hidden',
  },
});
