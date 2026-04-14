import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Blend } from 'lucide-react-native';
import { colors, fonts, fontSizes, borderRadius } from '../../../theme';

interface PairsEmptyStateProps {
    onInvitePress: () => void;
}

function PairsEmptyState({ onInvitePress }: PairsEmptyStateProps) {
    return (
        <View style={styles.container}>
            <View style={styles.emptyStateContainer}>
                <View style={styles.emptyStateCard}>
                    <Blend color={colors.primary} size={48} style={styles.emptyStateIcon} />
                    <Text style={styles.emptyStateTitle}>Stay Connected</Text>
                    <Text style={styles.emptyStateSub}>
                        Build deeper support by inviting someone you trust
                    </Text>
                    <TouchableOpacity style={styles.emptyStateCta} onPress={onInvitePress}>
                        <Text style={styles.emptyStateCtaText}>+ Discover Pairing</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

export default PairsEmptyState;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    emptyStateCard: {
        backgroundColor: 'rgba(145, 162, 125, 0.25)',
        borderRadius: borderRadius.lg,
        paddingVertical: 40,
        paddingHorizontal: 32,
        alignItems: 'center',
        width: '100%',
    },
    emptyStateIcon: {
        marginBottom: 16,
    },
    emptyStateTitle: {
        fontFamily: fonts.heading,
        fontSize: fontSizes.xl,
        color: colors.darkForest,
        textAlign: 'center',
    },
    emptyStateSub: {
        fontFamily: fonts.body,
        fontSize: fontSizes.sm,
        color: colors.darkForest,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    emptyStateCta: {
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: borderRadius.button,
        paddingHorizontal: 24,
        paddingVertical: 12,
        marginTop: 24,
    },
    emptyStateCtaText: {
        fontFamily: fonts.bodyBold,
        fontWeight: '600',
        fontSize: fontSizes.md,
        color: colors.primary,
    },
});
