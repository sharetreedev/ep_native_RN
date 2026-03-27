import { request } from './client';
import type { XanoStateCoordinate, XanoEmotionState } from './types';

export const emotions = {
  getAllCoordinates: () =>
    request<XanoStateCoordinate[]>('GET', '/emotions/get_all_coordinates'),

  getAllStates: () =>
    request<XanoEmotionState[]>('GET', '/emotions/get_all_states'),

  getCoordinate: (stateCoordinatesId: number) =>
    request<XanoStateCoordinate>('GET', '/emotions/get_coordinate', { state_coordinates_id: stateCoordinatesId }),

  getState: (emotionStatesId: number) =>
    request<XanoEmotionState>('GET', '/emotions/get_state', { emotion_states_id: emotionStatesId }),
};

// Backward-compat alias used by useEmotionStates and useStateCoordinates
export const staticData = {
  getEmotionStates: emotions.getAllStates,
  getStateCoordinates: emotions.getAllCoordinates,
};
