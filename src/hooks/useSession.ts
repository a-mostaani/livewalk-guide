import { useEffect, useState } from 'react';
import { acceptRequest, declineRequest, getSessionStatus, health, listPendingRequests, sendSessionMessage, startSession } from '../api';
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

  const refresh = async () => {
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
    }
  };

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
  }, [enabled, online, activeRequest?.sessionId]);

  const selectRequest = (request?: MarketplaceRequest) => {
    if (!request) return false;
    setActiveRequest(request);
    return true;
  };

  const acceptActiveRequest = async () => {
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
  };

  const declineActiveRequest = async () => {
    if (!activeRequest) return false;
    setBusy(true);
    try {
      await declineRequest(activeRequest.id);
      setActiveRequest(undefined);
      return true;
    } finally {
      setBusy(false);
    }
  };

  const startLive = async () => {
    if (!activeRequest?.sessionId) return false;
    try {
      const data = await startSession(activeRequest.sessionId);
      setMessages(data.messages);
      setActiveRequest({ ...activeRequest, status: 'live' });
      return true;
    } catch {
      return false;
    }
  };

  const sendMessage = async (text: string) => {
    if (!activeRequest?.sessionId) return;
    await sendSessionMessage(activeRequest.sessionId, text);
    const data = await getSessionStatus(activeRequest.sessionId);
    setMessages(data.messages);
  };

  return {
    pendingRequests,
    activeRequest,
    messages,
    apiOnline,
    apiNote,
    busy,
    refresh,
    selectRequest,
    acceptActiveRequest,
    declineActiveRequest,
    startLive,
    sendMessage,
  };
}
