import { useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { fetchLiveKitToken } from '../api';
import { GuideBroadcastController, broadcastWaitingMessage, getConnectionProps, type GuideBroadcastState } from './guideBroadcast';
import { runPermissionRequest } from './permissionQueue';

// react-native-webrtc's getUserMedia does not itself trigger the Android
// system permission dialog - it silently no-ops if CAMERA/RECORD_AUDIO
// aren't already granted. We have to request them explicitly before
// starting the broadcast, mirroring the Location.requestForegroundPermissionsAsync
// pattern already used for GPS. iOS prompts automatically from the native
// getUserMedia call, so this is a no-op there.
async function ensureCameraAndMicrophonePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  // TICKET-6: queued so it can never overlap the location prompt.
  const results = await runPermissionRequest(() => PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.CAMERA,
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  ]));
  return (
    results[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
    results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
  );
}

export function useGuideBroadcast(sessionId: string | undefined, enabled: boolean) {
  const controllerRef = useRef<GuideBroadcastController | null>(null);
  const controller = controllerRef.current ?? (controllerRef.current = new GuideBroadcastController({
    fetchToken: (id) => fetchLiveKitToken(id),
  }));
  const [state, setState] = useState<GuideBroadcastState>(() => controller.getState());
  const [awaitingPermission, setAwaitingPermission] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (enabled && sessionId) {
      setAwaitingPermission(true);
      void ensureCameraAndMicrophonePermission().catch(() => false).then((granted) => {
        if (cancelled) return;
        setAwaitingPermission(false);
        if (!granted) {
          setState({ status: 'error', sessionId, message: 'Camera and microphone permission is required to broadcast.' });
          return;
        }
        setState({ status: 'connecting', sessionId });
        void controller.start(sessionId).then((next) => {
          if (!cancelled) setState(next);
        });
      });
    } else {
      setState(controller.stop());
    }
    return () => {
      cancelled = true;
      setAwaitingPermission(false);
      setState(controller.stop());
    };
  }, [controller, enabled, sessionId]);

  return { state, connectionProps: getConnectionProps(state), waitingMessage: broadcastWaitingMessage(state, awaitingPermission), stop: () => setState(controller.stop()) };
}
