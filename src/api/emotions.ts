import { request } from './client';
import type { XanoStateCoordinate, XanoEmotionState } from './types';
import type { Body } from './schema';

// SPEC NOTE: swagger types all fields (including `id`) as optional, but hooks
// like useEmotionStates / useStateCoordinates rely on `id` being required.
// Keep hand-rolled types for the list endpoints until the spec marks `id`
// as required.
export const emotions = {
  getAllCoordinates: () =>
    request<XanoStateCoordinate[]>('GET', '/emotions/get_all_coordinates'),

  getAllStates: () =>
    request<XanoEmotionState[]>('GET', '/emotions/get_all_states'),

  // Single-record GETs use the spec body — the wider hand-rolled shape was
  // never load-bearing for these (no consumer destructures `id`).
  getCoordinate: (stateCoordinatesId: number) =>
    request<Body<'api/emotions/get_coordinate|GET'>>(
      'GET', '/emotions/get_coordinate', { state_coordinates_id: stateCoordinatesId },
    ),

  getState: (emotionStatesId: number) =>
    request<Body<'api/emotions/get_state|GET'>>(
      'GET', '/emotions/get_state', { emotion_states_id: emotionStatesId },
    ),
};

// Backward-compat alias used by useEmotionStates and useStateCoordinates
export const staticData = {
  getEmotionStates: emotions.getAllStates,
  getStateCoordinates: emotions.getAllCoordinates,
};
