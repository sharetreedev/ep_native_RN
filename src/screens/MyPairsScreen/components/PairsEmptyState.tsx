import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Blend, X } from 'lucide-react-native';
import BottomSheet from '../../../components/BottomSheet';
import InfoSheet from '../../../components/InfoSheet';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../../theme';

/** Research-backed context behind pairing, shown by the "why this matters" link. */
const WHY_MATTERS_TITLE = 'Why the hand of support matters';
const WHY_MATTERS_BODY = [
    'Decades of research point to the same thing: a small number of genuine, trusted relationships is one of the strongest protectors of our mental health.',
    "It's not about having lots of people around you. It's about having a few who really know how you're doing, and who'd notice if something changed. That's what a pair is built to do.",
    "By staying connected to the people you trust, you're more likely to notice early when someone's struggling, including yourself, and to reach out before things get harder.",
    "On its own, an app can't replace real human support. What it can do is make staying connected easier, so the people who matter don't carry things alone.",
];

interface PairsEmptyStateProps {
    /** Enters the existing Create Pair Request flow at the pair-type selection screen. */
    onInvitePress: () => void;
}

/** Which screen of the empty-state onboarding flow is showing. */
type Step = 'hook' | 'reveal' | 'who';

/**
 * Empty Pairs onboarding (EP-1100).
 *
 * Shown only when the user has zero pairs. A three-screen curiosity-hook flow:
 *   1. Hook      — full empty state with a "What is it?" CTA
 *   2. Reveal    — modal explaining the "hand of support"
 *   3. Who       — modal on who to pair with, leading into create-pair
 *
 * Navigation between screens is local UI state only — no backend calls until
 * "Form a Pair" enters the existing Create Pair Request flow via onInvitePress.
 */
function PairsEmptyState({ onInvitePress }: PairsEmptyStateProps) {
    const [step, setStep] = useState<Step>('hook');
    const [whyMattersVisible, setWhyMattersVisible] = useState(false);

    const dismissToHook = () => setStep('hook');

    const handleFormPair = () => {
        // Reset local state before handing off so the flow restarts cleanly
        // if the user backs out of the create-pair flow and returns here.
        setStep('hook');
        onInvitePress();
    };

    const handleWhyMatters = () => setWhyMattersVisible(true);

    return (
        <View style={styles.container}>
            {/* Screen 1 — Hook (full empty state) */}
            <View style={styles.hookContainer}>
                <Blend color={colors.primary} size={48} style={styles.hookIcon} />
                <Text style={styles.hookHeading}>
                    The people who get the most from Emotional Pulse all do one thing differently.
                </Text>
                <Text style={styles.hookSub}>
                    It&apos;s what turns a good intention into a daily habit.
                </Text>
                <TouchableOpacity
                    style={[styles.primaryButton, styles.hookButton]}
                    onPress={() => setStep('reveal')}
                    accessibilityRole="button"
                    accessibilityLabel="What is it?"
                >
                    <Text style={styles.primaryButtonText}>What is it?</Text>
                </TouchableOpacity>
            </View>

            {/* Screen 2 — Reveal (modal) */}
            <BottomSheet
                visible={step === 'reveal'}
                onDismiss={dismissToHook}
                showHandle={false}
                scrollable
            >
                <ModalHeader onClose={dismissToHook} />
                <Text style={styles.modalHeading}>They have a hand of support.</Text>
                <Text style={styles.modalBody}>
                    They create a pair with the people they trust.
                </Text>
                <Text style={styles.modalBody}>
                    Pairing means you see how they&apos;re doing each time they check in, and they
                    see you.
                </Text>
                <Text style={styles.modalBody}>
                    Checking in stops being just about you. Reaching out for the conversations that
                    matter becomes second nature.
                </Text>
                <TouchableOpacity onPress={handleWhyMatters} accessibilityRole="link">
                    <Text style={styles.inlineLink}>Find out why this matters →</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.primaryButton, styles.modalPrimaryButton]}
                    onPress={() => setStep('who')}
                    accessibilityRole="button"
                    accessibilityLabel="Create my first pair"
                >
                    <Text style={styles.primaryButtonText}>Create my first pair &gt;</Text>
                </TouchableOpacity>
            </BottomSheet>

            {/* Screen 3 — Who should I pair with? (modal) */}
            <BottomSheet
                visible={step === 'who'}
                onDismiss={dismissToHook}
                showHandle={false}
                scrollable
            >
                <ModalHeader onClose={dismissToHook} />
                <Text style={styles.modalHeading}>Who should I pair with?</Text>
                <Text style={styles.modalBody}>
                    The people you turn to at home or at work, who you share what&apos;s really going
                    on with, who back you no matter what. Start with one of them.
                </Text>
                <Text style={styles.modalBody}>
                    They&apos;ll get Emotional Pulse free, and can pair with their own people too.
                </Text>
                <Text style={styles.modalBody}>
                    If you ever change your mind you can remove a pair, no questions asked.
                </Text>
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.secondaryButton, styles.rowButton]}
                        onPress={() => setStep('reveal')}
                        accessibilityRole="button"
                        accessibilityLabel="Back"
                    >
                        <Text style={styles.secondaryButtonText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.primaryButton, styles.rowButton]}
                        onPress={handleFormPair}
                        accessibilityRole="button"
                        accessibilityLabel="Form a Pair"
                    >
                        <Text style={styles.primaryButtonText}>Form a Pair &gt;</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

            {/* "Find out why this matters" popup — opened from the Reveal screen. */}
            <InfoSheet
                visible={whyMattersVisible}
                onDismiss={() => setWhyMattersVisible(false)}
                title={WHY_MATTERS_TITLE}
                body={WHY_MATTERS_BODY}
            />
        </View>
    );
}

