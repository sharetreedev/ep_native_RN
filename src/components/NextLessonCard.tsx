import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, fontSizes, borderRadius } from '../theme';

interface NextLessonCardProps {
  title?: string | null;
  subtitle?: string;
  onPress?: () => void;
  onShowCourse?: () => void;
}

const lessonImage = require('../../assets/Ep - App - Imageryt.webp');

export default function NextLessonCard({ title, subtitle = 'Next Lesson', onPress, onShowCourse }: NextLessonCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.outer}>
      <ImageBackground source={lessonImage} style={styles.image} imageStyle={styles.imageInner}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)']}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <Text style={styles.subtitle}>{title ? subtitle : 'Lessons'}</Text>
            <Text style={styles.title} numberOfLines={2}>
              {title || 'No upcoming lessons'}
            </Text>
            {onShowCourse && (
              <TouchableOpacity onPress={onShowCourse} activeOpacity={0.7} style={styles.showCourseButton}>
                <Text style={styles.showCourseText}>Show Course {'>'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  image: {
    width: '100%',
    minHeight: 152,
  },
  imageInner: {
    borderRadius: 24,
  },
  gradient: {
    flex: 1,
    minHeight: 152,
    justifyContent: 'flex-end',
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.bodySemiBold,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: fontSizes.base,
    fontFamily: fonts.heading,
    color: colors.textOnPrimary,
  },
  showCourseButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
  },
  showCourseText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.bodySemiBold,
    color: colors.textOnPrimary,
  },
});
