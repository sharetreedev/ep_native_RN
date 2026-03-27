import React from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { X } from 'lucide-react-native';
import EmotionDetailView from '../../components/EmotionDetailView';
import { colors, spacing, borderRadius } from '../../theme';

type EmotionDetailScreenRouteProp = RouteProp<RootStackParamList, 'EmotionDetail'>;

export default function EmotionDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<EmotionDetailScreenRouteProp>();
    const { emotion } = route.params;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <ScrollView style={styles.scroll}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        style={styles.closeButton}
                        activeOpacity={0.7}
                    >
                        <X color={colors.textSecondary} size={24} />
                    </TouchableOpacity>
                </View>

                <EmotionDetailView emotion={emotion} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scroll: {
        flex: 1,
    },
    header: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        paddingBottom: spacing.base,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    closeButton: {
        padding: spacing.sm,
        backgroundColor: colors.surfaceMuted,
        borderRadius: borderRadius.full,
    },
});
