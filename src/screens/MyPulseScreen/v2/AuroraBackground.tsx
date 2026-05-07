import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

export type AuroraColors = {
  /** Dominant color (drives the 2 moving layers). */
  primary: string;
  /** Comparison/accent color (drives the stable base layer). When missing
   *  (e.g. a new user with no prev check-in), the base layer falls back
   *  to `primary` — a single-tone wash rather than a black mask. */
  secondary?: string;
};

type Props = {
  colors: AuroraColors;
  /** Pause all blob animations (e.g., when the screen loses focus). */
  paused?: boolean;
};

/**
 * Per-blob configuration. Position/movement percentages refer to screen
 * dimensions; the renderer turns them into pixel values at draw time.
 */
type BlobConfig = {
  id: string;
  layerType: 'base' | 'moving';
  /** Initial center as % of screen width / height. */
  initialX: number;
  initialY: number;
  /** Radius in px. */
  radius: number;
  /** Animation cycle length in ms. */
  loopMs: number;
  /** Initial delay before the loop starts (ms). */
  delayMs: number;
  /** [low, high] opacity oscillation range. */
  opacityRange: [number, number];
  /** [low, high] scale range. Ignored for `base` layers. */
  scaleRange: [number, number];
  /** Movement amplitude as % of screen width. Ignored for `base` layers. */
  moveX: number;
  /** Movement amplitude as % of screen height. Ignored for `base` layers. */
  moveY: number;
};

const BLOBS: BlobConfig[] = [
  // 1 stable base layer (opacity-only animation, primary color). Anchored in
  // the top-left quadrant so it doesn't visually centre the composition.
  { id: 'base1', layerType: 'base',   initialX: 20, initialY: 25, radius: 380, loopMs: 12000, delayMs:    0, opacityRange: [0.55, 0.75], scaleRange: [1, 1],       moveX:  0, moveY:  0 },
  // 3 moving layers anchored across the remaining quadrants with wider travel
  // so the aurora spreads to the screen edges instead of clustering centrally.
  { id: 'mov1',  layerType: 'moving', initialX: 80, initialY: 30, radius: 340, loopMs: 14000, delayMs:    0, opacityRange: [0.65, 0.85], scaleRange: [0.95, 1.10], moveX: 35, moveY: 22 },
  { id: 'mov2',  layerType: 'moving', initialX: 25, initialY: 75, radius: 320, loopMs: 16000, delayMs: 4000, opacityRange: [0.55, 0.80], scaleRange: [0.95, 1.15], moveX: 30, moveY: 20 },
  { id: 'mov3',  layerType: 'moving', initialX: 78, initialY: 72, radius: 300, loopMs: 18000, delayMs: 2000, opacityRange: [0.55, 0.80], scaleRange: [0.95, 1.12], moveX: 32, moveY: 24 },
];

const AuroraBlob = React.memo(function AuroraBlob({
  config,
  color,
  width,
  height,
  reduceMotion,
  paused,
}: {
  config: BlobConfig;
  color: string;
  width: number;
  height: number;
  reduceMotion: boolean;
  paused: boolean;
}) {
  // 0 → 1 → 0 oscillation driving every per-blob motion (position, scale, opacity).
  const t = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion || paused) {
      cancelAnimation(t);
      // When paused, freeze at mid-point so the blob is still visually present
      // but not updating per frame. Saves UI-thread work while the screen is
      // out of focus.
      t.value = 0.5;
      return;
    }
    t.value = withSequence(
      withTiming(0, { duration: config.delayMs }),
      withRepeat(
        withSequence(
          withTiming(1, { duration: config.loopMs / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: config.loopMs / 2, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    return () => {
      cancelAnimation(t);
    };
  }, [reduceMotion, paused, config.delayMs, config.loopMs, t]);

  // Box bounds. The blob's wrapper is a width×height square positioned so its
  // center sits at (initialX%, initialY%) of the screen; transform animates it
  // around that anchor.
  const size = config.radius * 2;
  const baseLeft = (config.initialX / 100) * width - config.radius;
  const baseTop = (config.initialY / 100) * height - config.radius;

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(t.value, [0, 1], config.opacityRange);
    if (config.layerType === 'base') {
      return { opacity, transform: [] };
    }
    const scale = interpolate(t.value, [0, 1], config.scaleRange);
    const tx = (interpolate(t.value, [0, 0.5, 1], [-config.moveX, config.moveX, -config.moveX]) / 100) * width;
    const ty = (interpolate(t.value, [0, 0.5, 1], [-config.moveY, config.moveY, -config.moveY]) / 100) * height;
    return {
      opacity,
      transform: [{ translateX: tx }, { translateY: ty }, { scale }] as ViewStyle['transform'],
    };
  });

  const gradientId = `aurora-${config.id}`;

  return (
    <Animated.View
      pointerEvents="none"
      // collapsable=false forces this into its own native layer so the SVG
      // beneath is rasterized once and only the layer's transform/opacity
      // updates per frame on the GPU compositor.
      collapsable={false}
      style={[
        { position: 'absolute', left: baseLeft, top: baseTop, width: size, height: size },
        animatedStyle,
      ]}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.85} />
            <Stop offset="55%" stopColor={color} stopOpacity={0.40} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={config.radius} cy={config.radius} r={config.radius} fill={`url(#${gradientId})`} />
      </Svg>
    </Animated.View>
  );
});

function AuroraBackground({ colors, paused = false }: Props) {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const primaryColor = colors.primary;
  // When secondary is missing, fall back to primary so the base layer renders
  // in the same tone as the moving layers — a single-colour wash. Passing a
  // transparent colour here makes react-native-svg render the gradient as
  // semi-transparent black (stopColor + stopOpacity mix), producing a grey
  // mask under the aurora — we never want that.
  const secondaryColor = colors.secondary ?? primaryColor;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {BLOBS.map((blob) => (
        <AuroraBlob
          key={blob.id}
          config={blob}
          // Base (stable) layers carry the comparison/secondary tone in the
          // background; moving layers carry the active/primary tone so the
          // most-current emotion is the dynamic, eye-catching element.
          color={blob.layerType === 'base' ? secondaryColor : primaryColor}
          width={width}
          height={height}
          reduceMotion={reduceMotion}
          paused={paused}
        />
      ))}
    </View>
  );
}

export default React.memo(AuroraBackground);
