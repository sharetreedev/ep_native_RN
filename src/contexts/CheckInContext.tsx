import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { userDateOf, userToday } from '../lib/userDate';

interface CheckInContextValue {
  hasCheckedInToday: boolean;
  markCheckedInToday: () => void;
}

const CheckInContext = createContext<CheckInContextValue | null>(null);

export function CheckInProvider({ children }: { children: React.ReactNode }) {
  const { user, _setUser } = useAuth();
  const timezone = user?.timezone;

  const hasCheckedInToday = useMemo(() => {
    const today = userToday(timezone);

    // Primary: check lastCheckInDate from /auth/me
    const dateStr = user?.lastCheckInDate;
    if (dateStr && typeof dateStr === 'string' && userDateOf(dateStr, timezone) === today) {
      return true;
    }

    // Fallback: check last_7_checkins for a check-in logged today. Prefer
    // `loggedDateTime` (epoch ms) so a near-midnight check-in lands on the
    // correct calendar day in the user's timezone.
    const recent = user?.last7CheckIns;
    if (recent && recent.length > 0) {
      return recent.some((c) => {
        const moment = typeof c.loggedDateTime === 'number' ? c.loggedDateTime : c.loggedDate;
        return moment ? userDateOf(moment, timezone) === today : false;
      });
    }

    return false;
  }, [user, timezone]);

  const markCheckedInToday = useCallback(() => {
    const today = userToday(timezone);
    _setUser((prev) => prev ? { ...prev, lastCheckInDate: today } : prev);
  }, [_setUser, timezone]);

  const value = useMemo<CheckInContextValue>(
    () => ({ hasCheckedInToday, markCheckedInToday }),
    [hasCheckedInToday, markCheckedInToday],
  );

  return <CheckInContext.Provider value={value}>{children}</CheckInContext.Provider>;
}

export function useCheckIn(): CheckInContextValue {
  const ctx = useContext(CheckInContext);
  if (!ctx) throw new Error('useCheckIn must be used within CheckInProvider');
  return ctx;
}
