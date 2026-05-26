/**
 * Intercom messenger integration.
 *
 * The native module is provided by the `@intercom/intercom-react-native`
 * Expo config plugin (see `app.json` → plugins). Native init is automatic at
 * build time — there is NO runtime `initialize()` call (unlike OneSignal),
 * so this file only handles user identity + presenting the messenger.
 *
 * Guarded the same way OneSignal is in `App.tsx`: the native module does not
 * exist on web or in Expo Go, so we require it lazily and no-op if absent.
 *
 * NOTE: Intercom ships native code — changes here that depend on a new SDK
 * version cannot be delivered via OTA; they need a fresh EAS build.
 */
import { Platform, Alert } from 'react-native';
import { logger } from './logger';

type IntercomModule = typeof import('@intercom/intercom-react-native').default;

let Intercom: IntercomModule | null = null;
if (Platform.OS !== 'web') {
  try {
    Intercom = require('@intercom/intercom-react-native').default;
  } catch (e) {
    logger.warn('[Intercom] Native module not available (Expo Go?):', e);
  }
}

/** Identify the signed-in user to Intercom. Call after login / session restore. */
export async function identifyIntercomUser(user: { id: string; email: string }): Promise<void> {
  try {
    await Intercom?.loginUserWithUserAttributes({
      userId: user.id,
      email: user.email,
    });
  } catch (e) {
    logger.warn('[Intercom] loginUser failed:', e);
  }
}

/** Clear the Intercom session. Call from the logout / runtime-reset path. */
export async function logoutIntercomUser(): Promise<void> {
  try {
    await Intercom?.logout();
  } catch (e) {
    logger.warn('[Intercom] logout failed:', e);
  }
}

/** Open the Intercom messenger (e.g. from a "Help & Support" button). */
export async function presentIntercom(): Promise<void> {
  if (!Intercom) {
    // Native module absent — almost always Expo Go, or a dev client built
    // before the Intercom config plugin was added. Surface it loudly in dev
    // so a tester doesn't mistake it for a dead button; silent no-op in prod
    // (where this branch should never be reached on a correctly-built app).
    if (__DEV__) {
      Alert.alert(
        'Intercom not in this build',
        'The Intercom native module is missing. It cannot run in Expo Go — rebuild the dev client so the config plugin is included:\n\n• eas build --profile development\n  (then expo start --dev-client)\n• or npx expo prebuild --clean && npx expo run:ios / run:android',
      );
    }
    return;
  }
  // Intercom requires a registered user (identified OR unidentified) before
  // `present()` will actually show the messenger. AuthContext calls
  // `loginUserWithUserAttributes` after sign-in, but the Help button on the
  // AuthScreen / OnboardingScreen fires BEFORE that — without a session,
  // `present()` silently does nothing and the button looks broken.
  //
  // Try to ensure there's at least an unidentified session before
  // presenting. Calling `loginUnidentifiedUser` when an identified user
  // is already logged in throws (it does NOT clobber the existing
  // identified session); we swallow that error and proceed.
  try {
    await (Intercom as any).loginUnidentifiedUser();
  } catch (e) {
    // Most common cause: a user is already logged in. Fine to ignore.
    logger.log(
      '[Intercom] loginUnidentifiedUser skipped (likely already logged in):',
      e instanceof Error ? e.message : e,
    );
  }
  try {
    await Intercom.present();
  } catch (e) {
    logger.warn('[Intercom] present failed:', e);
  }
}
