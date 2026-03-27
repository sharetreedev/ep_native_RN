import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { supportRequests as xanoSupportRequests, XanoSupportRequest } from '../api';

interface MHFRContextValue {
  mhfrRequests: XanoSupportRequest[];
  hasOpenMHFRRequest: boolean;
  refreshMHFRRequests: () => Promise<void>;
}

const MHFRContext = createContext<MHFRContextValue | null>(null);

export function MHFRProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [mhfrRequests, setMhfrRequests] = useState<XanoSupportRequest[]>([]);

  const isMHFR = user?.isMHFR ?? false;

  // Fetch MHFR requests when user is an MHFR
  useEffect(() => {
    if (!isMHFR) {
      setMhfrRequests([]);
      return;
    }
    xanoSupportRequests.getMHFRRequests()
      .then(setMhfrRequests)
      .catch((e) => console.warn('[MHFRContext] Failed to fetch MHFR requests:', e));
  }, [isMHFR]);

  const refreshMHFRRequests = useCallback(async () => {
    if (!isMHFR) return;
    try {
      const data = await xanoSupportRequests.getMHFRRequests();
      setMhfrRequests(data);
    } catch (e) {
      console.warn('[MHFRContext] Failed to refresh MHFR requests:', e);
    }
  }, [isMHFR]);

  const hasOpenMHFRRequest = useMemo(
    () => mhfrRequests.some((r) => r.status === 'OPEN'),
    [mhfrRequests],
  );

  const value: MHFRContextValue = { mhfrRequests, hasOpenMHFRRequest, refreshMHFRRequests };

  return <MHFRContext.Provider value={value}>{children}</MHFRContext.Provider>;
}

export function useMHFR(): MHFRContextValue {
  const ctx = useContext(MHFRContext);
  if (!ctx) throw new Error('useMHFR must be used within MHFRProvider');
  return ctx;
}
