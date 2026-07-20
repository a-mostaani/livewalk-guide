import { useEffect, useRef, useState } from 'react';
import { fetchLiveKitToken } from '../api';
import { GuideBroadcastController, getConnectionProps, type GuideBroadcastState } from './guideBroadcast';

export function useGuideBroadcast(sessionId: string | undefined, enabled: boolean) {
  const controllerRef = useRef<GuideBroadcastController | null>(null);
  const controller = controllerRef.current ?? (controllerRef.current = new GuideBroadcastController({
    fetchToken: (id) => fetchLiveKitToken(id),
  }));
  const [state, setState] = useState<GuideBroadcastState>(() => controller.getState());

  useEffect(() => {
    let cancelled = false;
    if (enabled && sessionId) {
      void controller.start(sessionId).then((next) => {
        if (!cancelled) setState(next);
      });
    } else {
      setState(controller.stop());
    }
    return () => {
      cancelled = true;
      setState(controller.stop());
    };
  }, [controller, enabled, sessionId]);

  return { state, connectionProps: getConnectionProps(state), stop: () => setState(controller.stop()) };
}
