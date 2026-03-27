import { useCallback } from 'react';
import { users as xanoUsers, XanoUser } from '../api';
import { useAsyncHandler } from './useAsyncHandler';

export function useUserSearch() {
  const { isLoading, error, wrap } = useAsyncHandler();

  const searchInGroups = useCallback(async (searchText: string): Promise<XanoUser[]> => {
    const data = await wrap(() => xanoUsers.searchInGroups(searchText));
    return data ?? [];
  }, [wrap]);

  const getTop4Mhfr = useCallback(async (): Promise<XanoUser[]> => {
    const data = await wrap(() => xanoUsers.getTop4Mhfr());
    return data ?? [];
  }, [wrap]);

  return { isLoading, error, searchInGroups, getTop4Mhfr };
}