/** Shared modal header: linked-rings icon with a close (X) in the top-right. */
function ModalHeader({ onClose }: { onClose: () => void }) {
    return (
        <View style={styles.modalHeader}>
            <Blend color={colors.primary} size={40} />
            <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <X color={colors.textMuted} size={24} />
            </TouchableOpacity>
        </View>
    );
}

export default PairsEmptyState;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // Screen 1 — Hook
    hookContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    hookIcon: {
        marginBottom: spacing.lg,
    },
    hookHeading: {
        fontFamily: fonts.heading,
        fontSize: fontSizes.xl,
        color: colors.darkForest,
        textAlign: 'center',
        lineHeight: 28,
    },
    hookSub: {
        fontFamily: fonts.body,
        fontSize: fontSizes.base,
        color: colors.darkForest,
        textAlign: 'center',
        marginTop: spacing.md,
        lineHeight: 22,
    },

    // Shared modal pieces
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.base,
    },
    closeButton: {
        padding: spacing.xs,
    },
    modalHeading: {
        fontFamily: fonts.heading,
        fontSize: fontSizes['2xl'],
        color: colors.darkForest,
        marginBottom: spacing.base,
    },
    modalBody: {
        fontFamily: fonts.body,
        fontSize: fontSizes.base,
        color: colors.textPrimary,
        lineHeight: 24,
        marginBottom: spacing.md,
    },
    inlineLink: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.base,
        color: colors.primary,
        marginTop: spacing.xs,
        marginBottom: spacing.lg,
    },

    // Buttons
    primaryButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.button,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        minHeight: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        fontSize: fontSizes.base,
        color: colors.textOnPrimary,
    },
    modalPrimaryButton: {
        marginTop: spacing.xs,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: borderRadius.button,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        minHeight: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        fontSize: fontSizes.base,
        color: colors.primary,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.xs,
    },
    rowButton: {
        flex: 1,
    },
    // Screen-1 hook CTA sits below the subline with breathing room.
    hookButton: {
        marginTop: spacing['2xl'],
        alignSelf: 'stretch',
    },
});
