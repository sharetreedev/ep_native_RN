import { useCallback, useEffect } from 'react';
import { AccessibilityInfo, InteractionManager } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Announce a screen's title to VoiceOver/TalkBack each time it gains focus.
 *
 * React Navigation's native-stack handles focus for pushed screens reasonably
 * on iOS but is unreliable on Android tab switches and modals — so screens
 * should call this hook with their human-readable title to guarantee an
 * announcement on entry.
 *
 * Pass `undefined` to skip (e.g. while data is loading and the title isn't
 * known yet); the announcement fires when the label becomes defined.
 */
export function useScreenAnnouncement(label: string | undefined): void {
  useFocusEffect(
    useCallback(() => {
      if (!label) return;
      // Defer until the screen transition has completed so the announcement
      // doesn't interrupt the previous screen's residual speech.
      const handle = InteractionManager.runAfterInteractions(() => {
        AccessibilityInfo.announceForAccessibility(label);
      });
      return () => handle.cancel();
    }, [label]),
  );
}

/**
 * Announce a modal's title when it opens. Use alongside `accessibilityViewIsModal`
 * on the modal container so VoiceOver/TalkBack treats the modal as a focus trap.
 */
export function useModalAnnouncement(label: string | undefined, isVisible: boolean): void {
  useEffect(() => {
    if (!isVisible || !label) return;
    const handle = InteractionManager.runAfterInteractions(() => {
      AccessibilityInfo.announceForAccessibility(label);
    });
    return () => handle.cancel();
  }, [label, isVisible]);
}
