import { useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { fetchLiveKitToken } from '../api';
import { GuideBroadcastController, getConnectionProps, type GuideBroadcastState } from './guideBroadcast';

// react-native-webrtc's getUserMedia does not itself trigger the Android
// system permission dialog - it silently no-ops if CAMERA/RECORD_AUDIO
// aren't already granted. We have to request them explicitly before
// starting the broadcast, mirroring the Location.requestForegroundPermissionsAsync
// pattern already used for GPS. iOS prompts automatically from the native
// getUserMedia call, so this is a no-op there.
async function ensureCameraAndMicrophonePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const results = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.CAMERA,
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  ]);
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

  useEffect(() => {
    let cancelled = false;
    if (enabled && sessionId) {
      void ensureCameraAndMicrophonePermission().then((granted) => {
        if (cancelled) return;
        if (!granted) {
          setState({ status: 'error', sessionId, message: 'Camera and microphone permission is required to broadcast.' });
          return;
        }
        void controller.start(sessionId).then((next) => {
          if (!cancelled) setState(next);
        });
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
