import { useCallback } from 'react';
import { user as xanoUser, XanoUser } from '../api';
import { useAsyncHandler } from './useAsyncHandler';

export function useUserSettings() {
  const { isLoading, error, wrap } = useAsyncHandler();

  const engagementScore = useCallback(() =>
    wrap(() => xanoUser.engagementScore()), [wrap]);

  const updatePhoneNumber = useCallback((phoneNumber: string, countryIso: string) =>
    wrap(() => xanoUser.updatePhoneNumber(phoneNumber, countryIso)), [wrap]);

  const updateReminderSettings = useCallback(async (settings: {
    frequency: string;
    days: number[];
    hour: number;
    min: number;
    is_custom: boolean;
  }) => {
    return wrap(() => xanoUser.updateReminderSettings(settings));
  }, [wrap]);

  return { isLoading, error, engagementScore, updatePhoneNumber, updateReminderSettings };
}
