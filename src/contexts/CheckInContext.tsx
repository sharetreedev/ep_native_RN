import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';

/** Return today's date as YYYY-MM-DD in the device's local timezone. */
function getLocalDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Convert any date string (ISO/UTC or YYYY-MM-DD) to YYYY-MM-DD in the device's local timezone. */
function toLocalDateString(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface CheckInContextValue {
  hasCheckedInToday: boolean;
  markCheckedInToday: () => void;
}

const CheckInContext = createContext<CheckInContextValue | null>(null);

export function CheckInProvider({ children }: { children: React.ReactNode }) {
  const { user, _setUser } = useAuth();

  const hasCheckedInToday = useMemo(() => {
    const today = getLocalDateString();

    // Primary: check lastCheckInDate from /auth/me
    const dateStr = user?.lastCheckInDate;
    if (dateStr && typeof dateStr === 'string' && toLocalDateString(dateStr) === today) {
      return true;
    }

    // Fallback: check last_7_checkins for a check-in logged today
    const recent = user?.last7CheckIns;
    if (recent && recent.length > 0) {
      return recent.some((c) => c.loggedDate && toLocalDateString(c.loggedDate) === today);
    }

    return false;
  }, [user]);

  const markCheckedInToday = useCallback(() => {
    const today = getLocalDateString();
    _setUser((prev) => prev ? { ...prev, lastCheckInDate: today } : prev);
  }, [_setUser]);

  const value: CheckInContextValue = { hasCheckedInToday, markCheckedInToday };

  return <CheckInContext.Provider value={value}>{children}</CheckInContext.Provider>;
}

export function useCheckIn(): CheckInContextValue {
  const ctx = useContext(CheckInContext);
  if (!ctx) throw new Error('useCheckIn must be used within CheckInProvider');
  return ctx;
}
