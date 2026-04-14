import { Dimensions } from 'react-native';
import { MappedEmotion } from '../../../hooks/useEmotionStates';
import { XanoStateCoordinate } from '../../../api';
import { logger } from '../../../lib/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PADDING = 20;
export const PALETTE_ACTUAL = SCREEN_WIDTH - PADDING * 2;
export const CURSOR_SIZE = 32;
export const HAPTIC_THROTTLE_MS = 80;
export const DESC_TRUNCATE = 28;
export const BASE_BG = '#f5f3ee';

export function buildEmotionGrid(emotions: MappedEmotion[]): (MappedEmotion | null)[][] {
  const grid: (MappedEmotion | null)[][] = Array.from({ length: 4 }, () => Array(4).fill(null));
  for (const e of emotions) {
    if (e.row >= 0 && e.row < 4 && e.col >= 0 && e.col < 4) {
      grid[e.row][e.col] = e;
    }
  }
  return grid;
}

export function buildQuadrantColors(emotions: MappedEmotion[]) {
  const pick = (energy: 'high' | 'low', pleasantness: 'high' | 'low') => {
    const match = emotions.find(
      (e) => e.energy === energy && e.pleasantness === pleasantness
    );
    return match?.themeColour || match?.emotionColour || '#CCCCCC';
  };
  return {
    topLeft: pick('high', 'low'),
    topRight: pick('high', 'high'),
    bottomLeft: pick('low', 'low'),
    bottomRight: pick('low', 'high'),
  };
}

export function findEmotionAtPosition(
  emotionGrid: (MappedEmotion | null)[][],
  x: number,
  y: number
): MappedEmotion | null {
  const normalizedX = Math.max(0, Math.min(0.9999, x / PALETTE_ACTUAL));
  const normalizedY = Math.max(0, Math.min(0.9999, y / PALETTE_ACTUAL));

  // Map directly to the 4x4 emotion grid (row = y, col = x)
  const row = Math.floor(normalizedY * 4);
  const col = Math.floor(normalizedX * 4);

  return emotionGrid[row]?.[col] ?? null;
}

export function findBestCoordinate(
  coordinates: XanoStateCoordinate[],
  emotion: MappedEmotion,
  x: number,
  y: number
): XanoStateCoordinate | null {
  const emotionCoords = coordinates.filter(c => c.emotion_states_id === emotion.xanoId);
  if (emotionCoords.length === 0) {
    logger.warn(`[MeshGradient] No coordinates found for emotion ${emotion.name} (xanoId=${emotion.xanoId}), total coords: ${coordinates.length}`);
    return null;
  }
  if (emotionCoords.length === 1) return emotionCoords[0];

  // Determine which sub-cell within the emotion's area the touch falls in
  // Each emotion occupies 1/4 of the palette in each axis; subdivide that into 2x2
  const normalizedX = Math.max(0, Math.min(0.9999, x / PALETTE_ACTUAL));
  const normalizedY = Math.max(0, Math.min(0.9999, y / PALETTE_ACTUAL));
  const emotionFracX = (normalizedX * 4) - emotion.col; // 0–1 within emotion cell
  const emotionFracY = (normalizedY * 4) - emotion.row; // 0–1 within emotion cell
  const subCol = emotionFracX >= 0.5 ? 1 : 0;
  const subRow = emotionFracY >= 0.5 ? 1 : 0;

  // Use the same ID-sorted mapping as CheckInTouchGrid: [0,0], [0,1], [1,0], [1,1]
  const sorted = [...emotionCoords].sort((a, b) => a.id - b.id);
  const targetIdx = subRow * 2 + subCol;
  return sorted[Math.min(targetIdx, sorted.length - 1)];
}
