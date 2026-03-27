import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Svg, { Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { MappedEmotion } from '../../hooks/useEmotionStates';
import { XanoStateCoordinate } from '../../api';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../theme';

function lightenColor(hex: string, amount: number): string {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgb(${Math.min(255, Math.round(r + (255 - r) * amount))}, ${Math.min(255, Math.round(g + (255 - g) * amount))}, ${Math.min(255, Math.round(b + (255 - b) * amount))})`;
}

const GRID_SIZE = 8;

interface SelectedCell {
    coordinate: XanoStateCoordinate;
    emotion: MappedEmotion;
}

/* ─── Touch Grid ────────────────────────────────────────────────────────────── */

interface CheckInTouchGridProps {
    coordinates: XanoStateCoordinate[];
    emotions: MappedEmotion[];
    selectedId: number | null;
    onSelect: (cell: SelectedCell) => void;
}

export function CheckInTouchGrid({ coordinates, emotions, selectedId, onSelect }: CheckInTouchGridProps) {
    const emotionMap = useMemo(() => {
        const map: Record<number, MappedEmotion> = {};
        emotions.forEach((e) => { map[e.xanoId] = e; });
        return map;
    }, [emotions]);

    const grid = useMemo(() => {
        const cells: (SelectedCell | null)[][] = Array.from({ length: GRID_SIZE }, () =>
            Array(GRID_SIZE).fill(null)
        );

        const groups: Record<number, XanoStateCoordinate[]> = {};
        for (const coord of coordinates) {
            if (!groups[coord.emotion_states_id]) groups[coord.emotion_states_id] = [];
            groups[coord.emotion_states_id].push(coord);
        }

        const subPositions = [[0, 0], [0, 1], [1, 0], [1, 1]];
        for (const [emotionId, coords] of Object.entries(groups)) {
            const emotion = emotionMap[Number(emotionId)];
            if (!emotion) continue;
            const sorted = [...coords].sort((a, b) => a.id - b.id);
            sorted.forEach((coord, i) => {
                if (i >= 4) return;
                const [dr, dc] = subPositions[i];
                const row = emotion.row * 2 + dr;
                const col = emotion.col * 2 + dc;
                if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
                    cells[row][col] = { coordinate: coord, emotion };
                }
            });
        }

        return cells;
    }, [coordinates, emotionMap]);

    const handlePress = useCallback((cell: SelectedCell) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect(cell);
    }, [onSelect]);

    return (
        <View style={gridStyles.touchGrid} pointerEvents="box-none">
            {grid.map((rowCells, rowIdx) => (
                <View key={rowIdx} style={gridStyles.touchRow}>
                    {rowCells.map((cell, colIdx) => (
                        <TouchableOpacity
                            key={colIdx}
                            style={[
                                gridStyles.touchCell,
                                selectedId != null && cell?.coordinate.id === selectedId && gridStyles.touchCellSelected,
                            ]}
                            onPress={cell ? () => handlePress(cell) : undefined}
                            disabled={!cell}
                            activeOpacity={0.9}
                        />
                    ))}
                </View>
            ))}
        </View>
    );
}

const gridStyles = StyleSheet.create({
    touchGrid: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 5,
    },
    touchRow: {
        flex: 1,
        flexDirection: 'row',
    },
    touchCell: {
        flex: 1,
    },
    touchCellSelected: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 16,
    },
});

/* ─── Confirmation Modal ────────────────────────────────────────────────────── */

interface CheckInConfirmModalProps {
    emotion: MappedEmotion;
    onConfirm: () => void;
    onCancel: () => void;
}

export function CheckInConfirmModal({ emotion, onConfirm, onCancel }: CheckInConfirmModalProps) {
    const displayName = emotion.name.charAt(0).toUpperCase() + emotion.name.slice(1).toLowerCase();
    const emotionColour = emotion.emotionColour || emotion.color;
    const themeColour = emotion.themeColour || emotionColour;

    // Shine — gentle brightness pulse on the gradient text
    const shineAnim = useRef(new Animated.Value(0)).current;
    const [shineLift, setShineLift] = useState(0);

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.delay(1500),
                Animated.timing(shineAnim, { toValue: 1, duration: 600, useNativeDriver: false }),
                Animated.timing(shineAnim, { toValue: 0, duration: 600, useNativeDriver: false }),
            ])
        );
        loop.start();
        const id = shineAnim.addListener(({ value }) => setShineLift(value));
        return () => { loop.stop(); shineAnim.removeListener(id); };
    }, [shineAnim]);

    const gradStart = shineLift > 0 ? lightenColor(themeColour, shineLift * 0.35) : themeColour;
    const gradEnd = shineLift > 0 ? lightenColor(emotionColour, shineLift * 0.35) : emotionColour;

    const handleConfirm = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onConfirm();
    };

    return (
        <TouchableOpacity
            style={modalStyles.backdrop}
            activeOpacity={1}
            onPress={onCancel}
        >
            <View style={modalStyles.modal} onStartShouldSetResponder={() => true}>
                <Text style={modalStyles.prompt}>Do you want to check in as</Text>
                <Svg height={30} width={(displayName.length + 1) * 15} style={modalStyles.emotionSvg}>
                    <Defs>
                        <SvgLinearGradient id="confirmGrad" x1="0" y1="0" x2="1" y2="0">
                            <Stop offset="0" stopColor={gradStart} />
                            <Stop offset="1" stopColor={gradEnd} />
                        </SvgLinearGradient>
                    </Defs>
                    <SvgText
                        fill="url(#confirmGrad)"
                        fontSize={22}
                        fontWeight="900"
                        fontFamily={fonts.bodyBold}
                        y={22}
                        x={(displayName.length + 1) * 15 / 2}
                        textAnchor="middle"
                    >
                        {displayName}?
                    </SvgText>
                </Svg>

                <View style={modalStyles.actions}>
                    <TouchableOpacity
                        style={modalStyles.confirmButton}
                        onPress={handleConfirm}
                        activeOpacity={0.7}
                    >
                        <Text style={modalStyles.confirmText}>Check In</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onCancel}
                        activeOpacity={0.7}
                        style={modalStyles.cancelButton}
                    >
                        <Text style={modalStyles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const modalStyles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    modal: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        paddingTop: spacing['2xl'],
        paddingBottom: spacing.xl,
        paddingHorizontal: spacing.xl,
        alignItems: 'center',
        width: '90%',
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    prompt: {
        fontFamily: fonts.heading,
        fontSize: fontSizes.xl,
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    emotionSvg: {
        marginBottom: spacing.xl,
    },
    actions: {
        alignItems: 'stretch',
        gap: spacing.sm,
        width: '100%',
    },
    confirmButton: {
        paddingVertical: spacing.md,
        borderRadius: borderRadius.button,
        backgroundColor: colors.primary,
        alignItems: 'center',
    },
    confirmText: {
        fontFamily: fonts.bodyBold,
        fontSize: fontSizes.base,
        color: colors.textOnPrimary,
    },
    cancelButton: {
        paddingVertical: spacing.sm,
        alignItems: 'center',
    },
    cancelText: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.md,
        color: colors.textMuted,
    },
});

/* ─── Legacy default export (kept for barrel) ───────────────────────────────── */
export default CheckInTouchGrid;
