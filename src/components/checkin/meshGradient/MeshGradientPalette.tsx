import React, { useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, Mask, Circle, G } from 'react-native-svg';
import { MappedEmotion } from '../../../hooks/useEmotionStates';
import { fonts, fontSizes, borderRadius } from '../../../theme';
import {
  PALETTE_ACTUAL,
  LENS_SIZE,
  LENS_RADIUS,
  LENS_FEATHER,
  TILE_SIZE,
  GRID_GAP,
  BASE_BG,
} from './meshGradientUtils';

interface QuadrantColors {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
}

interface MeshGradientPaletteProps {
  /** 4×4 grid of emotions, rendered as solid colored cells behind the mesh. */
  emotionGrid: (MappedEmotion | null)[][];
  cursorPos: { x: number; y: number } | null;
  isDragging: boolean;
  quadrantColors: QuadrantColors;
  onTouchStart: (x: number, y: number) => void;
  onTouchMove: (x: number, y: number) => void;
  onTouchEnd: () => void;
  children?: React.ReactNode;
}

// WeWeb gives the 4 corner emotions light text. Mirror that here so the
// labels stay legible against the saturated corner colours.
const LIGHT_LABEL_EMOTIONS = ['enraged', 'ecstatic', 'depressed', 'blissful'];

function getCellLabelColor(emotion: MappedEmotion | null): string {
  if (!emotion) return 'transparent';
  return LIGHT_LABEL_EMOTIONS.includes(emotion.name.toLowerCase())
    ? 'rgba(255, 255, 255, 0.88)'
    : '#4A4A4A';
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * The bottom layer of the palette: a 4×4 grid of solid emotion-coloured
 * tiles. Visible through the lens cutout in the mesh gradient layer above.
 */
function EmotionGridLayer({ emotionGrid }: { emotionGrid: (MappedEmotion | null)[][] }) {
  return (
    <View style={gridStyles.container}>
      {emotionGrid.map((row, rIdx) =>
        row.map((emotion, cIdx) => {
          const bg = emotion?.emotionColour ?? '#CCCCCC';
          const labelColor = getCellLabelColor(emotion);
          return (
            <View
              key={`${rIdx}-${cIdx}`}
              style={[
                gridStyles.cell,
                {
                  left: cIdx * (TILE_SIZE + GRID_GAP),
                  top: rIdx * (TILE_SIZE + GRID_GAP),
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  backgroundColor: bg,
                },
              ]}
            >
              {/* 2×2 sub-cell divider lines, only visible faintly */}
              <View style={gridStyles.subDivider} pointerEvents="none">
                <View style={gridStyles.subDividerH} />
                <View style={gridStyles.subDividerV} />
              </View>
              <Text
                style={[gridStyles.cellLabel, { color: labelColor }]}
                numberOfLines={2}
              >
                {capitalize(emotion?.name ?? '')}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
}

export default function MeshGradientPalette({
  emotionGrid,
  cursorPos,
  isDragging,
  quadrantColors,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  children,
}: MeshGradientPaletteProps) {
  const paletteOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const onTouchStartRef = useRef(onTouchStart);
  const onTouchMoveRef = useRef(onTouchMove);
  const onTouchEndRef = useRef(onTouchEnd);

  onTouchStartRef.current = onTouchStart;
  onTouchMoveRef.current = onTouchMove;
  onTouchEndRef.current = onTouchEnd;

  const handlePaletteLayout = useCallback((e: LayoutChangeEvent) => {
    (e.target as any).measureInWindow((pageX: number, pageY: number) => {
      paletteOriginRef.current = { x: pageX, y: pageY };
    });
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          const touchX = evt.nativeEvent.pageX - paletteOriginRef.current.x;
          const touchY = evt.nativeEvent.pageY - paletteOriginRef.current.y;
          onTouchStartRef.current(touchX, touchY);
        },
        onPanResponderMove: (evt: GestureResponderEvent) => {
          const touchX = evt.nativeEvent.pageX - paletteOriginRef.current.x;
          const touchY = evt.nativeEvent.pageY - paletteOriginRef.current.y;
          onTouchMoveRef.current(touchX, touchY);
        },
        onPanResponderRelease: () => {
          onTouchEndRef.current();
        },
        onPanResponderTerminate: () => {
          onTouchEndRef.current();
        },
      }),
    []
  );

  // Mask radius shrinks slightly so a soft feather ring (visible mesh)
  // hugs the outer edge of the lens instead of a hard cutout.
  const maskInnerR = LENS_RADIUS;
  const maskOuterR = LENS_RADIUS + LENS_FEATHER;

  return (
    <View style={styles.paletteWrapper}>
      {/* Clipped palette container — grid + masked mesh stack here */}
      <View
        collapsable={false}
        onLayout={handlePaletteLayout}
        style={styles.palette}
        {...panResponder.panHandlers}
      >
        {/* Layer 1: solid emotion grid, always present beneath the mesh */}
        <EmotionGridLayer emotionGrid={emotionGrid} />

        {/* Layer 2: mesh gradient overlay, with optional circular cutout
            at the cursor position to reveal the grid beneath. */}
        <Svg
          width={PALETTE_ACTUAL}
          height={PALETTE_ACTUAL}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Defs>
            <RadialGradient id="tl" cx="0%" cy="0%" r="75%">
              <Stop offset="0%" stopColor={quadrantColors.topLeft} stopOpacity={0.9} />
              <Stop offset="40%" stopColor={quadrantColors.topLeft} stopOpacity={0.5} />
              <Stop offset="70%" stopColor={quadrantColors.topLeft} stopOpacity={0.2} />
              <Stop offset="100%" stopColor={BASE_BG} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="tr" cx="100%" cy="0%" r="75%">
              <Stop offset="0%" stopColor={quadrantColors.topRight} stopOpacity={0.9} />
              <Stop offset="40%" stopColor={quadrantColors.topRight} stopOpacity={0.5} />
              <Stop offset="70%" stopColor={quadrantColors.topRight} stopOpacity={0.2} />
              <Stop offset="100%" stopColor={BASE_BG} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="bl" cx="0%" cy="100%" r="75%">
              <Stop offset="0%" stopColor={quadrantColors.bottomLeft} stopOpacity={0.9} />
              <Stop offset="40%" stopColor={quadrantColors.bottomLeft} stopOpacity={0.5} />
              <Stop offset="70%" stopColor={quadrantColors.bottomLeft} stopOpacity={0.2} />
              <Stop offset="100%" stopColor={BASE_BG} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="br" cx="100%" cy="100%" r="75%">
              <Stop offset="0%" stopColor={quadrantColors.bottomRight} stopOpacity={0.9} />
              <Stop offset="40%" stopColor={quadrantColors.bottomRight} stopOpacity={0.5} />
              <Stop offset="70%" stopColor={quadrantColors.bottomRight} stopOpacity={0.2} />
              <Stop offset="100%" stopColor={BASE_BG} stopOpacity={0} />
            </RadialGradient>

            {/* Mask: white = mesh visible, black = grid shows through.
                Two concentric circles fake a soft edge: inner = fully
                cut out, outer = half-cut (gray feather). */}
            {cursorPos && (
              <Mask id="lensCutout">
                <Rect width="100%" height="100%" fill="white" />
                <Circle
                  cx={cursorPos.x}
                  cy={cursorPos.y}
                  r={maskOuterR}
                  fill="rgb(128,128,128)"
                />
                <Circle
                  cx={cursorPos.x}
                  cy={cursorPos.y}
                  r={maskInnerR}
                  fill="black"
                />
              </Mask>
            )}
          </Defs>

          <G mask={cursorPos ? 'url(#lensCutout)' : undefined}>
            {/* BASE_BG sits in the grid layer too, but covering it here keeps
                the mesh look identical to the pre-grid version when no
                lens is active. */}
            <Rect width="100%" height="100%" fill={BASE_BG} />
            <Rect width="100%" height="100%" fill="url(#tl)" />
            <Rect width="100%" height="100%" fill="url(#tr)" />
            <Rect width="100%" height="100%" fill="url(#bl)" />
            <Rect width="100%" height="100%" fill="url(#br)" />
          </G>
        </Svg>

        {/* Layer 3: the lens visual — a translucent ring sized to one tile.
            The hole is already cut in the mesh by the SVG mask; this is
            just the glassy border + tiny centre dot on top. */}
        {cursorPos && (
          <>
            <View
              pointerEvents="none"
              style={[
                styles.lensHalo,
                {
                  left: cursorPos.x - (LENS_SIZE + 12) / 2,
                  top: cursorPos.y - (LENS_SIZE + 12) / 2,
                  width: LENS_SIZE + 12,
                  height: LENS_SIZE + 12,
                },
              ]}
            />
            <View
              pointerEvents="none"
              style={[
                styles.lens,
                {
                  left: cursorPos.x - LENS_SIZE / 2,
                  top: cursorPos.y - LENS_SIZE / 2,
                  width: LENS_SIZE,
                  height: LENS_SIZE,
                  transform: [{ scale: isDragging ? 1.06 : 1 }],
                  borderColor: isDragging
                    ? 'rgba(255,255,255,0.7)'
                    : 'rgba(255,255,255,0.5)',
                },
              ]}
            >
              <View style={styles.lensDot} />
            </View>
          </>
        )}
      </View>

      {/* Axis labels rendered after palette so they sit on top */}
      <Text style={[styles.axisLabel, styles.axisTop]} pointerEvents="none">High Energy</Text>
      <Text style={[styles.axisLabel, styles.axisBottom]} pointerEvents="none">Low Energy</Text>
      <Text style={[styles.axisLabel, styles.axisLeft]} pointerEvents="none">Unpleasant</Text>
      <Text style={[styles.axisLabel, styles.axisRight]} pointerEvents="none">Pleasant</Text>

      {children}
    </View>
  );
}

const AXIS_FONT_SIZE = fontSizes.md;

const styles = StyleSheet.create({
  paletteWrapper: {
    position: 'relative',
    width: PALETTE_ACTUAL,
    height: PALETTE_ACTUAL,
    alignSelf: 'center',
    overflow: 'visible',
  },
  palette: {
    width: PALETTE_ACTUAL,
    height: PALETTE_ACTUAL,
    borderRadius: borderRadius.xl + 16,
    overflow: 'hidden',
  },
  axisLabel: {
    position: 'absolute',
    fontSize: AXIS_FONT_SIZE,
    fontFamily: fonts.bodySemiBold,
    color: 'rgba(0,0,0,0.45)',
    zIndex: 2,
  },
  axisTop: { top: 12, left: 0, right: 0, textAlign: 'center' },
  axisBottom: { bottom: 12, left: 0, right: 0, textAlign: 'center' },
  axisLeft: { left: 12, top: '50%', marginTop: -8 },
  axisRight: { right: 12, top: '50%', marginTop: -8 },

  lensHalo: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  lens: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  lensDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

const gridStyles = StyleSheet.create({
  container: {
    width: PALETTE_ACTUAL,
    height: PALETTE_ACTUAL,
    backgroundColor: BASE_BG,
  },
  cell: {
    position: 'absolute',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  subDivider: {
    ...StyleSheet.absoluteFillObject,
  },
  subDividerH: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  subDividerV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  cellLabel: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    textAlign: 'center',
    paddingHorizontal: 4,
    lineHeight: 16,
  },
});
