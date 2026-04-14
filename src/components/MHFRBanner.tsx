import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TriangleAlert } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMHFR } from '../contexts/MHFRContext';
import { RootStackParamList } from '../types/navigation';
import { colors, fonts, fontSizes, spacing } from '../theme';

export default function MHFRBanner() {
    const { hasOpenMHFRRequest } = useMHFR();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const insets = useSafeAreaInsets();

    if (!hasOpenMHFRRequest) return null;

    return (
        <TouchableOpacity
            style={[styles.banner, { paddingTop: insets.top }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('SupportRequests', { initialTab: 'mhfr' })}
        >
            <TriangleAlert color={colors.textPrimary} size={18} strokeWidth={2.5} />
            <Text style={styles.text}>Support Requested</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    banner: {
        backgroundColor: colors.alert,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingBottom: 8,
    },
    text: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.base,
        color: colors.textPrimary,
        letterSpacing: 0.3,
    },
});
