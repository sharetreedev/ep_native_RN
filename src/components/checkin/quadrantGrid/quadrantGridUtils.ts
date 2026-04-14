import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const MAX_EMOTION_TILES = 4;
export const DESC_TRUNCATE = 28;
export const GRID_PADDING = 20;
export const TILE_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2) / 2;

const LIGHT_TEXT_EMOTIONS = ['depressed', 'ecstatic', 'enraged', 'blissful'];

export function getEmotionFontColor(name: string): string {
  return LIGHT_TEXT_EMOTIONS.includes(name.toLowerCase()) ? '#FFFFFF' : '#1F2937';
}

export interface Quadrant {
  key: string;
  label: string;
  energy: 'high' | 'low';
  pleasantness: 'high' | 'low';
  color: string;
  fontColor: string;
}

export const QUADRANTS: Quadrant[] = [
  { key: 'high-low', label: 'High Energy\nUnpleasant', energy: 'high', pleasantness: 'low', color: '#CA501C', fontColor: '#FFFFFF' },
  { key: 'high-high', label: 'High Energy\nPleasant', energy: 'high', pleasantness: 'high', color: '#6FAD42', fontColor: '#FFFFFF' },
  { key: 'low-low', label: 'Low Energy\nUnpleasant', energy: 'low', pleasantness: 'low', color: '#9B9D93', fontColor: '#FFFFFF' },
  { key: 'low-high', label: 'Low Energy\nPleasant', energy: 'low', pleasantness: 'high', color: '#7EA8BE', fontColor: '#FFFFFF' },
];
