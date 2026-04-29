import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import CarouselSlide, { type CarouselSlideData } from './CarouselSlide';
import { colors } from '../../../theme';

type Props = {
  slides: CarouselSlideData[];
  /** Fired with the new active slide index whenever the user swipes. */
  onActiveSlideChange?: (index: number) => void;
};

// Initial height used until slides report their natural content height.
// Sized to comfortably hold the today slide; 7d/30d slides are taller and
// will grow the pager once measured.
const INITIAL_PAGER_HEIGHT = 240;

export default function EmotionCarousel({ slides, onActiveSlideChange }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [pagerHeight, setPagerHeight] = useState(INITIAL_PAGER_HEIGHT);

  useEffect(() => {
    onActiveSlideChange?.(activeIndex);
  }, [activeIndex, onActiveSlideChange]);

  const handlePageSelected = useCallback((e: { nativeEvent: { position: number } }) => {
    setActiveIndex(e.nativeEvent.position);
  }, []);

  // Each slide reports its natural content height once it lays out (and
  // again as the typewriter reveals more text). We keep the running max so
  // the pager grows to fit the tallest slide and never clips.
  const handleSlideContentMeasured = useCallback((height: number) => {
    setPagerHeight((prev) => (height > prev ? height : prev));
  }, []);

  if (slides.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <PagerView
        style={[styles.pager, { height: pagerHeight }]}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        {slides.map((slide, i) => (
          <View key={slide.id} style={styles.page}>
            <CarouselSlide
              slide={slide}
              isActive={i === activeIndex}
              onContentMeasured={handleSlideContentMeasured}
            />
          </View>
        ))}
      </PagerView>

      <View style={styles.dotsRow}>
        {slides.map((slide, i) => (
          <View
            key={slide.id}
            style={[
              styles.dot,
              i === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  pager: {
    width: '100%',
  },
  page: { flex: 1 },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: { backgroundColor: colors.textPrimary },
  dotInactive: { backgroundColor: 'rgba(0,0,0,0.2)' },
});
