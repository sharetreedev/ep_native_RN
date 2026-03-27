import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect, Defs, RadialGradient, Stop } from 'react-native-svg';

interface ElevationLayerProps {
  size: number;
}

/**
 * ElevationLayer (Pattern C)
 * Simulated topographical depth with CSS gradients and SVG blurs.
 */
const ElevationLayer = ({ size }: ElevationLayerProps) => {
  return (
    <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="grad1" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
            <Stop offset="0%" stopColor="#1E1E2E" stopOpacity="1" />
            <Stop offset="100%" stopColor="#0B0B14" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={size} height={size} fill="url(#grad1)" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default ElevationLayer;
