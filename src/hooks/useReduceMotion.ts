import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Tracks the OS-level "Reduce Motion" accessibility setting.
 *
 * Components that animate (gradients, pulses, mesh sliders, tooltip slides
 * etc.) must opt out — or fall back to a static state — when this returns
 * true to avoid vestibular harm. iOS Settings → Accessibility → Motion;
 * Android Settings → Accessibility → Remove animations.
 */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!cancelled) setReduce(enabled);
      })
      .catch(() => {
        // Some platforms (web, very old RN) reject — assume motion is fine
        if (!cancelled) setReduce(false);
      });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  return reduce;
}
