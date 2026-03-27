import { Emotion as BaseEmotion, EMOTIONS as ALL_EMOTIONS } from '../../constants/emotions';

export type Emotion = BaseEmotion;

export const EMOTIONS = ALL_EMOTIONS;

export function findEmotionAtCoordinate(row: number, col: number): Emotion | undefined {
    return EMOTIONS.find(e => e.row === row && e.col === col);
}
