import React, { useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { fonts, fontSizes, borderRadius } from '../../../theme';
import { PALETTE_ACTUAL, CURSOR_SIZE, BASE_BG } from './meshGradientUtils';

interface QuadrantColors {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
}

interface MeshGradientPaletteProps {
  cursorPos: { x: number; y: number } | null;
  isDragging: boolean;
  quadrantColors: QuadrantColors;
  onTouchStart: (x: number, y: number) => void;
  onTouchMove: (x: number, y: number) => void;
  onTouchEnd: () => void;
  children?: React.ReactNode;
}

export default function MeshGradientPalette({
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
      }),
    []
  );

  return (
    <View style={styles.paletteWrapper}>
      {/* Clipped gradient palette */}
      <View
        collapsable={false}
        onLayout={handlePaletteLayout}
        style={styles.palette}
        {...panResponder.panHandlers}
      >
        <Svg
          width={PALETTE_ACTUAL}
          height={PALETTE_ACTUAL}
          style={StyleSheet.absoluteFill}
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
          </Defs>
          <Rect width="100%" height="100%" fill={BASE_BG} />
          <Rect width="100%" height="100%" fill="url(#tl)" />
          <Rect width="100%" height="100%" fill="url(#tr)" />
          <Rect width="100%" height="100%" fill="url(#bl)" />
          <Rect width="100%" height="100%" fill="url(#br)" />
        </Svg>

        {/* Cursor */}
        {cursorPos && (
          <View
            style={[
              styles.cursor,
              {
                left: cursorPos.x - CURSOR_SIZE / 2,
                top: cursorPos.y - CURSOR_SIZE / 2,
                transform: [{ scale: isDragging ? 1.2 : 1 }],
              },
            ]}
          >
            <View style={styles.cursorInner} />
          </View>
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
  axisTop: {
    top: 12,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  axisBottom: {
    bottom: 12,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  axisLeft: {
    left: 12,
    top: '50%',
    marginTop: -8,
  },
  axisRight: {
    right: 12,
    top: '50%',
    marginTop: -8,
  },
  cursor: {
    position: 'absolute',
    width: CURSOR_SIZE,
    height: CURSOR_SIZE,
    borderRadius: CURSOR_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cursorInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
});
