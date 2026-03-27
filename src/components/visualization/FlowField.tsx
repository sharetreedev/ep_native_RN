import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import Animated, { 
  useAnimatedProps, 
  withRepeat, 
  withTiming, 
  useSharedValue,
  withDelay,
  Easing
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ParticleProps {
  size: number;
  delay: number;
}

const Particle = ({ size, delay }: ParticleProps) => {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 4000, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, []);

  const animatedProps = useAnimatedProps(() => {
    const x = (progress.value * size) % size;
    return {
      cx: x,
      opacity: Math.sin(progress.value * Math.PI) * 0.5,
    };
  });

  return (
    <AnimatedCircle 
      cy={Math.random() * size} 
      r={1} 
      fill="#00F2FF" 
      animatedProps={animatedProps} 
    />
  );
};

const FlowField = ({ size }: { size: number }) => {
  const particles = useMemo(() => Array.from({ length: 40 }), []);

  return (
    <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
      <Svg width={size} height={size}>
        <G>
          {particles.map((_, i) => (
            <Particle key={i} size={size} delay={i * 100} />
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

export default FlowField;
