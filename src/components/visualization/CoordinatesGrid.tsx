import React from 'react';
import { View, Pressable, Text } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, { 
  ZoomIn,
} from 'react-native-reanimated';
import AnimatedMarker from './AnimatedMarker';
import { fontSizes } from '../../theme';

interface DensityPoint {
  row: number;
  col: number;
  intensity: number; // 0 to 1
  count?: number;
}

interface PairPoint {
  row: number;
  col: number;
  initials: string;
  isCurrentUser?: boolean;
}

interface CoordinatesGridProps {
  /** Callback for when a specific coordinate is selected */
  onSelectCoordinate?: (row: number, col: number) => void;
  /** Current active coordinates [row, col] for 'solo' mode */
  activeCoordinates?: [number, number] | null;
  /** Visualization mode determines how points are rendered */
  visualizationMode?: 'solo' | 'pair' | 'group' | 'interactive';
  /** Data for 'group' density visualization */
  densityData?: DensityPoint[];
  /** Data for 'pair' comparison visualization */
  pairData?: PairPoint[];
  /** Optional theme colors */
  accentColor?: string;
}

/**
 * An 8x8 transparent overlay grid for high-precision emotion mapping.
 * Fits perfectly over the 4x4 PulseGrid.
 */
export default React.memo(function CoordinatesGrid({
  onSelectCoordinate,
  activeCoordinates,
  visualizationMode = 'interactive',
  densityData = [],
  pairData = [],
  accentColor = '#6366f1', // indigo-500
}: CoordinatesGridProps) {
  const rows = [0, 1, 2, 3, 4, 5, 6, 7];
  const cols = [0, 1, 2, 3, 4, 5, 6, 7];

  const renderSoloMarker = (r: number, c: number) => {
    const isActive = activeCoordinates?.[0] === r && activeCoordinates?.[1] === c;
    if (!isActive) return null;

    return (
      <View className="absolute inset-0 items-center justify-center pointer-events-none">
        <AnimatedMarker accentColor={accentColor} />
      </View>
    );
  };

  const renderDensityPoint = (r: number, c: number) => {
    const point = densityData.find(p => p.row === r && p.col === c);
    if (!point || point.intensity <= 0) return null;

    // Scale orb size relative to intensity: low(~50%) → mid(~75%) → high(100%)
    const sizeScale = 0.5 + point.intensity * 0.5; // 0.5 to 1.0
    const glowSize = `${Math.round(160 * sizeScale)}%`;
    const coreSize = `${Math.round(120 * sizeScale)}%`;
    const coreRadius = 18 * (0.5 + point.intensity * 0.5);
    const showCount = (point.count ?? 0) > 0;

    return (
      <View className="absolute inset-0 items-center justify-center pointer-events-none">
        {/* Outer glow */}
        <Svg height={glowSize} width={glowSize} viewBox="0 0 40 40" style={{ position: 'absolute' }}>
          <Defs>
            <RadialGradient id={`glow-${r}-${c}`} cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#A855F7" stopOpacity={0.6 * point.intensity} />
              <Stop offset="50%" stopColor="#7C3AED" stopOpacity={0.25 * point.intensity} />
              <Stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="20" cy="20" r={19} fill={`url(#glow-${r}-${c})`} />
        </Svg>
        {/* Solid core circle */}
        <Svg height={coreSize} width={coreSize} viewBox="0 0 40 40" style={{ position: 'absolute' }}>
          <Defs>
            <RadialGradient id={`core-${r}-${c}`} cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#C084FC" stopOpacity={0.85 * point.intensity} />
              <Stop offset="70%" stopColor="#A855F7" stopOpacity={0.7 * point.intensity} />
              <Stop offset="100%" stopColor="#7C3AED" stopOpacity={0.4 * point.intensity} />
            </RadialGradient>
          </Defs>
          <Circle cx="20" cy="20" r={coreRadius} fill={`url(#core-${r}-${c})`} />
        </Svg>
        {/* Count label */}
        {showCount && (
          <Text style={{
            color: '#fff',
            fontSize: fontSizes.sm,
            fontWeight: '700',
            textAlign: 'center',
          }}>
            {point.count}
          </Text>
        )}
      </View>
    );
  };

  const renderPairMarkers = (r: number, c: number) => {
    const points = pairData.filter(p => p.row === r && p.col === c);
    if (points.length === 0) return null;

    return (
      <View className="flex-row items-center justify-center pointer-events-none">
        <View className="flex-row -space-x-3">
          {points.map((p, idx) => (
            <Animated.View
              key={`${p.initials}-${idx}`}
              entering={ZoomIn}
              className={`w-8 h-8 rounded-full items-center justify-center border-2 shadow-lg ${
                p.isCurrentUser ? 'bg-indigo-600 border-white' : 'bg-white border-rose-500'
              }`}
              style={{
                zIndex: p.isCurrentUser ? 10 : points.length - idx,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 5,
              }}
            >
              <Text className={`text-[10px] font-bold uppercase tracking-tighter ${
                p.isCurrentUser ? 'text-white' : 'text-rose-600'
              }`}>
                {p.initials}
              </Text>
            </Animated.View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View className="absolute inset-x-0 inset-y-0 z-10 flex-col overflow-hidden">
      {rows.map((row) => (
        <View key={`row-${row}`} className="flex-row flex-1">
          {cols.map((col) => {
            const isInteractive = visualizationMode === 'interactive' || visualizationMode === 'solo';

            return (
              <Pressable
                key={`cell-${row}-${col}`}
                onPress={() => isInteractive && onSelectCoordinate?.(row, col)}
                disabled={isInteractive === false}
                className="flex-1 items-center justify-center relative"
                style={{
                  borderRightWidth: col < 7 ? (col === 3 ? 1.5 : 0.5) : 0,
                  borderBottomWidth: row < 7 ? (row === 3 ? 1.5 : 0.5) : 0,
                  borderRightColor: col === 3 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                  borderBottomColor: row === 3 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                }}
              >
                {/* Visual Layers */}
                {(visualizationMode === 'solo' || visualizationMode === 'interactive') && renderSoloMarker(row, col)}
                {visualizationMode === 'group' && renderDensityPoint(row, col)}
                {visualizationMode === 'pair' && renderPairMarkers(row, col)}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
});


