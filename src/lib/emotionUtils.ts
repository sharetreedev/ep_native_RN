import { Emotion, EMOTIONS } from '../constants/emotions';

/** Emotion tile IDs that use light (white) text for contrast on dark backgrounds */
const LIGHT_LABEL_EMOTION_IDS = [
  'enraged',
  'angry',
  'ecstatic',
  'excited',
  'overwhelmed',
  'depressed',
  'blissful',
];

/**
 * Returns whether an emotion tile should use light or dark label text.
 * Use for EmotionSquare, EmotionDetailScreen, CheckInSliderFlow result card, etc.
 */
export function getEmotionLabelContrast(emotionId: string): 'light' | 'dark' {
  return LIGHT_LABEL_EMOTION_IDS.includes(emotionId) ? 'light' : 'dark';
}

/**
 * Maps pleasantness (-4..4) and energy (-4..4) from the slider flow to a grid cell,
 * then returns the corresponding Emotion. Grid: row 0 = high energy, row 3 = low;
 * col 0 = low pleasantness, col 3 = high.
 */
export function getEmotionFromPleasantnessAndEnergy(
  pleasantness: number,
  energy: number
): Emotion {
  let col = 0;
  if (pleasantness > 2) col = 3;
  else if (pleasantness > 0) col = 2;
  else if (pleasantness > -2) col = 1;

  let row = 0;
  if (energy > 2) row = 0;
  else if (energy > 0) row = 1;
  else if (energy > -2) row = 2;
  else row = 3;

  const emotion =
    EMOTIONS.find((e) => e.row === row && e.col === col) ??
    EMOTIONS.find((e) => e.id === 'content')!;
  return emotion;
}
