import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import Svg, { Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { MappedEmotion } from '../../hooks/useEmotionStates';
import { XanoStateCoordinate } from '../../api';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../theme';
import Avatar from '../Avatar';

function lightenColor(hex: string, amount: number): string {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgb(${Math.min(255, Math.round(r + (255 - r) * amount))}, ${Math.min(255, Math.round(g + (255 - g) * amount))}, ${Math.min(255, Math.round(b + (255 - b) * amount))})`;
}

const GRID_SIZE = 8;

export interface SelectedCell {
    coordinate: XanoStateCoordinate;
    emotion: MappedEmotion;
}

/* ─── Touch Grid ────────────────────────────────────────────────────────────── */

interface CheckInTouchGridProps {
    coordinates: XanoStateCoordinate[];
    emotions: MappedEmotion[];
    selectedId: number | null;
    onSelect: (cell: SelectedCell) => void;
    /** Current user's avatar — rendered as the "pin" that drops onto the
     *  tapped tile to confirm the selection before the screen advances. */
    avatarSource?: string;
    avatarName?: string;
    avatarHex?: string;
}

// How long the avatar pin animates + holds on the tapped tile before we
// advance to the emotion-detail step. Short — the detail card is the real
// "before you commit" pause; this is just the selection flourish.
const PIN_DROP_MS = 600;

export function CheckInTouchGrid({ coordinates, emotions, selectedId, onSelect, avatarSource, avatarName, avatarHex }: CheckInTouchGridProps) {
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
            const sorted = [...coords].sort((a, b) => (a.order_meta ?? 0) - (b.order_meta ?? 0));
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

    // Pixel size of the grid, captured on layout so we can place the pin at
    // the centre of any tapped cell (cells are flex:1, so cell = grid / 8).
    const [gridSize, setGridSize] = useState({ w: 0, h: 0 });
    // The tile the user just tapped, with its computed pin geometry. Set this
    // and the drop animation runs; cleared only by unmount / a fresh mount.
    const [dropped, setDropped] = useState<{ cell: SelectedCell; cx: number; cy: number; pinSize: number } | null>(null);
    // The tile currently under the finger — highlights immediately on press so
    // the user sees which quadrant they're on, before the avatar even drops.
    const [pressedId, setPressedId] = useState<number | null>(null);
    const lockRef = useRef(false);
    const dropAnim = useRef(new Animated.Value(0)).current;
    // `onSelect` is an inline arrow from the parent, so its identity changes
    // every render. Hold it in a ref so the drop effect can fire exactly once
    // (keyed only on `dropped`) without a mid-hold parent re-render resetting
    // the animation or the advance timer.
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;

    const handlePress = useCallback((cell: SelectedCell, row: number, col: number) => {
        if (lockRef.current) return;
        lockRef.current = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // No layout yet (shouldn't happen post-paint) — skip the flourish
        // rather than risk a NaN-positioned pin.
        if (!gridSize.w || !gridSize.h) {
            onSelectRef.current(cell);
            return;
        }

        const cellW = gridSize.w / GRID_SIZE;
        const cellH = gridSize.h / GRID_SIZE;
        const cx = (col + 0.5) * cellW;
        const cy = (row + 0.5) * cellH;
        const pinSize = Math.min(Math.max(cellW * 1.15, 34), 60);
        setDropped({ cell, cx, cy, pinSize });
    }, [gridSize]);

    // Run the drop once a tile is chosen, then advance after the hold.
    useEffect(() => {
        if (!dropped) return;
        dropAnim.setValue(0);
        Animated.spring(dropAnim, {
            toValue: 1,
            tension: 70,
            friction: 6,
            useNativeDriver: true,
        }).start();
        const t = setTimeout(() => onSelectRef.current(dropped.cell), PIN_DROP_MS);
        return () => clearTimeout(t);
    }, [dropped, dropAnim]);

    const droppedId = dropped?.cell.coordinate.id ?? null;

    return (
        <View
            style={gridStyles.touchGrid}
            pointerEvents={dropped ? 'none' : 'box-none'}
            onLayout={(e) => setGridSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        >
            {grid.map((rowCells, rowIdx) => (
                <View key={rowIdx} style={gridStyles.touchRow}>
                    {rowCells.map((cell, colIdx) => {
                        if (!cell) {
                            return (
                                <TouchableOpacity
                                    key={colIdx}
                                    style={gridStyles.touchCell}
                                    disabled
                                    accessible={false}
                                />
                            );
                        }
                        // Map the 8×8 grid back to the 4×4 circumplex so
                        // VoiceOver users get quadrant context along with
                        // the specific coordinate name.
                        const energy = rowIdx <= 3 ? 'high energy' : 'low energy';
                        const pleasantness = colIdx <= 3 ? 'unpleasant' : 'pleasant';
                        const coordName = cell.coordinate.coordinateDisplay || cell.emotion.name;
                        const a11yLabel = `${coordName}, ${cell.emotion.name}, ${energy}, ${pleasantness}`;
                        const isSelected =
                            (selectedId != null && cell.coordinate.id === selectedId) ||
                            cell.coordinate.id === droppedId ||
                            cell.coordinate.id === pressedId;
                        return (
                            <TouchableOpacity
                                key={colIdx}
                                style={[
                                    gridStyles.touchCell,
                                    isSelected && gridStyles.touchCellSelected,
                                ]}
                                onPressIn={() => { if (!lockRef.current) setPressedId(cell.coordinate.id); }}
                                onPressOut={() => { if (!lockRef.current) setPressedId(null); }}
                                onPress={() => handlePress(cell, rowIdx, colIdx)}
                                activeOpacity={0.9}
                                accessibilityRole="button"
                                accessibilityLabel={a11yLabel}
                                accessibilityHint="Double tap to select this feeling"
                                accessibilityState={{ selected: isSelected }}
                            />
                        );
                    })}
                </View>
            ))}

            {/* Avatar "pin" that drops onto the tapped tile for ~1s before the
             *  screen advances, so the user sees exactly what they picked. */}
            {dropped && (
                <Animated.View
                    pointerEvents="none"
                    style={[
                        gridStyles.pin,
                        {
                            width: dropped.pinSize,
                            height: dropped.pinSize,
                            left: dropped.cx - dropped.pinSize / 2,
                            top: dropped.cy - dropped.pinSize / 2,
                            opacity: dropAnim.interpolate({
                                inputRange: [0, 0.25, 1],
                                outputRange: [0, 1, 1],
                            }),
                            transform: [
                                {
                                    translateY: dropAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-(dropped.cy + dropped.pinSize / 2), 0],
                                    }),
                                },
                                {
                                    scale: dropAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.6, 1],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    <Avatar
                        source={avatarSource}
                        name={avatarName}
                        hexColour={avatarHex}
                        size={dropped.pinSize}
                        border={{ width: 2.5, color: colors.surface }}
                        shadow="md"
                        decorative
                    />
                </Animated.View>
            )}
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
    pin: {
        position: 'absolute',
        zIndex: 10,
    },
});

/* ─── Confirmation Modal ────────────────────────────────────────────────────── */

interface CheckInConfirmModalProps {
    emotion: MappedEmotion;
    onConfirm: () => void;
    onCancel: () => void;
    /** When true, disables actions and shows a spinner on the confirm button.
     *  Used by the support-request quick check-in path while awaiting the
     *  check-in + SR creation round-trip. */
    isSubmitting?: boolean;
}

export function CheckInConfirmModal({ emotion, onConfirm, onCancel, isSubmitting = false }: CheckInConfirmModalProps) {
    const displayName = emotion.name.charAt(0).toUpperCase() + emotion.name.slice(1).toLowerCase();
    const emotionColour = emotion.emotionColour || emotion.color;
    const themeColour = emotion.themeColour || emotionColour;

    // Entrance animation — backdrop fades, card scales up
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const cardScale = useRef(new Animated.Value(0.9)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            // Backdrop fades in
            Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            // Card scales up + fades in together
            Animated.parallel([
                Animated.spring(cardScale, { toValue: 1, tension: 65, friction: 8, useNativeDriver: true }),
                Animated.timing(cardOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
            ]),
        ]).start();
    }, [backdropOpacity, cardScale, cardOpacity]);

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
        if (isSubmitting) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onConfirm();
    };

    return (
        <Modal visible transparent animationType="none" onRequestClose={isSubmitting ? () => {} : onCancel}>
            <Animated.View style={[modalStyles.backdrop, { opacity: backdropOpacity }]}>
                <TouchableOpacity
                    style={modalStyles.backdropTouch}
                    activeOpacity={1}
                    onPress={isSubmitting ? undefined : onCancel}
                />
            </Animated.View>
            <View style={modalStyles.contentWrap} pointerEvents="box-none">
                <Animated.View
                    style={[modalStyles.modal, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}
                    onStartShouldSetResponder={() => true}
                >
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
                            style={[modalStyles.confirmButton, isSubmitting && modalStyles.confirmButtonDisabled]}
                            onPress={handleConfirm}
                            activeOpacity={0.7}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color={colors.textOnPrimary} />
                            ) : (
                                <Text style={modalStyles.confirmText}>Check In</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onCancel}
                            activeOpacity={0.7}
                            style={modalStyles.cancelButton}
                            disabled={isSubmitting}
                        >
                            <Text style={[modalStyles.cancelText, isSubmitting && modalStyles.cancelTextDisabled]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const modalStyles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.overlay,
    },
    backdropTouch: {
        flex: 1,
    },
    contentWrap: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
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
    confirmButtonDisabled: {
        opacity: 0.7,
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
    cancelTextDisabled: {
        opacity: 0.5,
    },
});

/* ─── Legacy default export (kept for barrel) ───────────────────────────────── */
export default CheckInTouchGrid;
