import { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useMHFR } from '../contexts/MHFRContext';
import { useCourses } from './useCourses';
import { getSuggestedPairs } from '../lib/suggestedPairs';

export type ThingsToDoIcon =
  | 'user'
  | 'alert'
  | 'graduation'
  | 'camera'
  | 'bell'
  | 'blend'
  | 'activity'
  | 'group';

export type ThingsToDoAction = {
  id: string;
  mainText: string;
  subText: string;
  bgColor: string;
  icon: ThingsToDoIcon;
  onPress: () => void;
  /** When present, renderers should show this person's avatar in place of
   *  the default lucide icon — used for pair-driven actions so the user
   *  sees who the task relates to rather than a generic person glyph. */
  avatar?: {
    source?: string | { url: string } | null;
    name?: string;
    hexColour?: string | null;
  };
};

// Action-type accent colors. Mirrors the prototype palette and lives here
// (rather than in the theme) until the design system formalizes them.
const ACTION_COLOR: Record<ThingsToDoIcon, string> = {
  alert: '#F5A864',
  user: '#9B86BD',
  graduation: '#91A27D',
  camera: '#6B7D5A',     // sage green
  bell: '#A07A66',       // warm clay
  blend: '#5A6B78',      // slate blue
  activity: '#8B7355',   // warm brown
  group: '#7A6B8A',      // muted lavender
};

const MAX_ACTIONS = 10;

export function useThingsToDo() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { mhfrRequests } = useMHFR();
  const { enrollment, allEnrollments } = useCourses();

  const actions = useMemo<ThingsToDoAction[]>(() => {
    if (!user) return [];
    const list: ThingsToDoAction[] = [];

    // 1. Open MHFR support requests
    for (const req of mhfrRequests) {
      if (req.status !== 'OPEN') continue;
      const fullName = req.requesting_user_details?.fullName;
      list.push({
        id: `mhfr-${req.id}`,
        mainText: 'New Support Request',
        subText: fullName
          ? `${fullName} has requested support`
          : 'Someone in your network has requested support',
        bgColor: ACTION_COLOR.alert,
        icon: 'alert',
        onPress: () => navigation.navigate('SupportRequestDetails', { supportRequest: req }),
      });
    }

    // 2 + 3. Pairs needing attention or inactive
    const suggested = getSuggestedPairs(user);
    for (const item of suggested) {
      const pairUser = item.pair._pair_user || item.pair._user || item.pair.other_user;
      const firstName = pairUser?.firstName || pairUser?.fullName?.split(' ')?.[0] || 'a pair';
      list.push({
        id: `pair-${item.pair.id}-${item.reason}`,
        mainText: `Check in with ${firstName}`,
        subText:
          item.reason === 'needs_attention'
            ? `${firstName} may need some support`
            : `${firstName} hasn't checked in within 7 days`,
        bgColor: ACTION_COLOR.user,
        icon: 'user',
        avatar: {
          source: pairUser?.profilePic_url ?? pairUser?.avatar?.url ?? null,
          name: pairUser?.fullName ?? pairUser?.firstName ?? undefined,
          hexColour: pairUser?.profile_hex_colour ?? null,
        },
        onPress: () =>
          navigation.navigate('UserProfile', {
            userId: String(item.pair.pair_user_id),
            pairsId: item.pair.id,
          }),
      });
    }

    // 4. Onboarding steps — surfaced as things-to-do until each is completed.
    // Mirrors the OnboardingProgress cards so new users have a single place
    // to pick up what's left to set up.
    if (!user.avatarUrl) {
      list.push({
        id: 'onboarding-avatar',
        mainText: 'Add a profile picture',
        subText: 'Help your pairs recognise you',
        bgColor: ACTION_COLOR.camera,
        icon: 'camera',
        onPress: () => navigation.navigate('EditProfile'),
      });
    }
    if (!user.reminderFrequency || user.reminderFrequency === 'NONE') {
      list.push({
        id: 'onboarding-reminders',
        mainText: 'Set check-in reminders',
        subText: 'Stay on track with daily nudges',
        bgColor: ACTION_COLOR.bell,
        icon: 'bell',
        onPress: () => navigation.navigate('Reminders'),
      });
    }
    if ((user.pairs?.length ?? 0) === 0) {
      list.push({
        id: 'onboarding-pair',
        mainText: 'Invite a pair',
        subText: 'Share your journey with someone you trust',
        bgColor: ACTION_COLOR.blend,
        icon: 'blend',
        onPress: () => navigation.navigate('InvitePairIntro'),
      });
    }
    if (!enrollment) {
      list.push({
        id: 'onboarding-course',
        mainText: 'Start the 21-Day Journey',
        subText: 'Begin the guided emotional wellness course',
        bgColor: ACTION_COLOR.graduation,
        icon: 'graduation',
        onPress: () => navigation.navigate('CourseEnroll'),
      });
    }
    if ((user.last7CheckIns?.length ?? 0) < 7) {
      list.push({
        id: 'onboarding-checkins',
        mainText: 'Build your check-in streak',
        subText: 'Check in 7 times to unlock your trends',
        bgColor: ACTION_COLOR.activity,
        icon: 'activity',
        onPress: () => navigation.navigate('CheckIn'),
      });
    }
    if ((user.groups?.length ?? 0) === 0) {
      list.push({
        id: 'onboarding-group',
        mainText: 'Join a group',
        subText: 'Connect with others on the journey',
        bgColor: ACTION_COLOR.group,
        icon: 'group',
        onPress: () => navigation.navigate('CreateGroup'),
      });
    }

    // 5. Next lesson reminder (only when there's an unfinished lesson to surface)
    if (enrollment) {
      const lastCompletedModuleId =
        typeof enrollment.last_completed_module === 'number'
          ? enrollment.last_completed_module
          : enrollment.last_completed_module?.id ?? 0;
      const nextLesson = enrollment.modules?.find((m) => m.id > lastCompletedModuleId);
      const lessonTitle = enrollment.next_lesson_title ?? nextLesson?.title ?? null;

      if (lessonTitle) {
        const allCompleted =
          allEnrollments.length > 0 &&
          allEnrollments.every((e) => e.completion_status === 'completed');
        list.push({
          id: 'lesson-next',
          mainText: 'Continue your course',
          subText: `Up next: ${lessonTitle}`,
          bgColor: ACTION_COLOR.graduation,
          icon: 'graduation',
          onPress: () => {
            if (allCompleted && allEnrollments.length > 1) {
              navigation.navigate('Enrollments', { enrollments: allEnrollments });
            } else {
              navigation.navigate('CourseDetails', { enrollment: enrollment ?? undefined });
            }
          },
        });
      }
    }

    return list.slice(0, MAX_ACTIONS);
  }, [user, mhfrRequests, enrollment, allEnrollments, navigation]);

  return { actions, loading: !user };
}
