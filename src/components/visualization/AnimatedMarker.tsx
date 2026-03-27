import React from 'react';
import { View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  useSharedValue,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

interface AnimatedMarkerProps {
  accentColor: string;
}

export default function AnimatedMarker({ accentColor }: AnimatedMarkerProps) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const pulse = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(1, { damping: 12 });
    opacity.value = withTiming(1, { duration: 200 });
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.2], [0.4, 0], Extrapolate.CLAMP),
    borderWidth: interpolate(pulse.value, [1, 1.2], [4, 1], Extrapolate.CLAMP),
  }));

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {/* Pulse Halo */}
      <Animated.View
        style={[
          haloStyle,
          {
            position: 'absolute',
            width: 40,
            height: 40,
            borderRadius: 20,
            borderColor: accentColor,
            backgroundColor: accentColor,
          }
        ]}
      />
      
      {/* Main Marker */}
      <Animated.View
        style={[
          animatedStyle,
          {
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }
        ]}
      >
        <View 
          style={{ 
            width: 12, 
            height: 12, 
            borderRadius: 6, 
            backgroundColor: accentColor 
          }} 
        />
      </Animated.View>
    </View>
  );
}
