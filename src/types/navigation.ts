import { Emotion } from '../constants/emotions';
import { XanoNextLesson, XanoEnrollment, XanoSupportRequest, XanoGroupRunningStats, XanoCoordinateCount } from '../api';

export type RootStackParamList = {
    Auth: undefined;
    MobileSignIn: undefined;
    MobileVerify: { userId: string; phone: string; countryIso: string };
    // Migration sign-in flow (pre-auth):
    AccountNotFound: { email: string };
    MigrationVerify: { email: string; userId: string };
    // Migration set-password flow (post-auth, gated by pendingPasswordSetup):
    MigrationWelcome: undefined;
    SetPassword: undefined;
    // Shown after Apple sign-in for users whose record came back with no
    // firstName (Apple suppresses fullName on every authorization after the
    // first). Gated before Onboarding so the rest of the app can rely on a
    // non-empty name.
    AppleNameCapture: undefined;
    Onboarding: undefined;
    Main: undefined;
    CheckIn: {
        isSupportRequest?: boolean;
        supportRequestId?: number;
        // True if no check-in existed for today at the moment this flow began.
        // Forwarded through the support detour so a re-check-in inside it still
        // ends at DailyInsight, while a non-first manual check-in skips it.
        wasFirstCheckinToday?: boolean;
    } | undefined;
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
    GroupProfile: {
        groupId: number;
        groupName?: string;
        forestId?: number;
        runningStats?: XanoGroupRunningStats | null;
        imageUrl?: string;
        role?: string;
        membersCoordinatesCount?: XanoCoordinateCount[];
        checkins7day?: XanoCoordinateCount[];
        checkins30day?: XanoCoordinateCount[];
    };
    GroupInvite: { groupId: number; groupName?: string };
    GroupInviteAccept: { token: string };
    // PairInvite is reachable two ways:
    //   - Universal link (deep-link path):    pass `pair_token` (screen loads
    //     the invite via `pair.getByToken` — this works because the endpoint
    //     accepts a token without requiring the user to already be in a pair)
    //   - In-app pending-invite popup:        pass `invite` (the full pair
    //     record from `user.pendingPairInvites`). The screen skips the API
    //     fetch entirely and renders directly from this — fetching by id
    //     would hit `/pairs/{id}`, which Xano rejects with ERROR_FATAL
    //     ("User is not Pairs with this person") when the user isn't yet
    //     accepted into the pair.
    PairInvite: { pair_token?: string; invite?: unknown };
    CreateGroup: undefined;
    CheckinSupportRequest: {
        coordinateId: number;
        emotionName: string;
        supportRequestId: number;
        wasFirstCheckinToday?: boolean;
        justCheckedIn?: {
            emotionName: string;
            emotionColour: string;
            coordinateId: number;
            intensity?: number;
            createdAt: string;
        };
    };
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
    AccountSettings: undefined;
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
