import { AppState } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { acceptRequest, declineRequest, endSession, getSessionStatus, health, isRequestCancelledError, listPendingRequests, sendSessionMessage, startSession, updateSessionLocation } from '../api';
import { canFetchPendingRequests, getRequestActionState, normalizeActiveRequestFromSession, RequestPollGate, shouldRefreshGuideState } from '../session/requestLifecycle';
import type { MarketplaceRequest, SessionMessage } from '../types';

type UseSessionArgs = {
  enabled: boolean;
  authReady: boolean;
  authKey: string;
  online: boolean;
  screenFocusKey: string;
};

export function useSession({ enabled, authReady, authKey, online, screenFocusKey }: UseSessionArgs) {
  const [pendingRequests, setPendingRequests] = useState<MarketplaceRequest[]>([]);
  const [activeRequest, setActiveRequest] = useState<MarketplaceRequest | undefined>();
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [apiOnline, setApiOnline] = useState(false);
  const [apiNote, setApiNote] = useState('Checking backend…');
  const [busy, setBusy] = useState(false);
  const [locationNote, setLocationNote] = useState('GPS starts when the live session starts.');
  const activeRequestRef = useRef<MarketplaceRequest | undefined>(undefined);
  const pollGateRef = useRef(new RequestPollGate());
  const authSnapshot = `${enabled}:${authReady}:${authKey}`;
  const authSnapshotRef = useRef(authSnapshot);
  const pollControlsSnapshot = `${online}`;
  const pollControlsSnapshotRef = useRef(pollControlsSnapshot);
  const screenFocusKeyRef = useRef(screenFocusKey);

  activeRequestRef.current = activeRequest;

  if (authSnapshotRef.current !== authSnapshot) {
    authSnapshotRef.current = authSnapshot;
    pollGateRef.current.reset({ clearLastValid: true });
  } else if (pollControlsSnapshotRef.current !== pollControlsSnapshot) {
    pollControlsSnapshotRef.current = pollControlsSnapshot;
    pollGateRef.current.reset();
  }

  useEffect(() => {
    if (!enabled || !authReady) {
      setPendingRequests([]);
      setActiveRequest(undefined);
      setMessages([]);
      setApiOnline(false);
      setApiNote('Log in to connect backend');
      setLocationNote('GPS starts when the live session starts.');
    }
  }, [enabled, authReady]);

  const markRequestCancelled = useCallback((requestId?: string, responseRequest?: MarketplaceRequest) => {
    setPendingRequests((current) => current.filter((request) => request.id !== requestId));
    setActiveRequest((current) => {
      if (!current || (requestId && current.id !== requestId)) return current;
      return { ...current, ...responseRequest, status: 'cancelled' };
    });
    setMessages([]);
    setLocationNote('Traveler cancelled this walk. GPS sharing stopped.');
    setApiOnline(true);
    setApiNote('Traveler cancelled this walk');
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled || !authReady) return;

    const pollGate = pollGateRef.current;
    const snapshot = pollGate.beginPoll();
    try {
      await health();
    } catch {
      if (!pollGate.isCurrent(snapshot)) return;
      setApiOnline(false);
      setApiNote('Backend reconnecting');
      pollGate.retain(snapshot);
      return;
    }

    if (!pollGate.isCurrent(snapshot)) return;
    setApiOnline(true);
    setApiNote('Backend connected');

    if (canFetchPendingRequests({ enabled, authReady, online })) {
      try {
        const data = await listPendingRequests();
        const result = pollGate.accept(snapshot, data.requests);
        if (result.kind === 'accepted') setPendingRequests(result.requests);
      } catch {
        if (!pollGate.isCurrent(snapshot)) return;
        setApiOnline(false);
        setApiNote('Request list reconnecting');
        pollGate.retain(snapshot);
      }
    }

    const request = activeRequestRef.current;
    const sessionId = request?.sessionId;
    if (!request || !sessionId) return;

    try {
      const session = await getSessionStatus(sessionId);
      if (!pollGate.isCurrent(snapshot) || activeRequestRef.current?.sessionId !== sessionId) return;
      setMessages(session.messages);

      const updatedRequest = normalizeActiveRequestFromSession(request, session);
      if (!updatedRequest || getRequestActionState(updatedRequest).kind === 'cancelled') {
        markRequestCancelled(request.id, updatedRequest);
        return;
      }

      setActiveRequest((current) => current?.id === request.id ? normalizeActiveRequestFromSession(current, session) : current);

      if (updatedRequest.status === 'completed') {
        setLocationNote('Walk completed. GPS sharing stopped.');
        return;
      }

    } catch (error) {
      if (!pollGate.isCurrent(snapshot) || activeRequestRef.current?.sessionId !== sessionId) return;
      if (isRequestCancelledError(error)) {
        markRequestCancelled(request.id);
        return;
      }
      setApiOnline(false);
      setApiNote('Session reconnecting');
    }
  }, [authReady, enabled, markRequestCancelled, online]);

  useEffect(() => {
    if (!enabled || !authReady) return;

    let active = true;
    const poll = () => {
      if (active) void refresh();
    };

    poll();
    const timer = setInterval(poll, 2000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [enabled, authReady, refresh]);

  useEffect(() => {
    const screenChanged = screenFocusKeyRef.current !== screenFocusKey;
    screenFocusKeyRef.current = screenFocusKey;
    if (screenChanged && shouldRefreshGuideState({ screenFocused: screenFocusKey !== 'onboarding', appActive: AppState.currentState === 'active', enabled, authReady })) {
      void refresh();
    }
  }, [authReady, enabled, refresh, screenFocusKey]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && shouldRefreshGuideState({ screenFocused: screenFocusKey !== 'onboarding', appActive: true, enabled, authReady })) {
        void refresh();
      }
    });
    return () => subscription.remove();
  }, [authReady, enabled, refresh, screenFocusKey]);

  const selectRequest = useCallback((request?: MarketplaceRequest) => {
    if (!request || getRequestActionState(request).kind === 'cancelled') return false;
    setActiveRequest(request);
    return true;
  }, []);

  const acceptActiveRequest = useCallback(async () => {
    if (!activeRequest || getRequestActionState(activeRequest).kind === 'cancelled') return false;
    setBusy(true);
    try {
      const data = await acceptRequest(activeRequest.id);
      if (getRequestActionState(data.request).kind === 'cancelled') {
        markRequestCancelled(activeRequest.id);
        return false;
      }
      setActiveRequest(data.request);
      setPendingRequests((current) => current.filter((request) => request.id !== activeRequest.id));
      setMessages([]);
      return true;
    } catch (error) {
      if (isRequestCancelledError(error)) markRequestCancelled(activeRequest.id);
      else setApiNote('Could not accept the request yet');
      return false;
    } finally {
      setBusy(false);
    }
  }, [activeRequest, markRequestCancelled]);

  const declineActiveRequest = useCallback(async () => {
    if (!activeRequest || getRequestActionState(activeRequest).kind === 'cancelled') return false;
    setBusy(true);
    try {
      await declineRequest(activeRequest.id);
      setPendingRequests((current) => current.filter((request) => request.id !== activeRequest.id));
      setActiveRequest(undefined);
      return true;
    } catch (error) {
      if (isRequestCancelledError(error)) markRequestCancelled(activeRequest.id);
      else setApiNote('Could not decline the request yet');
      return false;
    } finally {
      setBusy(false);
    }
  }, [activeRequest, markRequestCancelled]);

  const startLive = useCallback(async () => {
    if (!activeRequest?.sessionId || getRequestActionState(activeRequest).kind === 'cancelled') return false;
    try {
      const data = await startSession(activeRequest.sessionId);
      if (data.session.status === 'cancelled') {
        markRequestCancelled(activeRequest.id);
        return false;
      }
      setMessages(data.messages);
      setActiveRequest((current) => current?.id === activeRequest.id ? { ...current, status: 'live' } : current);
      return true;
    } catch (error) {
      if (isRequestCancelledError(error)) markRequestCancelled(activeRequest.id);
      else setApiNote('Could not start the shared walk yet');
      return false;
    }
  }, [activeRequest, markRequestCancelled]);

  const sendMessage = useCallback(async (text: string) => {
    if (!activeRequest?.sessionId || getRequestActionState(activeRequest).kind === 'cancelled') return;
    try {
      await sendSessionMessage(activeRequest.sessionId, text);
      const data = await getSessionStatus(activeRequest.sessionId);
      if (data.session.status === 'cancelled') {
        markRequestCancelled(activeRequest.id);
        return;
      }
      setMessages(data.messages);
    } catch (error) {
      if (isRequestCancelledError(error)) markRequestCancelled(activeRequest.id);
      throw error;
    }
  }, [activeRequest, markRequestCancelled]);

  const endLive = useCallback(async () => {
    if (!activeRequest?.sessionId || getRequestActionState(activeRequest).kind === 'cancelled') return false;
    setBusy(true);
    try {
      const data = await endSession(activeRequest.sessionId);
      if (data.session.status === 'cancelled') {
        markRequestCancelled(activeRequest.id);
        return false;
      }
      setMessages(data.messages);
      setActiveRequest((current) => current?.id === activeRequest.id ? { ...current, status: 'completed' } : current);
      setLocationNote('Walk completed. GPS sharing stopped.');
      setApiOnline(true);
      setApiNote('Walk complete');
      return true;
    } catch (error) {
      if (isRequestCancelledError(error)) markRequestCancelled(activeRequest.id);
      else setApiNote('Could not end the shared walk yet');
      return false;
    } finally {
      setBusy(false);
    }
  }, [activeRequest, markRequestCancelled]);

  useEffect(() => {
    if (activeRequest?.status !== 'live' || !activeRequest.sessionId) {
      if (activeRequest?.status !== 'cancelled') setLocationNote('GPS starts when the live session starts.');
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
            }).catch((error) => {
              if (isRequestCancelledError(error)) {
                markRequestCancelled(activeRequest.id);
              } else if (!cancelled) {
                setLocationNote('GPS captured locally; retrying backend sync.');
              }
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
  }, [activeRequest?.id, activeRequest?.sessionId, activeRequest?.status, markRequestCancelled]);

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
