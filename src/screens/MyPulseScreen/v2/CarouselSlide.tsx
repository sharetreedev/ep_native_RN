import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  type LayoutChangeEvent,
} from 'react-native';
import { Lock } from 'lucide-react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { getDirectionIcon } from '../../../utils/getDirectionIcon';
import { colors, fonts, fontSizes } from '../../../theme';
import type { AuroraColors } from './AuroraBackground';

const ARROW_BORDER = 'rgba(0, 0, 0, 0.5)';

export type CarouselSlideData = {
  id: 'today' | '7days' | '30days' | 'empty-7days' | 'empty-30days';
  title: string; // eyebrow — e.g. "MY LAST CHECK IN"
  prefix: string; // headline prefix — e.g. "I'm feeling,"
  emotion: string; // headline noun — e.g. "Engaged"
  emotionColor: string; // italic color + arrow border
  sublinePrefix?: string; // subline prefix — e.g. "Usually I'm," or "Before I was,"
  sublineEmotion?: string; // italic emotion name rendered after sublinePrefix
  sublineEmotionColor?: string; // falls back to emotionColor when missing
  directionLabel?: string;
  auroraColors: AuroraColors;
  isEmpty?: boolean;
  /** Copy shown on a locked empty slide. Falls back to a generic message. */
  emptyMessage?: string;
  /** When true, the emotion noun and subline emotion break onto their own
   *  line below their prefix instead of flowing inline. Used by the 7-day
   *  and 30-day slides where the prefix copy is longer. */
  emotionOnNewLine?: boolean;
  /** Significance label of the shift (e.g. "major", "minor"). When present,
   *  a "this is a {significance} shift" line types out below the subline as
   *  the final segment of the typewriter stream. */
  shiftSignificance?: string;
};

const TYPE_INTERVAL_MS = 45;

type Props = {
  slide: CarouselSlideData;
  isActive: boolean;
  /** Reports the natural height of this slide's content (arrow + text block)
   *  back to the parent so the pager can size to fit the tallest slide
   *  rather than rely on a hard-coded height. */
  onContentMeasured?: (height: number) => void;
};

