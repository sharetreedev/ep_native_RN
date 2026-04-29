import React, { useMemo } from 'react';
import { View, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { Emotion } from './emotions';
import EmotionSquare from './EmotionSquare';
import { useEmotionStates, MappedEmotion } from '../../hooks/useEmotionStates';
import GroupOverlay from './GroupOverlay';
import PairOverlay from './PairOverlay';
import { colors } from '../../theme';

const { width } = Dimensions.get('window');

interface PulseGridProps {
  /** Called when a tile is long-pressed (e.g. navigate to EmotionDetail) */
  onEmotionLongPress?: (emotion: Emotion) => void;
  /** Called when a tile is pressed */
  onEmotionPress?: (emotion: Emotion) => void;
  /** Currently selected emotion – shows border highlight */
  selectedEmotion?: Emotion | null;
  /** Whether the grid tiles respond to touch */
  isInteractive?: boolean;
  /** Visual mode: determines which overlays are shown */
  mode?: 'checkin' | 'global' | 'pairs' | 'group';
  data?: Record<string, any>;
  children?: React.ReactNode;
}

/**
 * A 4×4 grid of emotion tiles.
 * Fetches dynamic emotion data (names, hex colors) from the Xano backend.
 */
export default function PulseGrid({
  onEmotionLongPress,
  onEmotionPress,
  selectedEmotion,
  isInteractive = true,
  mode = 'checkin',
  data,
  children,
}: PulseGridProps) {
  const { emotionStates, isLoading } = useEmotionStates();

  // Map emotionStates to row/col for easy lookups in the grid
  const emotionMap = useMemo(() => {
    const map: Record<string, MappedEmotion> = {};
    emotionStates.forEach((e) => {
      map[`${e.row}-${e.col}`] = e;
    });
    return map;
  }, [emotionStates]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center h-[380px]">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderGridCell = (row: number, col: number) => {
    const emotion = emotionMap[`${row}-${col}`];
    if (!emotion) return <View key={`empty-${row}-${col}`} className="flex-1" />;

    const isSelected = selectedEmotion?.id === emotion.id;

    // Overlay data for this emotion: check string id (for mocks) or numeric xanoId (for global pulse)
    const cellData = data?.[emotion.id] || data?.[emotion.xanoId];

    // Screen-reader label. The four quadrants of the grid map to a standard
    // "circumplex model" of affect — row 0-1 = high energy, 2-3 = low energy;
    // col 0-1 = unpleasant, 2-3 = pleasant. We announce the emotion name plus
    // the quadrant so a VoiceOver user has some mental map of where they are.
    const energy = row <= 1 ? 'high energy' : 'low energy';
    const pleasantness = col <= 1 ? 'unpleasant' : 'pleasant';
    const a11yLabel = `${emotion.name}, ${energy}, ${pleasantness}`;

    return (
      <Pressable
        key={`${row}-${col}`}
        onPress={() => isInteractive && onEmotionPress?.(emotion)}
        onLongPress={() => isInteractive && onEmotionLongPress?.(emotion)}
        className="flex-1 aspect-square"
        accessibilityRole={isInteractive ? 'button' : 'image'}
        accessibilityLabel={a11yLabel}
        accessibilityHint={isInteractive ? 'Double tap to select, long press for details' : undefined}
        accessibilityState={{ selected: isSelected, disabled: !isInteractive }}
      >
        <EmotionSquare emotion={emotion} selected={isSelected} />

        {/* Group overlay: show member count badge */}
        {mode === 'group' && cellData?.count > 0 && (
          <GroupOverlay count={cellData.count} />
        )}

        {/* Pairs overlay: show user avatars */}
        {mode === 'pairs' && cellData?.users?.length > 0 && (
          <PairOverlay
            userNames={cellData.users.map((u: any) => u.id)}
          />
        )}
      </Pressable>
    );
  };

  return (
    <View className="w-full aspect-square relative">
      <View className="absolute inset-0">
        {[0, 1, 2, 3].map((row) => (
          <View key={`row-${row}`} className="flex-row flex-1">
            {[0, 1, 2, 3].map((col) => renderGridCell(row, col))}
          </View>
        ))}
      </View>
      {children}
    </View>
  );
}
