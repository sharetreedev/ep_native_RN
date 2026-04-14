import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Linking,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Phone, CircleCheck } from 'lucide-react-native';
import { RootStackParamList } from '../../types/navigation';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { users, XanoUser, supportRequests as xanoSupportRequests } from '../../api';
import Button from '../../components/Button';
import { logger } from '../../lib/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'CheckinSupportRequest'>;

type Step =
    | 'invitation'
    | 'support_options'
    | 'log_resolution'
    | 'notify_mhfr'
    | 'mhfr_confirmed'
    | 'follow_up';

const hotlines = [
    { name: 'Emergency Services', number: '000', description: 'For life-threatening emergencies' },
    { name: 'Lifeline', number: '13 11 14', description: '24/7 Crisis Support' },
    { name: 'Beyond Blue', number: '1300 22 4636', description: 'Depression and anxiety support' },
    { name: 'Kids Helpline', number: '1800 55 1800', description: 'Counseling for young people' },
];

const eapContacts = [
    { name: 'Corporate Health', number: '1300 123 456', description: 'Confidential employee support' },
];

function makeCall(phoneNumber: string) {
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(phoneUrl)
        .then((supported) => supported && Linking.openURL(phoneUrl))
        .catch((err) => logger.error(err));
}

/* ─── Contact Card ────────────────────────────────────────────────────────── */

function ContactCard({ name, description, number }: { name: string; description: string; number: string }) {
    return (
        <TouchableOpacity onPress={() => makeCall(number)} style={styles.card} activeOpacity={0.7}>
            <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{name}</Text>
                <Text style={styles.cardDesc}>{description}</Text>
                {number ? <Text style={styles.cardNumber}>{number}</Text> : null}
            </View>
            {number ? (
                <View style={styles.phoneIconWrap}>
                    <Phone color={colors.primary} size={20} />
                </View>
            ) : null}
        </TouchableOpacity>
    );
}

/* ─── Main Screen ─────────────────────────────────────────────────────────── */

