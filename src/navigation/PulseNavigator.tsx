import React, { useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { Plus } from 'lucide-react-native';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { useSafeEdges } from '../contexts/MHFRContext';

import MyPairsScreen from '../screens/MyPairsScreen/MyPairsScreen';
import GroupsScreen from '../screens/GroupsScreen/GroupsScreen';
import GlobalPulseScreen from '../screens/GlobalPulseScreen/GlobalPulseScreen';

export type PulseTabParamList = {
    MyPairs: undefined;
    Groups: undefined;
    GlobalPulse: undefined;
};

const TABS = [
    { key: 'MyPairs', label: 'Pairs' },
    { key: 'Groups', label: 'Groups' },
    { key: 'GlobalPulse', label: 'Global' },
] as const;

const Tab = createMaterialTopTabNavigator<PulseTabParamList>();

// ─── Segmented Control ───────────────────────────────────────────────
function SegmentedControl({
    activeIndex,
    onPress,
}: {
    activeIndex: number;
    onPress: (index: number) => void;
}) {
    const segmentWidth = useSharedValue(0);
    const translateX = useSharedValue(0);

    // Sync highlight when activeIndex changes (e.g. from swipe)
    React.useEffect(() => {
        if (segmentWidth.value > 0) {
            translateX.value = withTiming(activeIndex * segmentWidth.value, {
                duration: 180,
                easing: Easing.out(Easing.cubic),
            });
        }
    }, [activeIndex]);

    const onLayout = useCallback((e: LayoutChangeEvent) => {
        const w = e.nativeEvent.layout.width / TABS.length;
        segmentWidth.value = w;
        translateX.value = activeIndex * w;
    }, []);

    const highlightStyle = useAnimatedStyle(() => ({
        width: segmentWidth.value,
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <View style={styles.segmentContainer} onLayout={onLayout}>
            <Animated.View style={[styles.segmentHighlight, highlightStyle]} />
            {TABS.map((tab, i) => (
                <TouchableOpacity
                    key={tab.key}
                    style={styles.segment}
                    onPress={() => onPress(i)}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            styles.segmentLabel,
                            i === activeIndex && styles.segmentLabelActive,
                        ]}
                    >
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

// ─── Main navigator ──────────────────────────────────────────────────
export default function PulseNavigator() {
    const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [activeIndex, setActiveIndex] = React.useState(0);
    const tabNavRef = useRef<any>(null);
    const safeEdges = useSafeEdges(['top']);

    // Contextual action button config
    const actions = [
        { label: 'Invite', onPress: () => rootNav.navigate('InvitePairIntro') },
        { label: 'Create', onPress: () => rootNav.navigate('CreateGroup') },
        null, // Global — no action
    ];
    const action = actions[activeIndex];

    const handleSegmentPress = useCallback((index: number) => {
        setActiveIndex(index);
        const route = TABS[index].key;
        tabNavRef.current?.jumpTo(route);
    }, []);

    return (
        <SafeAreaView style={styles.container} edges={safeEdges}>
            {/* Unified header */}
            <View style={styles.header}>
                <Text style={styles.title}>Pulse</Text>
                {action && (
                    <TouchableOpacity style={styles.actionButton} onPress={action.onPress}>
                        <Plus color={colors.textSecondary} size={18} strokeWidth={2.5} />
                        <Text style={styles.actionText}>{action.label}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Segmented control */}
            <View style={styles.segmentRow}>
                <SegmentedControl activeIndex={activeIndex} onPress={handleSegmentPress} />
            </View>

            {/* Tab views (hidden tab bar, swipe enabled) */}
            <Tab.Navigator
                id="PulseTabs"
                tabBar={({ navigation: tabNav }) => {
                    tabNavRef.current = tabNav;
                    return null;
                }}
                screenOptions={{
                    swipeEnabled: true,
                    lazy: true,
                }}
                screenListeners={{
                    state: (e: any) => {
                        const index = e.data?.state?.index;
                        if (index !== undefined && index !== activeIndex) {
                            setActiveIndex(index);
                        }
                    },
                }}
            >
                <Tab.Screen name="MyPairs" component={MyPairsScreen} />
                <Tab.Screen name="Groups" component={GroupsScreen} />
                <Tab.Screen name="GlobalPulse" component={GlobalPulseScreen} />
            </Tab.Navigator>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.base,
        paddingTop: spacing.base,
        paddingBottom: spacing.sm,
    },
    title: {
        fontSize: fontSizes['3xl'],
        fontFamily: fonts.heading,
        color: colors.textPrimary,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.base,
        color: colors.textSecondary,
    },

    // ── Segmented control ──
    segmentRow: {
        paddingHorizontal: spacing.base,
        paddingBottom: spacing.md,
    },
    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: colors.surfaceMuted,
        borderRadius: borderRadius.full,
        padding: 3,
        position: 'relative',
    },
    segmentHighlight: {
        position: 'absolute',
        top: 3,
        bottom: 3,
        left: 3,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.full,
    },
    segment: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    segmentLabel: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.base,
        color: colors.textSecondary,
    },
    segmentLabelActive: {
        color: colors.textOnPrimary,
    },
});
