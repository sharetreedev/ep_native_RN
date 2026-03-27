import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/Button';
import { styles } from '../styles';

const INTRO_SLIDES = [
  {
    title: 'A daily checkin is like a seatbelt for mental health',
    description:
      'A daily emotional check-in is like wearing a seatbelt. It allows you to cruise through life safely and with confidence.',
    image: require('../../../../assets/Logo.png'),
  },
  {
    title: 'Make it a road trip with Pairs',
    description:
      'Check-in with how your friends, family and trusted colleagues are doing by forming a pair to support each other through the highs and the lows.',
    image: require('../../../../assets/Logo.png'),
  },
  {
    title: 'Go further with Groups',
    description:
      'Create groups to anonymously share your state, gage the overall mood and make sure no one is at risk.',
    image: require('../../../../assets/Logo.png'),
  },
  {
    title: 'Call for help when you get stuck',
    description:
      'Reach out to our Mental Health First Responder network whenever you need help.',
    image: require('../../../../assets/Logo.png'),
  },
];

interface IntroSlidesStepProps {
  onComplete: () => void;
}

export default function IntroSlidesStep({ onComplete }: IntroSlidesStepProps) {
  const [slideIndex, setSlideIndex] = useState(0);

  const handleNext = useCallback(() => {
    if (slideIndex < INTRO_SLIDES.length - 1) {
      setSlideIndex(slideIndex + 1);
    } else {
      onComplete();
    }
  }, [slideIndex, onComplete]);

  const handleBack = useCallback(() => {
    if (slideIndex > 0) setSlideIndex(slideIndex - 1);
  }, [slideIndex]);

  const slide = INTRO_SLIDES[slideIndex];

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
        <View style={styles.slideImageContainer}>
          <Image source={slide.image} style={styles.slideImage} resizeMode="cover" />
        </View>
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideDescription}>{slide.description}</Text>
        <View style={styles.slideButtons}>
          {slideIndex > 0 ? (
            <Button title="Back" variant="secondary" onPress={handleBack} style={styles.slideButton} />
          ) : (
            <View style={styles.slideButton} />
          )}
          <Button title="Next  ›" onPress={handleNext} style={styles.slideButton} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
