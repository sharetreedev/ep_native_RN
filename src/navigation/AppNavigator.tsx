import React, { useRef, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useCheckIn } from '../contexts/CheckInContext';
import { colors } from '../theme';
import { consumePendingLesson } from './pendingLesson';
import TabNavigator from './TabNavigator';
import AuthScreen from '../screens/AuthScreen/AuthScreen';
import MobileSignInScreen from '../screens/MobileSignInScreen/MobileSignInScreen';
import MobileVerifyScreen from '../screens/MobileVerifyScreen/MobileVerifyScreen';
import OnboardingScreen from '../screens/OnboardingScreen/OnboardingScreen';
import CheckInScreen from '../screens/CheckInScreen/CheckInScreen';
import DailyInsightScreen from '../screens/DailyInsightScreen/DailyInsightScreen';
import NotificationsScreen from '../screens/NotificationsScreen/NotificationsScreen';
import EmergencyServicesScreen from '../screens/EmergencyServicesScreen/EmergencyServicesScreen';
import SupportRequestsScreen from '../screens/SupportRequestsScreen/SupportRequestsScreen';
import UserProfileScreen from '../screens/UserProfileScreen/UserProfileScreen';
import LessonScreen from '../screens/LessonScreen/LessonScreen';
import InvitePairIntroScreen from '../screens/InvitePairIntroScreen/InvitePairIntroScreen';
import InvitePairTypeScreen from '../screens/InvitePairTypeScreen/InvitePairTypeScreen';
import InvitePairActionsScreen from '../screens/InvitePairActionsScreen/InvitePairActionsScreen';
import EmotionDetailScreen from '../screens/EmotionDetailScreen/EmotionDetailScreen';
import AccountScreen from '../screens/AccountScreen/AccountScreen';
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
import MHFRBanner from '../components/MHFRBanner';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    const { isAuthenticated, isLoading, user } = useAuth();
    const { hasCheckedInToday } = useCheckIn();
    const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
    const checkinPushed = useRef(false);

    // Determine the initial route for authenticated users
    const needsOnboarding = isAuthenticated && !user?.onboardingComplete;
    const needsCheckIn = isAuthenticated && user?.onboardingComplete && !hasCheckedInToday;

    // Navigate to lesson if user enrolled during onboarding
    useEffect(() => {
        if (!needsOnboarding && !isLoading) {
            const lesson = consumePendingLesson();
            if (lesson) {
                // Small delay to let the Main stack mount
                setTimeout(() => {
                    navRef.current?.navigate('Lessons', { lesson });
                }, 100);
            }
        }
    }, [needsOnboarding, isLoading]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer
            ref={navRef}
            onReady={() => {
                // Auto-push CheckIn on top of Main so dismissing it pops back (slides out right)
                if (needsCheckIn && !checkinPushed.current) {
                    checkinPushed.current = true;
                    navRef.current?.navigate('CheckIn');
                }
            }}
        >
            <View style={styles.appContainer}>
            {isAuthenticated && !needsOnboarding && <MHFRBanner />}
            <Stack.Navigator id="RootStack" screenOptions={{ headerShown: false }}>
                {isAuthenticated ? (
                    needsOnboarding ? (
                        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                    ) : (
                        <>
                            <Stack.Screen name="Main" component={TabNavigator} />
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
                            <Stack.Screen name="InvitePairIntro" component={InvitePairIntroScreen} />
                            <Stack.Screen name="InvitePairType" component={InvitePairTypeScreen} />
                            <Stack.Screen name="InvitePairActions" component={InvitePairActionsScreen} />
                            <Stack.Screen name="EmotionDetail" component={EmotionDetailScreen} options={{ presentation: 'modal' }} />
                            <Stack.Screen name="Account" component={AccountScreen} />
                            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                            <Stack.Screen name="Reminders" component={RemindersScreen} />
                            <Stack.Screen name="GroupProfile" component={GroupProfileScreen} />
                            <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
                            <Stack.Screen name="GroupInvite" component={GroupInviteScreen} />
                            <Stack.Screen name="AIMHFR" component={AIMHFRScreen} />
                        </>
                    )
                ) : (
                    <>
                        <Stack.Screen name="Auth" component={AuthScreen} />
                        <Stack.Screen name="MobileSignIn" component={MobileSignInScreen} />
                        <Stack.Screen name="MobileVerify" component={MobileVerifyScreen} />
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
