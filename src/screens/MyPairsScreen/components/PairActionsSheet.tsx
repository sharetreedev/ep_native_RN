import React from 'react';
import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback, Alert, StyleSheet } from 'react-native';
import { X, RefreshCw, Ban } from 'lucide-react-native';
import { colors, fonts, fontSizes, borderRadius } from '../../../theme';

interface PairActionsSheetProps {
    pair: any | null;
    onClose: () => void;
    onStopSharing: (pair: any) => void;
}

function PairActionsSheet({ pair, onClose, onStopSharing }: PairActionsSheetProps) {
    return (
        <Modal
            animationType="fade"
            transparent
            visible={!!pair}
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.sheetOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableWithoutFeedback>
                    <View style={styles.sheetCard}>
                        <View style={styles.sheetHandle} />
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>
                                {pair?.other_user?.fullName || pair?.other_user?.firstName || 'Pair'}
                            </Text>
                            <TouchableOpacity onPress={onClose} hitSlop={8}>
                                <X color={colors.textSecondary} size={20} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.sheetOption}
                            onPress={() => {
                                // TODO: implement pair type update request API
                                Alert.alert('Request Sent', 'A request to update the pair type has been sent.');
                                onClose();
                            }}
                        >
                            <RefreshCw color={colors.primary} size={20} />
                            <Text style={styles.sheetOptionText}>Request Pair Type Update</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.sheetOption}
                            onPress={() => onStopSharing(pair)}
                        >
                            <Ban color={colors.destructive} size={20} />
                            <Text style={[styles.sheetOptionText, { color: colors.destructive }]}>
                                Stop Sharing with {pair?.other_user?.firstName || pair?.other_user?.fullName?.split(' ')[0] || 'Pair'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableWithoutFeedback>
            </TouchableOpacity>
        </Modal>
    );
}

export default PairActionsSheet;

const styles = StyleSheet.create({
    sheetOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: colors.overlay,
    },
    sheetCard: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: borderRadius.lg,
        borderTopRightRadius: borderRadius.lg,
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 12,
    },
    sheetHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border,
        alignSelf: 'center',
        marginBottom: 16,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sheetTitle: {
        fontFamily: fonts.heading,
        fontSize: fontSizes.xl,
        color: colors.textPrimary,
    },
    sheetOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.borderLight,
    },
    sheetOptionText: {
        fontFamily: fonts.bodyMedium,
        fontSize: fontSizes.base,
        color: colors.textPrimary,
        marginLeft: 12,
    },
});
