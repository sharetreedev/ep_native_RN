import { Emotion } from '../constants/emotions';
import { XanoNextLesson, XanoEnrollment, XanoSupportRequest } from '../api';

export type RootStackParamList = {
    Auth: undefined;
    MobileSignIn: undefined;
    MobileVerify: { userId: string; phone: string; countryIso: string };
    Onboarding: undefined;
    Main: undefined;
    CheckIn: { isSupportRequest?: boolean; supportRequestId?: number } | undefined;
    Notifications: undefined;
    EmergencyServices: undefined;
    SupportRequests: { initialTab?: 'myRequests' | 'mhfr' } | undefined;
    SupportRequestDetails: { supportRequest: XanoSupportRequest };
    RiskAssessment: { supportRequest: XanoSupportRequest };
    UserProfile: { userId: string; pairsId?: number; isNotPair?: boolean };
    InvitePairIntro: undefined;
    InvitePairType: undefined;
    InvitePairActions: { pairType: 'DUAL' | 'PULL' };
    EmotionDetail: { emotion: Emotion };
    GroupProfile: { groupId: number; groupName?: string; forestId?: number; runningStats?: any; imageUrl?: string; role?: string; membersCoordinatesCount?: any[]; checkins7day?: any[]; checkins30day?: any[] };
    GroupInvite: { groupId: number; groupName?: string };
    CreateGroup: undefined;
    CheckinSupportRequest: { coordinateId: number; emotionName: string; supportRequestId: number };
    DailyInsight: {
        // Optimistic seed for the timeline view: the just-completed check-in,
        // injected from CheckInScreen. The Xano timeline endpoint reads from
        // an aggregate that's populated via a background task on the create
        // endpoint, so without this the first check-in of the day appears
        // as "No check in" until the next refetch catches up.
        justCheckedIn?: {
            emotionName: string;
            emotionColour: string;
            coordinateId: number;
            intensity?: number;
            createdAt: string;
        };
    } | undefined;
    Lessons: { lesson: XanoNextLesson };
    CourseDetails: { enrollment?: XanoEnrollment } | undefined;
    Enrollments: { enrollments: XanoEnrollment[] };
    Account: undefined;
    EditProfile: undefined;
    Reminders: undefined;
    AIMHFR: undefined;
    CourseEnroll: undefined;
};

export type MainTabParamList = {
    MyPulse: { courseCompleted?: boolean; courseName?: string } | undefined;
    Pulse: undefined;
    GetSupport: undefined;
};
