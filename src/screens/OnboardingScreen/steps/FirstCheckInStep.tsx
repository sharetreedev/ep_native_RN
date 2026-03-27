import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Emotion } from '../../../constants/emotions';
import { findEmotionAtCoordinate } from '../../../constants/emotions';
import { MappedEmotion } from '../../../hooks/useEmotionStates';
import Button from '../../../components/Button';
import CheckInSliderFlow from '../../../components/CheckInSliderFlow';
import CircumplexGrid from '../../../components/visualization/CircumplexGrid';
import { styles } from '../styles';

interface FirstCheckInStepProps {
  onComplete: (emotion: Emotion, coordinateId?: number) => void;
  emotionStates: MappedEmotion[];
}

export default function FirstCheckInStep({
  onComplete,
  emotionStates,
}: FirstCheckInStepProps) {
  const [checkInViewMode, setCheckInViewMode] = useState<'slider' | 'grid'>('slider');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your First Check In</Text>
      </View>
      <View style={styles.tabContainer}>
        <View style={styles.tabBar}>
          <Button
            title="Slider"
            variant={checkInViewMode === 'slider' ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => setCheckInViewMode('slider')}
          />
          <Button
            title="Grid"
            variant={checkInViewMode === 'grid' ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => setCheckInViewMode('grid')}
          />
        </View>
      </View>
      <View style={[styles.viewContainer, checkInViewMode !== 'slider' && styles.hidden]}>
        <CheckInSliderFlow
          onComplete={(emotion: Emotion) => {
            const state = emotionStates.find((s) => s.id === emotion.id);
            onComplete(emotion, state?.xanoId);
          }}
          onCancel={() => setCheckInViewMode('grid')}
        />
      </View>
      <View style={[styles.viewContainer, checkInViewMode !== 'grid' && styles.hidden]}>
        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
          <CircumplexGrid
            onEmotionPress={(emotion) => {
              const state = emotionStates.find((s) => s.id === emotion.id);
              onComplete(emotion, state?.xanoId);
            }}
            onCoordinatePress={(x, y) => {
              const emotion = findEmotionAtCoordinate(x, y);
              if (emotion) {
                const state = emotionStates.find((s) => s.id === emotion.id);
                onComplete(emotion, state?.xanoId);
              }
            }}
            showCoordinatesOverlay
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
