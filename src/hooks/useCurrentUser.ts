import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface CurrentUserProfile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  phone?: string;
  role?: string;
}

export function useCurrentUser(): {
  user: CurrentUserProfile | null;
} {
  const { user: authUser, isAuthenticated } = useAuth();

  const user = useMemo<CurrentUserProfile | null>(() => {
    if (!isAuthenticated || !authUser) return null;
    return {
      id: authUser.id,
      email: authUser.email,
      displayName: authUser.name || authUser.email.split('@')[0],
      avatarUrl: authUser.avatarUrl,
    };
  }, [isAuthenticated, authUser]);

  return { user };
}
