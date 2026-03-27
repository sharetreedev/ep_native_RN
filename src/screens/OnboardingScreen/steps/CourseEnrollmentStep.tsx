import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme';
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
    <View style={styles.headerRow}>
      <Image source={require('../../../../assets/Logo.png')} style={styles.logo} />
      <Text style={styles.brandName}>Emotional Pulse</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderHeader()}
        <Text style={styles.heading}>Enrol in a course</Text>
        <Text style={styles.body}>
          Start your journey with a guided course to build your emotional awareness skills.
        </Text>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.spinner} />
        ) : nextCourse ? (
          <View style={styles.courseCard}>
            <Text style={styles.courseTitle}>
              {nextCourse?.courseName ?? 'Available Course'}
            </Text>
            <Text style={styles.courseDescription}>
              {nextCourse?.description ?? 'A guided program to help you understand and manage your emotions.'}
            </Text>
            <Button
              title="Enrol Now"
              onPress={onEnroll}
              loading={isSubmitting}
              style={styles.primaryButton}
            />
          </View>
        ) : (
          <Text style={styles.body}>No courses available at this time.</Text>
        )}
        <Button
          title="Skip for now"
          variant="secondary"
          onPress={onSkip}
          loading={isSubmitting}
          style={styles.skipButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