export default function CarouselSlide({ slide, isActive, onContentMeasured }: Props) {
  const reduceMotion = useReducedMotion();

  // Segments of the full typewriter phrase, revealed as one continuous sentence
  // across the title (eyebrow), headline (`prefix` + `emotion`), and subline
  // (`sublinePrefix` + `sublineEmotion`) so the reveal feels like one thought
  // forming.
  const breakBeforeEmotion = !slide.isEmpty && !!slide.emotionOnNewLine;
  const sep = breakBeforeEmotion ? '\n' : ' ';
  const title = slide.isEmpty ? '' : slide.title;
  const prefix = slide.isEmpty ? '' : slide.prefix;
  const emotion = slide.isEmpty ? '' : `${sep}${slide.emotion}`;
  const hasSubline = !slide.isEmpty && !!slide.sublinePrefix && !!slide.sublineEmotion;
  const sublinePrefix = hasSubline ? slide.sublinePrefix! : '';
  const sublineEmotion = hasSubline ? `${sep}${slide.sublineEmotion!}` : '';
  const shiftText =
    !slide.isEmpty && slide.shiftSignificance
      ? `this is a ${slide.shiftSignificance.toLowerCase()} shift`
      : '';
  const total =
    title.length +
    prefix.length +
    emotion.length +
    sublinePrefix.length +
    sublineEmotion.length +
    shiftText.length;

  // Start empty so the first swipe-to doesn't flash the full text for one
  // frame before useEffect resets it. The effect below will hydrate to
  // `total` immediately for reduce-motion users or already-typed slides.
  const [typedCount, setTypedCount] = useState(0);
  const [showArrow, setShowArrow] = useState(false);
  const hasTypedRef = useRef(false);

  useEffect(() => {
    if (slide.isEmpty) return;
    if (!isActive) return;

    // Only run the typewriter on the FIRST focus of this slide.
    // Subsequent re-renders or re-focus jump straight to the final state.
    if (reduceMotion || hasTypedRef.current) {
      setTypedCount(total);
      setShowArrow(true);
      return;
    }

    setTypedCount(0);
    setShowArrow(false);
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      if (i <= total) {
        setTypedCount(i);
      } else {
        clearInterval(timer);
        setShowArrow(true);
        hasTypedRef.current = true;
      }
    }, TYPE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isActive, total, reduceMotion, slide.isEmpty]);

  const handleContentLayout = useCallback(
    (e: LayoutChangeEvent) => {
      onContentMeasured?.(e.nativeEvent.layout.height);
    },
    [onContentMeasured],
  );

  if (slide.isEmpty) {
    return (
      <View style={styles.slide}>
        <View style={styles.contentWrap} onLayout={handleContentLayout}>
          <Text style={styles.eyebrow} allowFontScaling={false}>
            {slide.title}
          </Text>
          <View style={styles.lockedCard}>
            <View style={styles.lockIconWrap}>
              <Lock color={colors.textSecondary} size={24} strokeWidth={2} />
            </View>
            <Text style={styles.lockedText} allowFontScaling={false}>
              {slide.emptyMessage ?? 'Check in for 7 days to see your trends'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Offsets into the concatenated typewriter stream.
  const titleEnd = title.length;
  const prefixEnd = titleEnd + prefix.length;
  const emotionEnd = prefixEnd + emotion.length;
  const sublinePrefixEnd = emotionEnd + sublinePrefix.length;
  const sublineEmotionEnd = sublinePrefixEnd + sublineEmotion.length;

  const displayedTitle = title.slice(0, Math.min(typedCount, titleEnd));
  const displayedPrefix =
    typedCount > titleEnd ? prefix.slice(0, Math.min(typedCount - titleEnd, prefix.length)) : '';
  const displayedEmotion =
    typedCount > prefixEnd ? emotion.slice(0, Math.min(typedCount - prefixEnd, emotion.length)) : '';
  const displayedSublinePrefix =
    typedCount > emotionEnd ? sublinePrefix.slice(0, Math.min(typedCount - emotionEnd, sublinePrefix.length)) : '';
  const displayedSublineEmotion =
    typedCount > sublinePrefixEnd
      ? sublineEmotion.slice(0, Math.min(typedCount - sublinePrefixEnd, sublineEmotion.length))
      : '';
  const displayedShift =
    typedCount > sublineEmotionEnd
      ? shiftText.slice(0, Math.min(typedCount - sublineEmotionEnd, shiftText.length))
      : '';

  return (
    <View style={styles.slide}>
      <View style={styles.contentWrap} onLayout={handleContentLayout}>
        <View style={styles.arrowSlot}>
          {showArrow && (
            <View style={[styles.arrowBox, { borderColor: ARROW_BORDER }]}>
              {getDirectionIcon(slide.directionLabel, 33)}
            </View>
          )}
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.eyebrow} allowFontScaling={false}>
            {displayedTitle}
          </Text>

          {typedCount > titleEnd && (
            <Text style={styles.headline} allowFontScaling={false}>
              {displayedPrefix}
              {displayedEmotion.length > 0 && (
                <Text style={styles.emotion}>{displayedEmotion}</Text>
              )}
            </Text>
          )}

          {hasSubline && typedCount > emotionEnd && (
            <Text style={styles.subline} allowFontScaling={false}>
              {displayedSublinePrefix}
              {displayedSublineEmotion.length > 0 && (
                <Text style={styles.sublineEmotion}>{displayedSublineEmotion}</Text>
              )}
            </Text>
          )}

          {shiftText.length > 0 && typedCount > sublineEmotionEnd && (
            <Text style={styles.shiftLine} allowFontScaling={false}>
              {displayedShift}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  // Inner wrapper whose height we measure via onLayout so the carousel can
  // grow to fit the tallest slide instead of clipping at a fixed height.
  contentWrap: {
    alignSelf: 'stretch',
    gap: 8,
  },
  eyebrow: {
    fontFamily: fonts.headingMedium,
    fontSize: fontSizes.xs + 2,
    color: '#4A4A4A',
    marginBottom: 8,
  },
  arrowSlot: {
    height: 53,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 4,
  },
  arrowBox: {
    width: 53,
    height: 53,
    borderWidth: 2,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    paddingVertical: 20,
    paddingHorizontal: 0,
  },
  headline: {
    fontFamily: fonts.headingMedium,
    fontStyle: 'italic',
    fontSize: 26,
    color: '#4A4A4A',
    textAlign: 'left',
    lineHeight: 32,
    paddingBottom: Platform.OS === 'android' ? 2 : 0,
  },
  emotion: {
    fontFamily: fonts.heading,
    fontStyle: 'normal',
    color: colors.textPrimary,
  },
  subline: {
    fontFamily: fonts.headingMedium,
    fontStyle: 'italic',
    fontSize: 26,
    color: '#4A4A4A',
    textAlign: 'left',
    lineHeight: 32,
    marginTop: 4,
    paddingBottom: Platform.OS === 'android' ? 2 : 0,
  },
  sublineEmotion: {
    fontFamily: fonts.heading,
    fontStyle: 'normal',
    color: colors.textPrimary,
  },
  shiftLine: {
    fontFamily: fonts.headingMedium,
    fontSize: fontSizes.xs + 2,
    color: '#4A4A4A',
    marginTop: 12,
  },
  // Frosted "locked" card shown on empty 7-/30-day slides.
  // We can't run a true gaussian blur without adding expo-blur, so we rely
  // on a translucent white panel with a soft border to read as unavailable.
  lockedCard: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 20,
  },
  lockIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
  },
  lockedText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
