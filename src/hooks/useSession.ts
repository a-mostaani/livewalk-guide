import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { acceptRequest, declineRequest, endSession, getSessionStatus, health, listPendingRequests, sendSessionMessage, startSession, updateSessionLocation } from '../api';
import type { MarketplaceRequest, SessionMessage } from '../types';

type UseSessionArgs = {
  enabled: boolean;
  online: boolean;
};

export function useSession({ enabled, online }: UseSessionArgs) {
  const [pendingRequests, setPendingRequests] = useState<MarketplaceRequest[]>([]);
  const [activeRequest, setActiveRequest] = useState<MarketplaceRequest | undefined>();
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [apiOnline, setApiOnline] = useState(false);
  const [apiNote, setApiNote] = useState('Checking backend…');
  const [busy, setBusy] = useState(false);
  const [locationNote, setLocationNote] = useState('GPS starts when the live session starts.');

  const refresh = useCallback(async () => {
    await health();
    setApiOnline(true);
    setApiNote('Backend connected');

    if (online) {
      const data = await listPendingRequests();
      setPendingRequests(data.requests);
    }

    if (activeRequest?.sessionId) {
      const session = await getSessionStatus(activeRequest.sessionId);
      setMessages(session.messages);
      if (session.session.status === 'ended') {
        setActiveRequest((current) => current ? { ...current, status: 'completed' } : current);
        setLocationNote('Walk completed. GPS sharing stopped.');
      }
    }
  }, [online, activeRequest?.sessionId]);

  useEffect(() => {
    if (!enabled) {
      setApiOnline(false);
      setApiNote('Log in to connect backend');
      return;
    }

    let active = true;
    const poll = async () => {
      try {
        await refresh();
      } catch {
        if (!active) return;
        setApiOnline(false);
        setApiNote('Backend reconnecting');
      }
    };

    poll();
    const timer = setInterval(poll, 2000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [enabled, refresh]);

  const selectRequest = useCallback((request?: MarketplaceRequest) => {
    if (!request) return false;
    setActiveRequest(request);
    return true;
  }, []);

  const acceptActiveRequest = useCallback(async () => {
    if (!activeRequest) return false;
    setBusy(true);
    try {
      const data = await acceptRequest(activeRequest.id);
      setActiveRequest(data.request);
      setMessages([]);
      return true;
    } finally {
      setBusy(false);
    }
  }, [activeRequest]);

  const declineActiveRequest = useCallback(async () => {
    if (!activeRequest) return false;
    setBusy(true);
    try {
      await declineRequest(activeRequest.id);
      setActiveRequest(undefined);
      return true;
    } finally {
      setBusy(false);
    }
  }, [activeRequest]);

  const startLive = useCallback(async () => {
    if (!activeRequest?.sessionId) return false;
    try {
      const data = await startSession(activeRequest.sessionId);
      setMessages(data.messages);
      setActiveRequest({ ...activeRequest, status: 'live' });
      return true;
    } catch {
      return false;
    }
  }, [activeRequest]);

  const sendMessage = useCallback(async (text: string) => {
    if (!activeRequest?.sessionId) return;
    await sendSessionMessage(activeRequest.sessionId, text);
    const data = await getSessionStatus(activeRequest.sessionId);
    setMessages(data.messages);
  }, [activeRequest?.sessionId]);

  const endLive = useCallback(async () => {
    if (!activeRequest?.sessionId) return false;
    setBusy(true);
    try {
      const data = await endSession(activeRequest.sessionId);
      setMessages(data.messages);
      setActiveRequest({ ...activeRequest, status: 'completed' });
      setLocationNote('Walk completed. GPS sharing stopped.');
      setApiOnline(true);
      setApiNote('Walk complete');
      return true;
    } catch {
      setApiNote('Could not end the shared walk yet');
      return false;
    } finally {
      setBusy(false);
    }
  }, [activeRequest]);

  useEffect(() => {
    if (activeRequest?.status !== 'live' || !activeRequest.sessionId) {
      setLocationNote('GPS starts when the live session starts.');
      return;
    }

    let cancelled = false;
    let subscription: Location.LocationSubscription | undefined;
    const sessionId = activeRequest.sessionId;

    const startPublishing = async () => {
      try {
        setLocationNote('Requesting GPS permission…');
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          if (!cancelled) setLocationNote('GPS permission is needed to share live route progress.');
          return;
        }

        if (!cancelled) setLocationNote('Publishing live GPS to traveler.');
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 3000,
            distanceInterval: 5,
          },
          (position) => {
            void updateSessionLocation(sessionId, {
              label: 'Guide live position',
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date(position.timestamp).toISOString(),
            }).catch(() => {
              if (!cancelled) setLocationNote('GPS captured locally; retrying backend sync.');
            });
          },
        );
      } catch {
        if (!cancelled) setLocationNote('GPS is not available on this device yet.');
      }
    };

    void startPublishing();
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [activeRequest?.status, activeRequest?.sessionId]);


  return {
    pendingRequests,
    activeRequest,
    messages,
    apiOnline,
    apiNote,
    busy,
    locationNote,
    walkEnded: activeRequest?.status === 'completed',
    refresh,
    selectRequest,
    acceptActiveRequest,
    declineActiveRequest,
    startLive,
    sendMessage,
    endLive,
  };
}
