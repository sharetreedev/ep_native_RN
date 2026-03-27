import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import GridBackground from './GridBackground';
import ElevationLayer from './ElevationLayer';
import TopographyOverlay from './TopographyOverlay';
import FlowField from './FlowField';
import CoordinatesGrid from './CoordinatesGrid';

interface PulseVisualizationProps {
  interactionMode?: 'grid' | 'zoom' | 'detail';
}

/**
 * PulseVisualization (Unified Core)
 * Stacks all Pattern layers into a single responsive unit.
 */
const PulseVisualization = ({ interactionMode = 'grid' }: PulseVisualizationProps) => {
  const { width } = useWindowDimensions();
  const size = width - 40; // Margin 20 each side

  // Sample data for topography
  const mockData = [
    { x: 30, y: 40, intensity: 0.8 },
    { x: 70, y: 60, intensity: 1.2 },
    { x: 20, y: 80, intensity: 0.5 },
  ];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <GridBackground size={size} />
      <ElevationLayer size={size} />
      <TopographyOverlay size={size} data={mockData} />
      <FlowField size={size} />
      <CoordinatesGrid />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default PulseVisualization;
