import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { supportRequests as xanoSupportRequests, XanoSupportRequest } from '../api';
import { logger } from '../lib/logger';

interface MHFRContextValue {
  /** Support requests where the current user is acting as MHFR (responder). */
  mhfrRequests: XanoSupportRequest[];
  /** Support requests created by the current user. */
  ownRequests: XanoSupportRequest[];
  /** True if any MHFR request is OPEN. */
  hasOpenMHFRRequest: boolean;
  /** True if any of the user's own requests is OPEN. */
  hasOpenOwnRequest: boolean;
  /** True if either MHFR or own requests have something OPEN. Used by the
   *  MyPulse header dot to reflect everything the user can act on. */
  hasOpenSupportItem: boolean;
  refreshMHFRRequests: () => Promise<void>;
  refreshOwnSupportRequests: () => Promise<void>;
  /** Convenience: refresh both lists in parallel. */
  refreshAllSupportRequests: () => Promise<void>;
}

const MHFRContext = createContext<MHFRContextValue | null>(null);

export function MHFRProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [mhfrRequests, setMhfrRequests] = useState<XanoSupportRequest[]>([]);
  const [ownRequests, setOwnRequests] = useState<XanoSupportRequest[]>([]);

  const isMHFR = user?.isMHFR ?? false;

  const refreshMHFRRequests = useCallback(async () => {
    if (!isMHFR) {
      setMhfrRequests([]);
      return;
    }
    try {
      const data = await xanoSupportRequests.getMHFRRequests();
      setMhfrRequests(data);
    } catch (e) {
      logger.warn('[MHFRContext] Failed to refresh MHFR requests:', e);
    }
  }, [isMHFR]);

  const refreshOwnSupportRequests = useCallback(async () => {
    if (!user) {
      setOwnRequests([]);
      return;
    }
    try {
      const data = await xanoSupportRequests.getAll();
      setOwnRequests(data);
    } catch (e) {
      logger.warn('[MHFRContext] Failed to refresh own support requests:', e);
    }
  }, [user]);

  const refreshAllSupportRequests = useCallback(async () => {
    await Promise.all([refreshMHFRRequests(), refreshOwnSupportRequests()]);
  }, [refreshMHFRRequests, refreshOwnSupportRequests]);

  // Fetch both lists when the user identity changes (login, account switch).
  useEffect(() => {
    refreshAllSupportRequests();
  }, [user?.id, isMHFR]);

  const hasOpenMHFRRequest = useMemo(
    () => mhfrRequests.some((r) => r.status === 'OPEN'),
    [mhfrRequests],
  );
  const hasOpenOwnRequest = useMemo(
    () => ownRequests.some((r) => r.status === 'OPEN'),
    [ownRequests],
  );
  const hasOpenSupportItem = hasOpenMHFRRequest || hasOpenOwnRequest;

  const value = useMemo<MHFRContextValue>(
    () => ({
      mhfrRequests,
      ownRequests,
      hasOpenMHFRRequest,
      hasOpenOwnRequest,
      hasOpenSupportItem,
      refreshMHFRRequests,
      refreshOwnSupportRequests,
      refreshAllSupportRequests,
    }),
    [
      mhfrRequests,
      ownRequests,
      hasOpenMHFRRequest,
      hasOpenOwnRequest,
      hasOpenSupportItem,
      refreshMHFRRequests,
      refreshOwnSupportRequests,
      refreshAllSupportRequests,
    ],
  );

  return <MHFRContext.Provider value={value}>{children}</MHFRContext.Provider>;
}

export function useMHFR(): MHFRContextValue {
  const ctx = useContext(MHFRContext);
  if (!ctx) throw new Error('useMHFR must be used within MHFRProvider');
  return ctx;
}

/** Safe-area edges helper: omits 'top' when the MHFR banner is visible */
export function useSafeEdges(base: ('top' | 'bottom' | 'left' | 'right')[] = ['top']): ('top' | 'bottom' | 'left' | 'right')[] {
  const ctx = useContext(MHFRContext);
  const bannerVisible = ctx?.hasOpenMHFRRequest ?? false;
  return bannerVisible ? base.filter((e) => e !== 'top') : base;
}
