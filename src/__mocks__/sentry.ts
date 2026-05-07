// Stub for @sentry/react-native used in jest. The real SDK transitively
// imports React Native internals that hit Flow-syntax issues under Hermes
// parser. Tests don't exercise Sentry, so a no-op stub is sufficient.
export const captureException = jest.fn();
export const captureEvent = jest.fn();
export const captureMessage = jest.fn();
export const init = jest.fn();
export const wrap = <T>(component: T): T => component;
export const mobileReplayIntegration = jest.fn(() => ({}));
export const feedbackIntegration = jest.fn(() => ({}));
