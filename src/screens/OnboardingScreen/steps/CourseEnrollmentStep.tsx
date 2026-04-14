import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../../theme';
import Button from '../../../components/Button';
import { styles } from '../styles';

interface CourseEnrollmentStepProps {
  nextCourse: any;
  onEnroll: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
  isLoading?: boolean;
}

export default function CourseEnrollmentStep({
  nextCourse,
  onEnroll,
  onSkip,
  isSubmitting,
  isLoading,
}: CourseEnrollmentStepProps) {
  const renderHeader = () => (
    <View style={[styles.headerRow, courseStyles.headerCompact]}>
      <Image source={require('../../../../assets/Logo.png')} style={styles.logo} />
      <Text style={styles.brandName}>Emotional Pulse</Text>
    </View>
  );

  const courseName = nextCourse?.courseName ?? nextCourse?.name ?? 'Seatbelt for Mental Health Mini Course';
  const courseDescription = nextCourse?.description ?? '';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderHeader()}

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.spinner} />
        ) : nextCourse ? (
          <View style={courseStyles.card}>
            <Text style={courseStyles.label}>Mini Courses</Text>
            <Text style={courseStyles.title}>{courseName}</Text>

            {courseDescription ? (
              <Text style={courseStyles.description}>{courseDescription}</Text>
            ) : (
              <>
                <Text style={courseStyles.description}>
                  This is a 21 day mini-course that helps you build emotional resilience and wellbeing, strengthen relationships and implement a daily practice to protect your mental health (like a seatbelt for mental health).
                </Text>

                <Text style={courseStyles.description}>
                  <Text style={courseStyles.descriptionBold}>Why Join: </Text>
                  <Text>It's free, hands-free, and fits easily into a coffee break with a short audio each day.</Text>
                </Text>

                <Text style={courseStyles.description}>
                  <Text style={courseStyles.descriptionBold}>What You'll Gain: </Text>
                  <Text>Learn to shift out of stress fast, stay in your flow zone longer, and think clearer. Master the LIFT method to support people you care about — and earn your certified badge. Boost emotional leadership skills and help create a culture of care at work and home.</Text>
                </Text>

                <Text style={courseStyles.description}>
                  <Text>Tap </Text>
                  <Text style={courseStyles.descriptionBold}>"Enroll"</Text>
                  <Text> and your first lesson arrives tomorrow.</Text>
                </Text>

                <Text style={courseStyles.descriptionLast}>
                  Connection protects. Let's make support as normal as saying hello.
                </Text>
              </>
            )}

          </View>
        ) : (
          <Text style={styles.body}>No courses available at this time.</Text>
        )}
      </ScrollView>
      <View style={courseStyles.buttons}>
        <Button
          title="Enroll"
          onPress={onEnroll}
          loading={isSubmitting}
          style={courseStyles.enrollButton}
        />
        <Button
          title="Do Later"
          variant="secondary"
          onPress={onSkip}
          loading={isSubmitting}
          style={courseStyles.laterButton}
        />
      </View>
    </SafeAreaView>
  );
}

const courseStyles = StyleSheet.create({
  headerCompact: {
    marginBottom: spacing.base,
  },
  card: {
    padding: 0,
  },
  label: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bodySemiBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.heading,
    color: colors.primary,
    lineHeight: 32,
    marginBottom: spacing.base,
  },
  description: {
    fontSize: fontSizes.md,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  descriptionLast: {
    fontSize: fontSizes.md,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  descriptionBold: {
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    paddingBottom: spacing.xl,
  },
  enrollButton: {
    flex: 1,
  },
  laterButton: {
    flex: 1,
  },
});
