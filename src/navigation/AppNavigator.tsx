import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useCheckIn } from '../contexts/CheckInContext';
import { colors } from '../theme';
import { consumePendingLesson, peekPendingLesson } from './pendingLesson';
import { linking } from './linking';
import { setPendingLink, consumePendingLink, peekPendingLink } from './pendingLink';
import { logger } from '../lib/logger';
import TabNavigator from './TabNavigator';
import AuthScreen from '../screens/AuthScreen/AuthScreen';
import MobileSignInScreen from '../screens/MobileSignInScreen/MobileSignInScreen';
import MobileVerifyScreen from '../screens/MobileVerifyScreen/MobileVerifyScreen';
import AccountNotFoundScreen from '../screens/AccountNotFoundScreen/AccountNotFoundScreen';
import MigrationVerifyScreen from '../screens/MigrationVerifyScreen/MigrationVerifyScreen';
import MigrationWelcomeScreen from '../screens/MigrationWelcomeScreen/MigrationWelcomeScreen';
import SetPasswordScreen from '../screens/SetPasswordScreen/SetPasswordScreen';
import AppleNameCaptureScreen from '../screens/AppleNameCaptureScreen/AppleNameCaptureScreen';
import OnboardingScreen from '../screens/OnboardingScreen/OnboardingScreen';
import CheckInScreen from '../screens/CheckInScreen/CheckInScreen';
import DailyInsightScreen from '../screens/DailyInsightScreen/DailyInsightScreen';
import NotificationsScreen from '../screens/NotificationsScreen/NotificationsScreen';
import EmergencyServicesScreen from '../screens/EmergencyServicesScreen/EmergencyServicesScreen';
import SupportRequestsScreen from '../screens/SupportRequestsScreen/SupportRequestsScreen';
import UserProfileScreen from '../screens/UserProfileScreen/UserProfileScreen';
import LessonScreen from '../screens/LessonScreen/LessonScreen';
import InvitePairTypeScreen from '../screens/InvitePairTypeScreen/InvitePairTypeScreen';
import InvitePairActionsScreen from '../screens/InvitePairActionsScreen/InvitePairActionsScreen';
import EmotionDetailScreen from '../screens/EmotionDetailScreen/EmotionDetailScreen';
import AccountScreen from '../screens/AccountScreen/AccountScreen';
import AccountSettingsScreen from '../screens/AccountSettingsScreen/AccountSettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen/EditProfileScreen';
import RemindersScreen from '../screens/RemindersScreen/RemindersScreen';
import GroupProfileScreen from '../screens/GroupProfileScreen/GroupProfileScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen/CreateGroupScreen';
import GroupInviteScreen from '../screens/GroupInviteScreen/GroupInviteScreen';
import AIMHFRScreen from '../screens/AIMHFRScreen/AIMHFRScreen';
import CourseDetailsScreen from '../screens/CourseDetailsScreen/CourseDetailsScreen';
import CourseEnrollScreen from '../screens/CourseEnrollScreen/CourseEnrollScreen';
import EnrollmentsScreen from '../screens/EnrollmentsScreen/EnrollmentsScreen';
import CheckinSupportRequestScreen from '../screens/CheckinSupportRequestScreen/CheckinSupportRequestScreen';
import SupportRequestDetailsScreen from '../screens/SupportRequestDetailsScreen/SupportRequestDetailsScreen';
import RiskAssessmentScreen from '../screens/RiskAssessmentScreen/RiskAssessmentScreen';
import PairInviteScreen from '../screens/PairInviteScreen/PairInviteScreen';
import GroupInviteAcceptScreen from '../screens/GroupInviteAcceptScreen/GroupInviteAcceptScreen';
import MHFRBanner from '../components/MHFRBanner';
import PushPrimer from '../components/PushPrimer';
import MyPulseV2Promo from '../components/MyPulseV2Promo';
import PendingGroupInviteSheet from '../components/PendingGroupInviteSheet';
import PendingPairInviteTrigger from '../components/PendingPairInviteTrigger';
import LoadingAnimation from '../components/LoadingAnimation';
import NewMHFRSupportRequestSheet from '../components/NewMHFRSupportRequestSheet';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    const { isAuthenticated, isLoading, user, pendingPasswordSetup } = useAuth();
    const { hasCheckedInToday } = useCheckIn();
    const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
    // Flipped true once NavigationContainer reports ready, so children that
    // need to call `navRef.current?.navigate(...)` from a useEffect can
    // re-run their effects when the navigator is finally usable.
    const [navReady, setNavReady] = useState(false);

    // Determine the initial route for authenticated users.
    // Order of gates: pendingPasswordSetup > needsAppleNameCapture > needsOnboarding.
    // Apple-name-capture sits before onboarding because the rest of the app
    // (avatars, check-in attribution, pair invites) renders the user's name —
    // if firstName is empty we'd ship initials of "" everywhere.
    const needsAppleNameCapture =
        isAuthenticated && !pendingPasswordSetup && !!user && !user.firstName;
    const needsOnboarding =
        isAuthenticated && !pendingPasswordSetup && !needsAppleNameCapture && !user?.onboardingComplete;
    const needsCheckIn =
        isAuthenticated && !pendingPasswordSetup && !needsAppleNameCapture && user?.onboardingComplete && !hasCheckedInToday;

    // Hand off a pending lesson (set during onboarding's course-enroll step)
    // to the Lessons screen as soon as the authed stack is mounted and ready.
    // We trigger from both onReady and onStateChange because:
    //   - onReady covers the cold-launch case (user closed the app between
    //     enroll and re-open; lesson is rehydrated from SecureStore)
    //   - onStateChange covers the hot case (Stack swaps from Onboarding-only
    //     to the full authed tree when `needsOnboarding` flips false)
    // The lesson is durably stored in SecureStore (see pendingLesson.ts), so
    // missing one trigger doesn't lose the handoff — the next state change,
    // or the next launch, will still pick it up.
    const tryConsumePendingLesson = useCallback(() => {
        if (needsOnboarding || isLoading) return;
        if (!peekPendingLesson()) return;
        const ref = navRef.current;
        if (!ref?.isReady()) return;
        const routes = ref.getRootState()?.routeNames as string[] | undefined;
        if (!routes?.includes('Lessons')) return;
        consumePendingLesson().then((lesson) => {
            if (lesson) ref.navigate('Lessons', { lesson });
        });
    }, [needsOnboarding, isLoading]);

    // Consume a pending deep link after auth completes.
    // The link is stored by the Linking listener below when the user is
    // unauthenticated, and consumed here once they sign in and the
    // navigator is ready.
    //
    // We deliberately do NOT call `Linking.openURL(url)` to "replay" the link.
    // On iOS, opening a Universal Link URL while the destination app is
    // already foregrounded causes the OS to bounce the URL out to Safari
    // instead of routing it back to the app — producing a flicker where
    // Pulse opens for a beat and then the browser takes over. Instead, parse
    // the URL ourselves and dispatch a native React Navigation action so
    // the OS never sees it.
    const tryConsumePendingLink = useCallback(() => {
        if (!isAuthenticated || needsOnboarding || needsAppleNameCapture || isLoading || pendingPasswordSetup) return;
        if (!peekPendingLink()) return;
        const ref = navRef.current;
        if (!ref?.isReady()) return;
        consumePendingLink().then((url) => {
            if (!url) return;
            logger.info('[AppNavigator] Consuming pending deep link:', url);

            const parsed = Linking.parse(url);
            const path = parsed.path; // e.g. "pair-invite", "group-invite", or null
            const params = parsed.queryParams ?? {};

            // Map paths to authed-stack routes. Keep this list in sync with
            // `linking.ts` — that file defines the URL → route mapping; this
            // one re-applies it for the post-auth replay case.
            if (path === 'pair-invite') {
                const pairToken = typeof params.pair_token === 'string' ? params.pair_token : undefined;
                if (pairToken) {
                    ref.navigate('PairInvite', { pair_token: pairToken });
                    return;
                }
            }
            if (path === 'group-invite') {
                const token = typeof params.token === 'string' ? params.token : undefined;
                if (token) {
                    ref.navigate('GroupInviteAccept', { token });
                    return;
                }
            }

            logger.warn('[AppNavigator] Pending deep link did not match a known route, ignoring:', { path, params });
        });
    }, [isAuthenticated, needsOnboarding, needsAppleNameCapture, isLoading, pendingPasswordSetup]);

    useEffect(() => {
        tryConsumePendingLesson();
        tryConsumePendingLink();
    }, [tryConsumePendingLesson, tryConsumePendingLink]);

    // Route the user to Check-in whenever they owe one and it isn't already
    // on screen. This is reactive — not a one-shot on cold launch — so a warm
    // foreground resume the next day also routes correctly: once AuthContext
    // refreshes the user on AppState 'active' and `hasCheckedInToday` flips
    // false, `needsCheckIn` flips true and this pushes Check-in. The previous
    // implementation pushed only inside `onReady` behind a ref that was never
    // reset, so Android warm-resumes (JS kept alive, onReady never re-fires)
    // stayed stuck on Home. (EP-1052)
    useEffect(() => {
        if (!navReady || !needsCheckIn) return;
        const ref = navRef.current;
        if (!ref?.isReady()) return;
        const state = ref.getRootState();
        const topRoute = state?.routes?.[state.routes.length - 1]?.name;
        if (topRoute === 'CheckIn') return;
        ref.navigate('CheckIn');
    }, [navReady, needsCheckIn]);

    // When a deep link arrives and the user is not authenticated, save it
    // as a pending link so it survives the auth round-trip. The pending-link
    // consumer (`tryConsumePendingLink` above) waits for onboarding to be
    // complete before replaying, so deep-link screens like GroupInviteAccept
    // and PairInvite only mount once the user is fully signed-in and onboarded.
    useEffect(() => {
        const subscription = Linking.addEventListener('url', ({ url }) => {
            // Don't intercept the OAuth callback — that's handled by AuthSession
            if (url.includes('emotionalpulse://auth')) return;

            if (!isAuthenticated) {
                logger.info('[AppNavigator] Unauthenticated deep link received, saving as pending:', url);
                setPendingLink(url);
            }
        });

        // Also check the initial URL that launched the app
        if (!isAuthenticated) {
            Linking.getInitialURL().then((url) => {
                if (url && !url.includes('emotionalpulse://auth')) {
                    logger.info('[AppNavigator] Unauthenticated initial URL, saving as pending:', url);
                    setPendingLink(url);
                }
            });
        }

        return () => subscription.remove();
    }, [isAuthenticated]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <LoadingAnimation />
            </View>
        );
    }

    return (
        <NavigationContainer
            ref={navRef}
            linking={linking}
            onReady={() => {
                // Flipping navReady drives the Check-in routing effect above,
                // which pushes CheckIn on top of Main (so dismissing it pops
                // back, sliding out right) whenever a check-in is owed.
                setNavReady(true);
                tryConsumePendingLesson();
                tryConsumePendingLink();
            }}
            onStateChange={() => {
                tryConsumePendingLesson();
                tryConsumePendingLink();
            }}
        >
            <View style={styles.appContainer}>
            {isAuthenticated && !needsOnboarding && !pendingPasswordSetup && !needsAppleNameCapture && <MHFRBanner />}
            {isAuthenticated && !needsOnboarding && !pendingPasswordSetup && !needsAppleNameCapture && <PushPrimer />}
            {isAuthenticated && !needsOnboarding && !pendingPasswordSetup && !needsAppleNameCapture && <MyPulseV2Promo />}
            {isAuthenticated && !needsOnboarding && !pendingPasswordSetup && !needsAppleNameCapture && <PendingGroupInviteSheet sessionKey={user?.id} />}
            {isAuthenticated && !needsOnboarding && !pendingPasswordSetup && !needsAppleNameCapture && <PendingPairInviteTrigger sessionKey={user?.id} navRef={navRef} navReady={navReady} />}
            {isAuthenticated && !needsOnboarding && !pendingPasswordSetup && !needsAppleNameCapture && <NewMHFRSupportRequestSheet />}
            <Stack.Navigator id="RootStack" screenOptions={{ headerShown: false }}>
                {isAuthenticated ? (
                    pendingPasswordSetup ? (
                        <>
                            <Stack.Screen
                                name="MigrationWelcome"
                                component={MigrationWelcomeScreen}
                                options={{ gestureEnabled: false }}
                            />
                            <Stack.Screen
                                name="SetPassword"
                                component={SetPasswordScreen}
                                options={{ gestureEnabled: false }}
                            />
                        </>
                    ) : needsAppleNameCapture ? (
                        <Stack.Screen
                            name="AppleNameCapture"
                            component={AppleNameCaptureScreen}
                            options={{ gestureEnabled: false }}
                        />
                    ) : needsOnboarding ? (
                        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                    ) : (
                        <>
                            <Stack.Screen
                                name="Main"
                                component={TabNavigator}
                                options={{ gestureEnabled: false }}
                            />
                            <Stack.Screen name="CheckIn" component={CheckInScreen} />
                            <Stack.Screen name="CheckinSupportRequest" component={CheckinSupportRequestScreen} />
                            <Stack.Screen name="DailyInsight" component={DailyInsightScreen} />
                            <Stack.Screen name="Notifications" component={NotificationsScreen} />
                            <Stack.Screen name="EmergencyServices" component={EmergencyServicesScreen} />
                            <Stack.Screen name="SupportRequests" component={SupportRequestsScreen} />
                            <Stack.Screen name="SupportRequestDetails" component={SupportRequestDetailsScreen} />
                            <Stack.Screen name="RiskAssessment" component={RiskAssessmentScreen} />
                            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
                            <Stack.Screen name="Lessons" component={LessonScreen} />
                            <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} />
                            <Stack.Screen name="CourseEnroll" component={CourseEnrollScreen} />
                            <Stack.Screen name="Enrollments" component={EnrollmentsScreen} />
                            <Stack.Screen name="InvitePairType" component={InvitePairTypeScreen} />
                            <Stack.Screen name="InvitePairActions" component={InvitePairActionsScreen} />
                            <Stack.Screen name="EmotionDetail" component={EmotionDetailScreen} options={{ presentation: 'modal' }} />
                            <Stack.Screen name="Account" component={AccountScreen} />
                            <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
                            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                            <Stack.Screen name="Reminders" component={RemindersScreen} />
                            <Stack.Screen name="GroupProfile" component={GroupProfileScreen} />
                            <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
                            <Stack.Screen name="GroupInvite" component={GroupInviteScreen} />
                            <Stack.Screen name="AIMHFR" component={AIMHFRScreen} />
                            <Stack.Screen
                                name="PairInvite"
                                component={PairInviteScreen}
                                options={{ presentation: 'modal' }}
                            />
                            <Stack.Screen name="GroupInviteAccept" component={GroupInviteAcceptScreen} />
                        </>
                    )
                ) : (
                    <>
                        <Stack.Screen name="Auth" component={AuthScreen} />
                        <Stack.Screen name="MobileSignIn" component={MobileSignInScreen} />
                        <Stack.Screen name="MobileVerify" component={MobileVerifyScreen} />
                        <Stack.Screen name="AccountNotFound" component={AccountNotFoundScreen} />
                        <Stack.Screen name="MigrationVerify" component={MigrationVerifyScreen} />
                    </>
                )}
            </Stack.Navigator>
            </View>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    appContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
});
