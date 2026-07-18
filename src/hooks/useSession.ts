import { AppState } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { acceptRequest, declineRequest, endSession, getRequest, getSessionStatus, health, isRequestCancelledError, listPendingRequests, sendSessionMessage, startSession, updateSessionLocation } from '../api';
import { applyGuideActiveRequestUpdate, canFetchPendingRequests, canRunGuideWalkAction, filterGuidePendingRequests, getRequestActionState, GuideCancellationLatch, normalizeActiveRequestFromSession, RequestPollGate, resolveGuidePendingSelection, resolveGuideRequestDetail, resolveGuideSessionPoll, SingleFlightPoll, shouldPollGuideSession, shouldRefreshGuideState } from '../session/requestLifecycle';
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
  const cancellationLatchRef = useRef(new GuideCancellationLatch());
  const pollGateRef = useRef(new RequestPollGate());
  const refreshFlightRef = useRef(new SingleFlightPoll());
  const authSnapshot = `${enabled}:${authReady}:${authKey}`;
  const authSnapshotRef = useRef(authSnapshot);
  const pollControlsSnapshot = `${online}`;
  const pollControlsSnapshotRef = useRef(pollControlsSnapshot);
  const screenFocusKeyRef = useRef(screenFocusKey);

  activeRequestRef.current = activeRequest;

  if (authSnapshotRef.current !== authSnapshot) {
    authSnapshotRef.current = authSnapshot;
    pollGateRef.current.reset({ clearLastValid: true });
    cancellationLatchRef.current.clear();
  } else if (pollControlsSnapshotRef.current !== pollControlsSnapshot) {
    pollControlsSnapshotRef.current = pollControlsSnapshot;
    pollGateRef.current.reset();
  }

  useEffect(() => {
    if (!enabled || !authReady) {
      setPendingRequests([]);
      activeRequestRef.current = undefined;
      setActiveRequest(undefined);
      cancellationLatchRef.current.clear();
      setMessages([]);
      setApiOnline(false);
      setApiNote('Log in to connect backend');
      setLocationNote('GPS starts when the live session starts.');
    }
  }, [enabled, authReady]);

  const replaceActiveRequest = useCallback((next: MarketplaceRequest | undefined) => {
    activeRequestRef.current = next;
    setActiveRequest(next);
  }, []);

  const markRequestCancelled = useCallback((requestId?: string, responseRequest?: MarketplaceRequest, sessionId?: string | null) => {
    const current = activeRequestRef.current;
    const resolvedRequestId = requestId ?? responseRequest?.id ?? current?.id;
    const resolvedSessionId = sessionId ?? responseRequest?.sessionId ?? current?.sessionId;
    cancellationLatchRef.current.latch({ requestId: resolvedRequestId, sessionId: resolvedSessionId });
    pollGateRef.current.remove(resolvedRequestId);
    setPendingRequests((current) => current.filter((request) => request.id !== resolvedRequestId));
    if (current && (!resolvedRequestId || current.id === resolvedRequestId)) replaceActiveRequest({ ...current, ...responseRequest, status: 'cancelled' });
    setMessages([]);
    setLocationNote('Traveler cancelled this walk. GPS sharing stopped.');
    setApiOnline(true);
    setApiNote('Traveler cancelled this walk');
  }, [replaceActiveRequest]);

  const canUpdateActiveRequest = useCallback((requestId: string) => {
    const current = activeRequestRef.current;
    return current?.id === requestId
      && !cancellationLatchRef.current.matches({ requestId, sessionId: current.sessionId })
      && canRunGuideWalkAction(current);
  }, []);

  const updateActiveRequest = useCallback((requestId: string, next: MarketplaceRequest | undefined) => {
    if (!canUpdateActiveRequest(requestId)) return false;
    const updated = applyGuideActiveRequestUpdate(activeRequestRef.current, requestId, next, cancellationLatchRef.current);
    replaceActiveRequest(updated);
    return true;
  }, [canUpdateActiveRequest, replaceActiveRequest]);

  const refresh = useCallback(() => refreshFlightRef.current.run(async () => {
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
        const result = pollGate.accept(snapshot, filterGuidePendingRequests(data.requests, cancellationLatchRef.current));
        if (result.kind === 'accepted') {
          setPendingRequests(result.requests);
          const selection = resolveGuidePendingSelection(activeRequestRef.current, result.requests, cancellationLatchRef.current);
          if (selection.kind === 'cancelled') {
            markRequestCancelled(selection.request.id, selection.request, selection.request.sessionId);
          } else if (selection.kind === 'missing') {
            try {
              const detail = await getRequest(selection.request.id);
              if (activeRequestRef.current?.id !== selection.request.id) return;
              const detailResolution = resolveGuideRequestDetail(activeRequestRef.current, detail, cancellationLatchRef.current);
              if (detailResolution.kind === 'cancelled') {
                markRequestCancelled(detailResolution.request.id, detailResolution.request, detail.session?.id);
              } else if (detailResolution.kind === 'updated' && pollGate.isCurrent(snapshot)) {
                updateActiveRequest(detailResolution.request.id, detailResolution.request);
              }
            } catch (error) {
              if (isRequestCancelledError(error)) markRequestCancelled(selection.request.id, undefined, selection.request.sessionId);
            }
          }
        }
      } catch {
        if (!pollGate.isCurrent(snapshot)) return;
        setApiOnline(false);
        setApiNote('Request list reconnecting');
        pollGate.retain(snapshot);
      }
    }

    const request = activeRequestRef.current;
    const sessionId = request?.sessionId;
    if (!sessionId || cancellationLatchRef.current.matches({ requestId: request.id, sessionId }) || !shouldPollGuideSession(request)) return;

    try {
      const session = await getSessionStatus(sessionId);
      if (activeRequestRef.current?.sessionId !== sessionId) return;
      if (cancellationLatchRef.current.matches({ requestId: request.id, sessionId })) return;

      const resolution = resolveGuideSessionPoll(activeRequestRef.current, session, pollGate.isCurrent(snapshot), cancellationLatchRef.current);
      if (resolution.kind === 'cancelled') {
        markRequestCancelled(request.id, resolution.request, session.session.id);
        return;
      }
      if (resolution.kind === 'ignored') return;
      if (!updateActiveRequest(request.id, resolution.request)) return;

      setMessages(session.messages);

      if (resolution.request.status === 'completed') {
        setLocationNote('Walk completed. GPS sharing stopped.');
        return;
      }

    } catch (error) {
      if (activeRequestRef.current?.sessionId !== sessionId) return;
      if (isRequestCancelledError(error)) {
        markRequestCancelled(request.id, undefined, sessionId);
        return;
      }
      if (!pollGate.isCurrent(snapshot)) return;
      setApiOnline(false);
      setApiNote('Session reconnecting');
    }
  }), [authReady, enabled, markRequestCancelled, online, updateActiveRequest]);

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
    if (!request || cancellationLatchRef.current.matches({ requestId: request.id, sessionId: request.sessionId }) || getRequestActionState(request).kind === 'cancelled') return false;
    replaceActiveRequest(request);
    return true;
  }, [replaceActiveRequest]);

  const acceptActiveRequest = useCallback(async () => {
    if (!activeRequest || !canUpdateActiveRequest(activeRequest.id)) return false;
    setBusy(true);
    try {
      const data = await acceptRequest(activeRequest.id);
      const updatedRequest = normalizeActiveRequestFromSession(data.request, data, cancellationLatchRef.current);
      if (!updatedRequest || getRequestActionState(updatedRequest).kind === 'cancelled') {
        markRequestCancelled(activeRequest.id, updatedRequest, data.session.id);
        return false;
      }
      if (!updateActiveRequest(activeRequest.id, updatedRequest)) return false;
      pollGateRef.current.remove(activeRequest.id);
      setPendingRequests((current) => current.filter((request) => request.id !== activeRequest.id));
      setMessages([]);
      return true;
    } catch (error) {
      if (isRequestCancelledError(error)) markRequestCancelled(activeRequest.id, undefined, activeRequest.sessionId);
      else setApiNote('Could not accept the request yet');
      return false;
    } finally {
      setBusy(false);
    }
  }, [activeRequest, canUpdateActiveRequest, markRequestCancelled, updateActiveRequest]);

  const declineActiveRequest = useCallback(async () => {
    if (!activeRequest || !canUpdateActiveRequest(activeRequest.id)) return false;
    setBusy(true);
    try {
      await declineRequest(activeRequest.id);
      if (!canUpdateActiveRequest(activeRequest.id)) return false;
      pollGateRef.current.remove(activeRequest.id);
      setPendingRequests((current) => current.filter((request) => request.id !== activeRequest.id));
      replaceActiveRequest(applyGuideActiveRequestUpdate(activeRequestRef.current, activeRequest.id, undefined, cancellationLatchRef.current));
      return true;
    } catch (error) {
      if (isRequestCancelledError(error)) markRequestCancelled(activeRequest.id, undefined, activeRequest.sessionId);
      else setApiNote('Could not decline the request yet');
      return false;
    } finally {
      setBusy(false);
    }
  }, [activeRequest, canUpdateActiveRequest, markRequestCancelled, replaceActiveRequest]);

  const startLive = useCallback(async () => {
    if (!activeRequest?.sessionId || !canUpdateActiveRequest(activeRequest.id)) return false;
    try {
      const data = await startSession(activeRequest.sessionId);
      const updatedRequest = normalizeActiveRequestFromSession(activeRequest, data, cancellationLatchRef.current);
      if (!updatedRequest || getRequestActionState(updatedRequest).kind === 'cancelled') {
        markRequestCancelled(activeRequest.id, updatedRequest, data.session.id);
        return false;
      }
      if (!updateActiveRequest(activeRequest.id, updatedRequest)) return false;
      setMessages(data.messages);
      return true;
    } catch (error) {
      if (isRequestCancelledError(error)) markRequestCancelled(activeRequest.id, undefined, activeRequest.sessionId);
      else setApiNote('Could not start the shared walk yet');
      return false;
    }
  }, [activeRequest, canUpdateActiveRequest, markRequestCancelled, updateActiveRequest]);

  const sendMessage = useCallback(async (text: string) => {
    if (!activeRequest?.sessionId || !canUpdateActiveRequest(activeRequest.id)) return;
    try {
      await sendSessionMessage(activeRequest.sessionId, text);
      if (!canUpdateActiveRequest(activeRequest.id)) return;
      const data = await getSessionStatus(activeRequest.sessionId);
      const updatedRequest = normalizeActiveRequestFromSession(activeRequest, data, cancellationLatchRef.current);
      if (!updatedRequest || getRequestActionState(updatedRequest).kind === 'cancelled') {
        markRequestCancelled(activeRequest.id, updatedRequest, data.session.id);
        return;
      }
      if (!updateActiveRequest(activeRequest.id, updatedRequest)) return;
      setMessages(data.messages);
    } catch (error) {
      if (isRequestCancelledError(error)) markRequestCancelled(activeRequest.id, undefined, activeRequest.sessionId);
      throw error;
    }
  }, [activeRequest, canUpdateActiveRequest, markRequestCancelled, updateActiveRequest]);

  const endLive = useCallback(async () => {
    if (!activeRequest?.sessionId || !canUpdateActiveRequest(activeRequest.id)) return false;
    setBusy(true);
    try {
      const data = await endSession(activeRequest.sessionId);
      const updatedRequest = normalizeActiveRequestFromSession(activeRequest, data, cancellationLatchRef.current);
      if (!updatedRequest || getRequestActionState(updatedRequest).kind === 'cancelled') {
        markRequestCancelled(activeRequest.id, updatedRequest, data.session.id);
        return false;
      }
      if (!updateActiveRequest(activeRequest.id, updatedRequest)) return false;
      setMessages(data.messages);
      setLocationNote('Walk completed. GPS sharing stopped.');
      setApiOnline(true);
      setApiNote('Walk complete');
      return true;
    } catch (error) {
      if (isRequestCancelledError(error)) markRequestCancelled(activeRequest.id, undefined, activeRequest.sessionId);
      else setApiNote('Could not end the shared walk yet');
      return false;
    } finally {
      setBusy(false);
    }
  }, [activeRequest, canUpdateActiveRequest, markRequestCancelled, updateActiveRequest]);

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
                markRequestCancelled(activeRequest.id, undefined, activeRequest.sessionId);
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
