import { useState, useEffect } from 'react';
import { staticData, XanoEmotionState } from '../api';
import { EMOTIONS, Emotion } from '../constants/emotions';

// Map from API order (1-indexed, row-major) to grid row/col
function mapOrderToRowCol(order: number): { row: number; col: number } {
  const idx = order - 1; // 1-indexed → 0-indexed
  return { row: Math.floor(idx / 4), col: idx % 4 };
}

export interface MappedEmotion extends Emotion {
  xanoId: number;
  emotionColour: string;
  themeColour: string;
  themeFontColour?: string;
}

interface UseEmotionStatesResult {
  emotionStates: MappedEmotion[];
  isLoading: boolean;
  error: string | null;
}

function mergeWithFallback(apiData: XanoEmotionState[]): MappedEmotion[] {
  return apiData
    .slice()
    .sort((a, b) => a.id - b.id)
    .map((state, index) => {
      // Use `order` if provided, otherwise fall back to array position (1-indexed)
      const order = state.order ?? index + 1;
      const { row, col } = mapOrderToRowCol(order);
      const fallback = EMOTIONS.find((e) => e.row === row && e.col === col);
      return {
        id: fallback?.id ?? String(state.id),
        name: state.Display,
        color: fallback?.color ?? 'bg-gray-400',
        quadrant: fallback?.quadrant ?? (fallback?.id as any) ?? state.Display.toLowerCase(),
        energy: fallback?.energy ?? 'low',
        pleasantness: fallback?.pleasantness ?? 'low',
        row,
        col,
        description: state.definition ?? fallback?.description ?? '',
        regulationStrategy: state.MHFR_action ?? fallback?.regulationStrategy ?? '',
        xanoId: state.id,
        emotionColour: state.emotionColour,
        themeColour: state.themeColour,
        themeFontColour: state.themeFontColour,
      } satisfies MappedEmotion;
    });
}

export function useEmotionStates(): UseEmotionStatesResult {
  const [emotionStates, setEmotionStates] = useState<MappedEmotion[]>(() =>
    EMOTIONS.map((e) => ({
      ...e,
      xanoId: 0,
      emotionColour: '',
      themeColour: '',
    }))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await staticData.getEmotionStates();
        if (!cancelled && data.length > 0) {
          setEmotionStates(mergeWithFallback(data));
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? 'Failed to load emotion states');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { emotionStates, isLoading, error };
}
