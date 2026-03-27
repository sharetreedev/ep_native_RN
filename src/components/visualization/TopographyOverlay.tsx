import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Filter, FeGaussianBlur, FeColorMatrix, Circle, G } from 'react-native-svg';

interface TopographyOverlayProps {
  size: number;
  data: Array<{ x: number, y: number, intensity: number }>;
}

/**
 * TopographyOverlay (Pattern B)
 * Implements the "Global Pulse Topography" with SVG filters.
 * Uses Gaussian blur and color matrix to create "blooms" of light.
 */
const TopographyOverlay = ({ size, data }: TopographyOverlayProps) => {
  return (
    <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
      <Svg width={size} height={size}>
        <Defs>
          <Filter id="bloom">
            <FeGaussianBlur stdDeviation="10" result="blur" />
          <FeColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
          </Filter>
        </Defs>
        <G filter="url(#bloom)">
          {data.map((point, index) => (
            <Circle
              key={index}
              cx={(point.x / 100) * size}
              cy={(point.y / 100) * size}
              r={15 * point.intensity}
              fill="rgba(0, 242, 255, 0.6)"
            />
          ))}
        </G>
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

export default TopographyOverlay;
