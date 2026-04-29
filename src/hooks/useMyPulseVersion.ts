import { useCallback, useEffect, useSyncExternalStore } from 'react';
import * as SecureStore from 'expo-secure-store';
import { reportError } from '../lib/logger';

export type MyPulseVersion = 'v1' | 'v2';

const STORAGE_KEY = 'mypulse_version';
const DEFAULT_VERSION: MyPulseVersion = 'v1';

function isValidVersion(raw: string | null | undefined): raw is MyPulseVersion {
  return raw === 'v1' || raw === 'v2';
}

// Shared module-level store so every `useMyPulseVersion()` call sees the
// same value and re-renders together. A naive per-component `useState` made
// the toggle in AccountScreen invisible to a still-mounted MyPulseScreen
// until the app restarted.
type State = { version: MyPulseVersion; loading: boolean };
let state: State = { version: DEFAULT_VERSION, loading: true };
const subscribers = new Set<() => void>();
let hydrationStarted = false;

function setState(next: State) {
  if (next.version === state.version && next.loading === state.loading) return;
  state = next;
  for (const cb of subscribers) cb();
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

async function hydrate() {
  if (hydrationStarted) return;
  hydrationStarted = true;
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    setState({
      version: isValidVersion(raw) ? raw : DEFAULT_VERSION,
      loading: false,
    });
  } catch (e) {
    reportError('useMyPulseVersion.read', e);
    setState({ version: state.version, loading: false });
  }
}

export function useMyPulseVersion() {
  useEffect(() => {
    hydrate();
  }, []);

  const snapshot = useSyncExternalStore(subscribe, () => state, () => state);

  const setVersion = useCallback(async (next: MyPulseVersion) => {
    setState({ version: next, loading: false });
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, next);
    } catch (e) {
      reportError('useMyPulseVersion.write', e);
    }
  }, []);

  return {
    version: snapshot.version,
    setVersion,
    loading: snapshot.loading,
  };
}
