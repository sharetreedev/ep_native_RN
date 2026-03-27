import React, { ReactNode } from 'react';
import { View, StyleSheet, LayoutChangeEvent, ViewStyle } from 'react-native';
import PulseGrid from './PulseGrid';
import CoordinatesGrid from './CoordinatesGrid';
import { Emotion } from '../../constants/emotions';

interface CircumplexGridProps {
    onEmotionLongPress?: (emotion: Emotion) => void;
    onCoordinatePress?: (x: number, y: number) => void;
    onEmotionPress?: (emotion: Emotion) => void;
    selectedEmotion?: Emotion | null;
    children?: ReactNode; // For additional visualization layers (density, topography, etc.)
    style?: ViewStyle;
    showCoordinatesOverlay?: boolean;
}

/**
 * CircumplexGrid coordinates the layering of the PulseGrid (emotional context)
 * and the CoordinatesGrid (interaction/selection layer), along with any
 * additional visualization layers.
 */
const CircumplexGrid: React.FC<CircumplexGridProps> = ({
    onEmotionLongPress,
    onCoordinatePress,
    onEmotionPress,
    selectedEmotion,
    children,
    style,
    showCoordinatesOverlay = true,
}) => {
    return (
        <View style={[styles.container, style]}>
            {/* Layer 1: Emotional Context (Grid squares) */}
            <PulseGrid
                onEmotionLongPress={onEmotionLongPress}
                onEmotionPress={onEmotionPress}
                selectedEmotion={selectedEmotion}
                isInteractive={!showCoordinatesOverlay} // If overlay is active, grid squares shouldn't catch touches directly
            />

            {/* Layer 2: Visualizations (Topography, Heatmaps, etc.) */}
            {children && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    {children}
                </View>
            )}

            {/* Layer 3: Interaction & High-Precision Selection */}
            {showCoordinatesOverlay && (
                <View style={StyleSheet.absoluteFill}>
                    <CoordinatesGrid
                        onSelectCoordinate={onCoordinatePress}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        aspectRatio: 1, // Keep it square
        width: '100%',
        position: 'relative',
    },
});

export default CircumplexGrid;
