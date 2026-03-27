import { useState, useCallback } from 'react';
import {
  pairs as xanoPairs,
  pair as xanoPair,
  pairInvite as xanoPairInvite,
  XanoPair,
  XanoPairCheckin,
} from '../api';
import { useAsyncHandler } from './useAsyncHandler';
import { invalidate, CACHE_KEYS } from '../lib/fetchCache';

interface PairsState {
  active: XanoPair[];
  invites: XanoPair[];
}

interface UsePairsResult {
  active: XanoPair[];
  invites: XanoPair[];
  sentRequestIds: number[];
  isLoading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  fetchSentRequests: () => Promise<void>;
  getPairById: (pairsId: number) => Promise<XanoPair | null>;
  invitePair: (inviteEmail: string, extraFields?: Partial<XanoPair>) => Promise<XanoPair | null>;
  respond: (pairsId: number, status: 'ACCEPTED' | 'REJECTED', requestToId: number) => Promise<void>;
  cancelRequest: (pairId: number) => Promise<void>;
  removePair: (pairId: number) => Promise<void>;
  sendCheckin: (creatorId: number, recipientId: number) => Promise<XanoPairCheckin | null>;
  sendCheckinReminder: (pairsUserId: number, message: string) => Promise<void>;
  getPairByToken: (token: string, currentUserId?: number) => Promise<XanoPair | null>;
}

export function usePairs(): UsePairsResult {
  const [state, setState] = useState<PairsState>({ active: [], invites: [] });
  const [sentRequestIds, setSentRequestIds] = useState<number[]>([]);
  const { isLoading, error, wrap } = useAsyncHandler();

  const fetchAll = useCallback(async () => {
    const data = await wrap(() => xanoPairs.getAll());
    if (data) {
      setState({
        active: Array.isArray(data.active) ? data.active : [],
        invites: Array.isArray(data.invites) ? data.invites : [],
      });
    }
  }, [wrap]);

  const fetchSentRequests = useCallback(async () => {
    const data = await wrap(() => xanoPairInvite.getSentRequests());
    if (data) setSentRequestIds(data);
  }, [wrap]);

  const getPairById = useCallback((pairsId: number) =>
    wrap(() => xanoPairs.getById(pairsId)), [wrap]);

  const invitePair = useCallback(async (inviteEmail: string, extraFields?: Partial<XanoPair>) => {
    const result = await wrap(() => xanoPairs.create(inviteEmail, extraFields));
    if (result) {
      invalidate(CACHE_KEYS.PAIRS);
      setState(prev => ({ ...prev, active: [...prev.active, result] }));
    }
    return result;
  }, [wrap]);

  const respond = useCallback(async (
    pairsId: number,
    status: 'ACCEPTED' | 'REJECTED',
    requestToId: number,
  ) => {
    await wrap(() => xanoPairs.respond(pairsId, status, requestToId));
    invalidate(CACHE_KEYS.PAIRS);
    await fetchAll();
  }, [wrap, fetchAll]);

  const cancelRequest = useCallback(async (pairId: number) => {
    await wrap(() => xanoPair.cancelRequest(pairId));
    invalidate(CACHE_KEYS.PAIRS);
    setState(prev => ({
      ...prev,
      active: prev.active.filter(p => p.id !== pairId),
    }));
  }, [wrap]);

  const removePair = useCallback(async (pairId: number) => {
    await wrap(() => xanoPair.remove(pairId));
    invalidate(CACHE_KEYS.PAIRS);
    setState(prev => ({
      active: prev.active.filter(p => p.id !== pairId),
      invites: prev.invites.filter(p => p.id !== pairId),
    }));
  }, [wrap]);

  const sendCheckin = useCallback((creatorId: number, recipientId: number) =>
    wrap(() => xanoPair.checkin(creatorId, recipientId)), [wrap]);

  const sendCheckinReminder = useCallback(async (pairsUserId: number, message: string) => {
    await wrap(() => xanoPair.checkinReminder(pairsUserId, message));
  }, [wrap]);

  const getPairByToken = useCallback((token: string, currentUserId?: number) =>
    wrap(() => xanoPair.getByToken(token, currentUserId)), [wrap]);

  return {
    active: state.active,
    invites: state.invites,
    sentRequestIds,
    isLoading,
    error,
    fetchAll,
    fetchSentRequests,
    getPairById,
    invitePair,
    respond,
    cancelRequest,
    removePair,
    sendCheckin,
    sendCheckinReminder,
    getPairByToken,
  };
}
