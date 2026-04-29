import React from 'react';
import PulseLoader from '../../components/PulseLoader';
import { useMyPulseVersion } from '../../hooks/useMyPulseVersion';
import MyPulseScreenV1 from './MyPulseScreenV1';
import MyPulseScreenV2 from './MyPulseScreenV2';

/**
 * Renders v1 (current) or v2 (redesign) based on the user's per-device
 * preference from `useMyPulseVersion`. The chooser sits above any other
 * hooks so the v1/v2 components own their own data fetching independently
 * — Rules-of-Hooks safe across toggle.
 *
 * Toggle UI: Account → Display → "Try the new My Pulse".
 */
export default function MyPulseScreen() {
  const { version, loading } = useMyPulseVersion();
  if (loading) return <PulseLoader />;
  return version === 'v2' ? <MyPulseScreenV2 /> : <MyPulseScreenV1 />;
}
