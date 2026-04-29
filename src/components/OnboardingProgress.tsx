import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckCircle2, Circle, Camera, Bell, Blend, BookOpen, Activity, UsersRound, ChevronRight } from 'lucide-react-native';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../theme';
import type { User } from '../contexts/AuthContext';
import type { XanoEnrollment } from '../api';

// Earthy colour palette for each card
const CARD_THEMES = [
  { bg: 'rgba(145, 162, 125, 0.35)', iconBg: 'rgba(145, 162, 125, 0.45)', accent: '#6B7D5A' },   // sage green
  { bg: 'rgba(184, 144, 122, 0.35)', iconBg: 'rgba(184, 144, 122, 0.45)', accent: '#A07A66' },   // warm clay
  { bg: 'rgba(110, 127, 141, 0.35)', iconBg: 'rgba(110, 127, 141, 0.45)', accent: '#5A6B78' },   // slate blue
  { bg: 'rgba(106, 143, 138, 0.35)', iconBg: 'rgba(106, 143, 138, 0.45)', accent: '#587B76' },   // teal
  { bg: 'rgba(168, 136, 100, 0.35)', iconBg: 'rgba(168, 136, 100, 0.45)', accent: '#8B7355' },   // warm brown
  { bg: 'rgba(142, 125, 162, 0.35)', iconBg: 'rgba(142, 125, 162, 0.45)', accent: '#7A6B8A' },   // muted lavender
];

interface OnboardingItemDef {
  label: string;
  description: string;
  completed: boolean;
  iconName: 'camera' | 'bell' | 'blend' | 'book' | 'activity' | 'group';
  onPress: () => void;
  themeIndex: number;
}

interface OnboardingProgressProps {
  user: User;
  enrollment: XanoEnrollment | null;
  onNavigate: (screen: string, params?: any) => void;
  onEnrollCourse?: () => void;
}

function renderIcon(name: string, color: string) {
  const size = 22;
  switch (name) {
    case 'camera': return <Camera color={color} size={size} />;
    case 'bell': return <Bell color={color} size={size} />;
    case 'blend': return <Blend color={color} size={size} />;
    case 'book': return <BookOpen color={color} size={size} />;
    case 'activity': return <Activity color={color} size={size} />;
    case 'group': return <UsersRound color={color} size={size} />;
    default: return <Circle color={color} size={size} />;
  }
}

function OnboardingProgress({ user, enrollment, onNavigate, onEnrollCourse }: OnboardingProgressProps) {
  const items: OnboardingItemDef[] = useMemo(() => {
    const raw: OnboardingItemDef[] = [
      {
        label: 'Profile Picture',
        description: 'Add a photo so your pairs can recognise you',
        completed: !!user.avatarUrl,
        iconName: 'camera',
        onPress: () => onNavigate('EditProfile'),
        themeIndex: 0,
      },
      {
        label: 'Set Reminders',
        description: 'Stay on track with check-in reminders',
        completed: !!user.reminderFrequency && user.reminderFrequency !== 'NONE',
        iconName: 'bell',
        onPress: () => onNavigate('Reminders'),
        themeIndex: 1,
      },
      {
        label: (user.pairs?.length ?? 0) > 0 ? 'Pair Connected' : 'Invite a Pair',
        description: (user.pairs?.length ?? 0) > 0 ? `You have ${user.pairs!.length} pair${user.pairs!.length > 1 ? 's' : ''}` : 'Connect with someone to share your journey',
        completed: (user.pairs?.length ?? 0) > 0,
        iconName: 'blend',
        onPress: () => onNavigate('InvitePairIntro'),
        themeIndex: 2,
      },
      {
        label: '21-Day Journey',
        description: 'Start the guided emotional wellness course',
        completed: !!enrollment,
        iconName: 'book',
        onPress: () => {
          if (enrollment) {
            onNavigate('CourseDetails', { enrollment });
          } else if (onEnrollCourse) {
            onEnrollCourse();
          }
        },
        themeIndex: 3,
      },
      {
        label: 'Check In 7 Times',
        description: 'Build the habit with your first week of check-ins',
        completed: (user.last7CheckIns?.length ?? 0) >= 7,
        iconName: 'activity',
        onPress: () => onNavigate('CheckIn'),
        themeIndex: 4,
      },
      {
        label: (user.groups?.length ?? 0) > 0 ? 'Group Joined' : 'Join a Group',
        description: (user.groups?.length ?? 0) > 0 ? `You're in ${user.groups!.length} group${user.groups!.length > 1 ? 's' : ''}` : 'Join or create a group to share with others',
        completed: (user.groups?.length ?? 0) > 0,
        iconName: 'group',
        onPress: () => onNavigate('CreateGroup'),
        themeIndex: 5,
      },
    ];

    // Sort: incomplete first, completed last
    return raw.sort((a, b) => Number(a.completed) - Number(b.completed));
  }, [user, enrollment, onNavigate]);

  const completedCount = items.filter(i => i.completed).length;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Get Started</Text>
        <Text style={styles.progress}>{completedCount}/{items.length}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollBleed}
      >
        {items.map((item, index) => {
          const theme = CARD_THEMES[item.themeIndex];
          const iconColor = item.completed ? colors.primary : theme.accent;

          return (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.card,
                item.completed
                  ? { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: colors.primary, opacity: 0.5 }
                  : { backgroundColor: '#FFFFFF' },
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.cardIcon}>
                  {renderIcon(item.iconName, iconColor)}
                </View>
                {item.completed ? (
                  <CheckCircle2 color={colors.primary} size={20} fill={colors.primaryLight} />
                ) : (
                  <ChevronRight color={iconColor} size={16} />
                )}
              </View>
              <View>
                <Text style={[styles.cardLabel, item.completed && styles.cardLabelCompleted]} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={[styles.cardDescription, item.completed && styles.cardDescriptionCompleted]} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = 300;

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
  },
  progress: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
  },
  scrollBleed: {
    marginHorizontal: -16,
  },
  scrollContent: {
    gap: spacing.sm,
    paddingHorizontal: 16,
  },
  card: {
    width: CARD_WIDTH,
    minHeight: 120,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIcon: {
    alignItems: 'flex-start',
  },
  cardLabel: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bodyBold,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  cardLabelCompleted: {
    color: colors.darkForest,
  },
  cardDescription: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    opacity: 0.7,
    marginTop: 2,
    lineHeight: 16,
  },
  cardDescriptionCompleted: {
    color: colors.darkForest,
  },
});

export default React.memo(OnboardingProgress);