export default function CheckinSupportRequestScreen({ route, navigation }: Props) {
    const { emotionName, supportRequestId } = route.params;
    const { user } = useAuth();
    const firstName = user?.firstName || 'there';

    const [step, setStep] = useState<Step>('invitation');
    const [mhfrContacts, setMhfrContacts] = useState<XanoUser[]>([]);
    const [loadingMhfr, setLoadingMhfr] = useState(true);

    const hasMhfr = !loadingMhfr && mhfrContacts.length > 0;

    useEffect(() => {
        users.getTop4Mhfr()
            .then((data) => setMhfrContacts(Array.isArray(data) ? data : []))
            .catch(() => {})
            .finally(() => setLoadingMhfr(false));
    }, []);

    const handleNotifyMhfr = useCallback(async () => {
        try {
            await xanoSupportRequests.patch(supportRequestId, {
                is_support_requested: true,
            });
        } catch (e) {
            logger.error('Failed to notify MHFR:', e);
        }
        setStep('mhfr_confirmed');
    }, [supportRequestId]);

    const handleScheduleCircleBack = useCallback(async () => {
        const checkbackTime = Date.now() + 30 * 60 * 1000;
        try {
            await xanoSupportRequests.patch(supportRequestId, {
                is_Checkback_Required: true,
                checkback_time: checkbackTime,
            });
        } catch (e) {
            logger.error('Failed to schedule circle-back:', e);
        }
        navigation.replace('DailyInsight');
    }, [supportRequestId, navigation]);

    const exitToDailyInsight = useCallback(() => {
        navigation.replace('DailyInsight');
    }, [navigation]);

    const navigateToSupportCheckIn = useCallback(() => {
        navigation.navigate('CheckIn', {
            isSupportRequest: true,
            supportRequestId,
        });
    }, [navigation, supportRequestId]);

    const pairs = user?.pairs ?? [];

    /* ─── Step Renderers ──────────────────────────────────────────────────── */

    const renderInvitation = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.heading}>Would you like to talk to someone?</Text>
            <Text style={styles.body}>
                Hey {firstName}, it seems like you're having a tough time. Would you like to call someone?
            </Text>
            <View style={styles.actions}>
                <Button title="Yes" onPress={() => setStep('support_options')} />
                <Button title="No, thanks" variant="secondary" onPress={() => setStep('notify_mhfr')} />
            </View>
        </View>
    );

    const renderSupportOptions = () => (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner}>
            <Text style={styles.heading}>Call Someone</Text>
            <Text style={styles.body}>
                Reach out to someone who can help.
            </Text>

            {/* MHFR Network — hidden when no contacts */}
            {loadingMhfr ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>MHFR Network</Text>
                    <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.base }} />
                </View>
            ) : hasMhfr ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>MHFR Network</Text>
                    {mhfrContacts.map((c) => (
                        <ContactCard
                            key={c.id}
                            name={c.fullName || `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || 'Contact'}
                            description="MHFR Support"
                            number={c.phoneNumber || ''}
                        />
                    ))}
                </View>
            ) : null}

            {/* EAP Provider */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>EAP Provider</Text>
                {eapContacts.map((c, i) => (
                    <ContactCard key={i} name={c.name} description={c.description} number={c.number} />
                ))}
            </View>

            {/* My Pairs */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Pairs</Text>
                {pairs.length === 0 ? (
                    <Text style={styles.emptyText}>No pairs connected</Text>
                ) : (
                    pairs.map((p: any) => (
                        <ContactCard
                            key={p.id}
                            name={p.fullName || `Pair #${p.id}`}
                            description={p.pairType ?? 'Pair'}
                            number={p.phoneNumber || ''}
                        />
                    ))
                )}
            </View>

            {/* Hotlines */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hotlines</Text>
                {hotlines.map((c, i) => (
                    <ContactCard key={i} name={c.name} description={c.description} number={c.number} />
                ))}
            </View>

            <View style={styles.actions}>
                {hasMhfr && (
                    <Button title="Notify MHFR Network" onPress={handleNotifyMhfr} />
                )}
                <Button
                    title="I've been supported"
                    variant="secondary"
                    onPress={() => setStep('log_resolution')}
                />
            </View>
        </ScrollView>
    );

    const renderLogResolution = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.heading}>Would you like to update how you feel?</Text>
            <Text style={styles.body}>
                You can check in again to log how you're feeling now.
            </Text>
            <View style={styles.actions}>
                <Button title="Yes" onPress={navigateToSupportCheckIn} />
                <Button title="No" variant="secondary" onPress={exitToDailyInsight} />
            </View>
        </View>
    );

    const renderNotifyMhfr = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.heading}>Would you like someone to get in touch with you?</Text>
            <Text style={styles.body}>
                We can notify your support network so someone can reach out.
            </Text>
            <View style={styles.actions}>
                <Button title="Yes" onPress={handleNotifyMhfr} />
                <Button title="No" variant="secondary" onPress={() => setStep('follow_up')} />
            </View>
        </View>
    );

    const renderMhfrConfirmed = () => (
        <View style={styles.stepContainer}>
            <CircleCheck size={48} color={colors.primary} style={{ alignSelf: 'center', marginBottom: spacing.base }} />
            <Text style={styles.heading}>Support Network Notified</Text>
            <Text style={styles.body}>
                Your MHFR network has been notified. Someone will be in touch with you soon.
            </Text>
            <View style={styles.actions}>
                <Button title="Ok" onPress={exitToDailyInsight} />
            </View>
        </View>
    );

    const renderFollowUp = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.heading}>Would you like us to circle back in 30 mins?</Text>
            <Text style={styles.body}>
                We'll send you a reminder to check in on how you're doing.
            </Text>
            <View style={styles.actions}>
                <Button title="Yes" onPress={handleScheduleCircleBack} />
                <Button title="No" variant="secondary" onPress={exitToDailyInsight} />
            </View>
        </View>
    );

    const stepRenderers: Record<Step, () => React.ReactNode> = {
        invitation: renderInvitation,
        support_options: renderSupportOptions,
        log_resolution: renderLogResolution,
        notify_mhfr: renderNotifyMhfr,
        mhfr_confirmed: renderMhfrConfirmed,
        follow_up: renderFollowUp,
    };

    return (
        <SafeAreaView style={styles.container}>
            {stepRenderers[step]()}
        </SafeAreaView>
    );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    stepContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },
    scroll: {
        flex: 1,
    },
    scrollInner: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        paddingBottom: spacing['4xl'],
    },
    heading: {
        fontFamily: fonts.heading,
        fontSize: fontSizes['2xl'],
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.base,
    },
    body: {
        fontFamily: fonts.body,
        fontSize: fontSizes.base,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing['2xl'],
    },
    actions: {
        gap: spacing.sm,
        width: '100%',
    },
    emptyText: {
        fontFamily: fonts.body,
        fontSize: fontSizes.sm,
        color: colors.textMuted,
        textAlign: 'center',
        paddingVertical: spacing.base,
    },

    /* Flat sections (matching EmergencyServicesScreen) */
    section: {
        marginBottom: spacing['2xl'],
    },
    sectionTitle: {
        fontSize: fontSizes.lg,
        fontFamily: fonts.heading,
        color: colors.textPrimary,
        marginBottom: spacing.base,
    },

    /* Contact Cards */
    card: {
        backgroundColor: colors.surface,
        padding: spacing.base,
        borderRadius: borderRadius.button,
        marginBottom: spacing.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardName: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.base,
        color: colors.textPrimary,
    },
    cardDesc: {
        fontFamily: fonts.body,
        fontSize: fontSizes.sm,
        color: colors.textMuted,
        marginTop: spacing.xs,
    },
    cardNumber: {
        fontFamily: fonts.bodyBold,
        fontSize: fontSizes.base,
        color: colors.primary,
        marginTop: spacing.xs,
    },
    phoneIconWrap: {
        backgroundColor: colors.primaryLight,
        padding: spacing.base,
        borderRadius: borderRadius.full,
    },
});
