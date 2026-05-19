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
import { Platform } from 'react-native';
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
  try {
    await Intercom?.present();
  } catch (e) {
    logger.warn('[Intercom] present failed:', e);
  }
}
