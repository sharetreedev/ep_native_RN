import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const GridBackground = ({ size }: { size: number }) => {
  const step = size / 8;
  const paths = [];

  for (let i = 0; i <= 8; i++) {
    paths.push(`M 0 ${i * step} L ${size} ${i * step}`);
    paths.push(`M ${i * step} 0 L ${i * step} ${size}`);
  }

  return (
    <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
      <Svg width={size} height={size}>
        <Path
          d={paths.join(' ')}
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="1"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B0B14',
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default GridBackground;
