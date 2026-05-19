import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BottomSheet from './BottomSheet';
import Avatar from './Avatar';
import Button from './Button';
import EmotionBadge from './EmotionBadge';
import { useMHFR } from '../contexts/MHFRContext';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation';
import { XanoSupportRequest } from '../api';
import { colors, fonts, fontSizes, spacing } from '../theme';
import { logger } from '../lib/logger';

interface StoredState {
    // Wall-clock at first hydrate. Requests created before this are treated as
    // already-seen so a fresh install / first login doesn't surface a backlog.
    seededAt: number;
    seenIds: number[];
}

const STORAGE_KEY_PREFIX = 'mhfr_modal_state_v1';
const MAX_TRACKED_IDS = 200;

/**
 * Pop-up shown to MHFR users when a new support request lands in their queue.
 * Watches `mhfrRequests` from MHFRContext, surfaces the most-recent OPEN
 * request that hasn't been seen, and persists the seen-id list per-user via
 * SecureStore so a single request only modals once across re-launches.
 *
 * Tap the CTA to jump straight into SupportRequestDetails; backdrop dismisses
 * silently (and still marks seen, so it won't reappear on the next refresh).
 *
 * Mounted alongside MHFRBanner in AppNavigator. The banner stays for an
 * at-a-glance reminder while open requests remain; this sheet is the
 * arrival-of-new-request surface only.
 */
export default function NewMHFRSupportRequestSheet() {
    const { user } = useAuth();
    const { mhfrRequests, refreshMHFRRequests } = useMHFR();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [state, setState] = useState<StoredState | null>(null);
    const [pending, setPending] = useState<XanoSupportRequest | null>(null);

    const storageKey = user?.id ? `${STORAGE_KEY_PREFIX}_${user.id}` : null;

    // Hydrate (or seed) the per-user seen state.
    useEffect(() => {
        if (!storageKey) {
            setState(null);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const raw = await SecureStore.getItemAsync(storageKey);
                if (cancelled) return;
                if (raw) {
                    setState(JSON.parse(raw) as StoredState);
                } else {
                    const seed: StoredState = { seededAt: Date.now(), seenIds: [] };
                    setState(seed);
                    await SecureStore.setItemAsync(storageKey, JSON.stringify(seed));
                }
            } catch (e) {
                logger.warn('[NewMHFRSupportRequestSheet] hydrate failed:', e);
                if (!cancelled) setState({ seededAt: Date.now(), seenIds: [] });
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [storageKey]);

    // Detect a new unseen OPEN request and surface it. Also clears `pending`
    // if the currently-shown request was resolved out from under us (e.g.
    // another responder picked it up).
    useEffect(() => {
        if (!state) return;
        if (pending) {
            const stillOpen = mhfrRequests.some(
                (r) => r.id === pending.id && r.status === 'OPEN',
            );
            if (!stillOpen) setPending(null);
            return;
        }
        const seenSet = new Set(state.seenIds);
        const unseen = mhfrRequests
            .filter(
                (r) =>
                    r.status === 'OPEN' &&
                    !seenSet.has(r.id) &&
                    (r.created_at ?? 0) >= state.seededAt,
            )
            .sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));
        if (unseen.length > 0) setPending(unseen[0]);
    }, [mhfrRequests, state, pending]);

    // Refresh the MHFR list when the app returns to foreground so a push that
    // landed while backgrounded surfaces the modal on next open.
    useEffect(() => {
        const sub = AppState.addEventListener('change', (next) => {
            if (next === 'active') {
                refreshMHFRRequests().catch(() => {});
            }
        });
        return () => sub.remove();
    }, [refreshMHFRRequests]);

    const markSeen = (id: number) => {
        setState((prev) => {
            if (!prev) return prev;
            if (prev.seenIds.includes(id)) return prev;
            const seenIds = [...prev.seenIds, id].slice(-MAX_TRACKED_IDS);
            const next = { ...prev, seenIds };
            if (storageKey) {
                SecureStore.setItemAsync(storageKey, JSON.stringify(next)).catch((e) =>
                    logger.warn('[NewMHFRSupportRequestSheet] persist failed:', e),
                );
            }
            return next;
        });
    };

    const handleDismiss = () => {
        if (pending) markSeen(pending.id);
        setPending(null);
    };

    const handleGoToRequest = () => {
        if (!pending) return;
        const sr = pending;
        markSeen(sr.id);
        setPending(null);
        navigation.navigate('SupportRequestDetails', { supportRequest: sr });
    };

    if (!pending) return null;

    const requester = pending.requesting_user_details;
    const emotion = pending.trigger_Emotion;
    const requesterName = requester?.fullName ?? 'Someone';
    const triggerDisplay =
        emotion?.emotion_item?.Display ?? emotion?.emotion_name ?? '';
    const triggerColour =
        emotion?.emotion_item?.emotionColour ?? emotion?.emotionColour ?? colors.primary;

    return (
        <BottomSheet visible={true} onDismiss={handleDismiss} title="New Support Request">
            <View style={styles.content}>
                <Avatar
                    source={requester?.profilePic_url}
                    name={requesterName}
                    hexColour={requester?.profile_hex_colour ?? undefined}
                    size="2xl"
                    shadow="sm"
                />
                <Text style={styles.name}>{requesterName}</Text>
                {triggerDisplay ? (
                    <View style={styles.badgeWrap}>
                        <EmotionBadge
                            emotionName={triggerDisplay}
                            emotionColour={triggerColour}
                            size="small"
                        />
                    </View>
                ) : null}
                <View style={styles.actions}>
                    <Button title="Go to support request" onPress={handleGoToRequest} />
                </View>
            </View>
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    content: {
        alignItems: 'center',
        paddingTop: spacing.sm,
        paddingBottom: spacing.base,
    },
    name: {
        fontFamily: fonts.heading,
        fontSize: fontSizes.xl,
        color: colors.textPrimary,
        marginTop: spacing.base,
    },
    badgeWrap: {
        marginTop: spacing.sm,
    },
    actions: {
        marginTop: spacing.xl,
        width: '100%',
    },
});
