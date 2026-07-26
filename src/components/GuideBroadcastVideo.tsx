import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoTrack } from '@livekit/react-native';
import { RoomContext, useLocalParticipant } from '@livekit/components-react';
import {
  LocalVideoTrack,
  MediaDeviceFailure,
  Room,
  RoomEvent,
  Track,
  type VideoCaptureOptions,
} from 'livekit-client';
import { LIVEKIT_WS_URL } from '../config';
import { BroadcasterPlaceholder } from './GuideVisuals';
import type { GuideBroadcastConnectionProps } from '../session/guideBroadcast';
import { GuideMediaLifecycle, type GuideMediaSource } from '../session/guideMediaLifecycle';

type FacingMode = 'user' | 'environment';

function LocalCameraPreview({ facingMode }: { facingMode: FacingMode }) {
  const { cameraTrack, localParticipant } = useLocalParticipant();
  const trackRef = cameraTrack ? { participant: localParticipant, publication: cameraTrack, source: Track.Source.Camera } : undefined;
  const localVideoTrack = cameraTrack?.track;

  // No explicit VideoCaptureOptions/TrackPublishOptions are set anywhere in
  // this component, so LiveKit's defaults apply: h720 (1280x720) capture
  // with simulcast on, auto-deriving a q(~180p)/h(~360p)/f(720p) ladder for
  // a 16:9 source. Log what's actually achieved on this device (cameras
  // don't always support the exact requested resolution) and the real
  // encoding parameters applied to the sender for each simulcast layer.
  useEffect(() => {
    if (!(localVideoTrack instanceof LocalVideoTrack)) return;
    const settings = localVideoTrack.mediaStreamTrack?.getSettings();
    const encodings = localVideoTrack.sender?.getParameters().encodings;
    console.log(
      `[LiveWalk] guide capture: ${settings?.width}x${settings?.height}@${settings?.frameRate}fps`,
      '| simulcast encodings:',
      encodings?.map((e) => ({ rid: e.rid, maxBitrate: e.maxBitrate, scaleResolutionDownBy: e.scaleResolutionDownBy, maxFramerate: e.maxFramerate })),
    );
  }, [localVideoTrack]);

  // zOrder=1 ("media overlay") matches the LiveKit/react-native-webrtc docs'
  // recommendation for the local preview. The default (unset) zOrder has been
  // observed to let the SurfaceView-backed video paint over RN sibling views
  // on some Android devices, hiding the flip button rendered above it.
  return <VideoTrack trackRef={trackRef} style={styles.video} objectFit="cover" mirror={facingMode === 'user'} zOrder={1} />;
}

function FlipCameraButton({ onFlip }: { onFlip: () => Promise<void> }) {
  return (
    // Forces this overlay onto its own hardware layer on Android so it
    // reliably composites above the SurfaceView-backed video beneath it.
    <View style={styles.flipButton} renderToHardwareTextureAndroid={Platform.OS === 'android'}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Switch camera" style={styles.flipButtonTouchable} onPress={() => void onFlip()}>
        <Ionicons name="camera-reverse" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

export function GuideBroadcastVideo({
  connectionProps,
  sessionId,
  guideName,
  travelerName,
  errorMessage,
}: {
  connectionProps: GuideBroadcastConnectionProps;
  sessionId?: string;
  guideName: string;
  travelerName: string;
  errorMessage?: string;
}) {
  // Environment (back) camera by default - a walking-tour guide broadcasts
  // their surroundings to the traveler, not a selfie view. The guide can
  // still flip to the front camera (e.g. to say hello) via the on-screen button.
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [mediaError, setMediaError] = useState<string | undefined>(undefined);
  const roomRef = useRef<Room | undefined>(undefined);
  if (!roomRef.current) roomRef.current = new Room();
  const room = roomRef.current;
  const cameraCaptureOptions = useMemo<VideoCaptureOptions>(() => ({ facingMode }), [facingMode]);
  const cameraCaptureOptionsRef = useRef(cameraCaptureOptions);
  cameraCaptureOptionsRef.current = cameraCaptureOptions;
  const connectionEpochRef = useRef(0);
  const roomTransitionRef = useRef<Promise<void>>(Promise.resolve());
  const mediaLifecycleRef = useRef<GuideMediaLifecycle<VideoCaptureOptions> | undefined>(undefined);

  const diagnosticLog = useCallback((event: string, details: Record<string, unknown> = {}) => {
    console.info(`[LiveWalk][LiveKit] ${event}`, details);
  }, []);

  if (!mediaLifecycleRef.current) {
    mediaLifecycleRef.current = new GuideMediaLifecycle<VideoCaptureOptions>({
      getCameraOptions: () => cameraCaptureOptionsRef.current,
      startCamera: async (options) => {
        await room.localParticipant.setCameraEnabled(true, options);
      },
      startMicrophone: async () => {
        await room.localParticipant.setMicrophoneEnabled(true);
      },
      stopCamera: async () => {
        await room.localParticipant.setCameraEnabled(false);
      },
      stopMicrophone: async () => {
        await room.localParticipant.setMicrophoneEnabled(false);
      },
      restartCamera: async (options) => {
        const publication = room.localParticipant.getTrackPublication(Track.Source.Camera);
        const track = publication?.track;
        if (track instanceof LocalVideoTrack) await track.restartTrack(options);
        else await room.localParticipant.setCameraEnabled(true, options);
      },
      onError: setMediaError,
      onRecovered: () => setMediaError(undefined),
      log: diagnosticLog,
    });
  }
  const mediaLifecycle = mediaLifecycleRef.current;

  const enqueueRoomTransition = useCallback((operation: () => Promise<void>) => {
    const next = roomTransitionRef.current.then(operation, operation);
    roomTransitionRef.current = next.then(() => undefined, () => undefined);
    return next;
  }, []);

  useEffect(() => {
    const epoch = ++connectionEpochRef.current;
    const token = connectionProps.token;
    const shouldConnect = connectionProps.connect && Boolean(token);
    const sessionKey = sessionId ?? 'unknown-session';
    let connectedForEpoch = false;

    setMediaError(undefined);

    const logConnection = (event: string, details: Record<string, unknown> = {}) => {
      diagnosticLog(event, { session: sessionKey, state: room.state, ...details });
    };
    const onConnected = () => {
      if (connectionEpochRef.current !== epoch) return;
      connectedForEpoch = true;
      logConnection('connection-connected');
      if (connectionProps.video || connectionProps.audio) void mediaLifecycle.startOnConnected(sessionKey);
    };
    const onReconnecting = () => {
      if (connectionEpochRef.current !== epoch) return;
      mediaLifecycle.handleConnectionTransition('reconnecting');
    };
    const onSignalReconnecting = () => {
      if (connectionEpochRef.current !== epoch) return;
      mediaLifecycle.handleConnectionTransition('signal-reconnecting');
    };
    const onReconnected = () => {
      if (connectionEpochRef.current !== epoch) return;
      mediaLifecycle.handleConnectionTransition('reconnected');
      logConnection('connection-restored', { mediaRestarted: false });
    };
    const onDisconnected = (reason?: unknown) => {
      if (connectionEpochRef.current !== epoch) return;
      mediaLifecycle.handleConnectionTransition('disconnected');
      logConnection('connection-disconnected', { reason: String(reason ?? 'unknown') });
      if (connectedForEpoch) void mediaLifecycle.endSession('room-disconnected');
      connectedForEpoch = false;
    };
    const onConnectionStateChanged = (state: unknown) => {
      if (connectionEpochRef.current !== epoch) return;
      logConnection('connection-state', { nextState: String(state) });
    };
    const onMediaDevicesError = (error: Error, kind?: MediaDeviceKind) => {
      if (connectionEpochRef.current !== epoch) return;
      const failure = MediaDeviceFailure.getFailure(error);
      const source: GuideMediaSource = kind === 'audioinput' ? 'microphone' : 'camera';
      diagnosticLog('media-device-error', {
        session: sessionKey,
        source,
        failure: failure ?? 'unknown',
        error: safeDiagnosticError(error),
      });
      mediaLifecycle.handleMediaFailure(failure === MediaDeviceFailure.PermissionDenied, source);
    };

    room
      .on(RoomEvent.Connected, onConnected)
      .on(RoomEvent.Reconnecting, onReconnecting)
      .on(RoomEvent.SignalReconnecting, onSignalReconnecting)
      .on(RoomEvent.Reconnected, onReconnected)
      .on(RoomEvent.Disconnected, onDisconnected)
      .on(RoomEvent.ConnectionStateChanged, onConnectionStateChanged)
      .on(RoomEvent.MediaDevicesError, onMediaDevicesError);

    if (shouldConnect && token) {
      void enqueueRoomTransition(async () => {
        if (connectionEpochRef.current !== epoch) return;
        logConnection('connection-start');
        try {
          await room.connect(LIVEKIT_WS_URL, token);
        } catch (error) {
          if (connectionEpochRef.current !== epoch) return;
          diagnosticLog('connection-failed', { session: sessionKey, error: safeDiagnosticError(error) });
          setMediaError('Could not connect the live broadcast. Try leaving and rejoining the walk.');
        }
      });
    } else {
      void enqueueRoomTransition(async () => {
        await mediaLifecycle.endSession('inactive');
        await room.disconnect();
      });
    }

    return () => {
      connectionEpochRef.current += 1;
      connectedForEpoch = false;
      room
        .off(RoomEvent.Connected, onConnected)
        .off(RoomEvent.Reconnecting, onReconnecting)
        .off(RoomEvent.SignalReconnecting, onSignalReconnecting)
        .off(RoomEvent.Reconnected, onReconnected)
        .off(RoomEvent.Disconnected, onDisconnected)
        .off(RoomEvent.ConnectionStateChanged, onConnectionStateChanged)
        .off(RoomEvent.MediaDevicesError, onMediaDevicesError);
      void enqueueRoomTransition(async () => {
        await mediaLifecycle.endSession('session-change-or-unmount');
        await room.disconnect();
        diagnosticLog('connection-cleanup', { session: sessionKey });
      });
    };
  }, [
    connectionProps.audio,
    connectionProps.connect,
    connectionProps.token,
    connectionProps.video,
    diagnosticLog,
    enqueueRoomTransition,
    mediaLifecycle,
    room,
    sessionId,
  ]);

  const flipCamera = useCallback(async () => {
    const next: FacingMode = facingMode === 'environment' ? 'user' : 'environment';
    const restarted = await mediaLifecycle.restartCamera({ facingMode: next });
    if (restarted) setFacingMode(next);
  }, [facingMode, mediaLifecycle]);

  if (!connectionProps.connect || !connectionProps.token) {
    return <BroadcasterPlaceholder guideName={guideName} travelerName={travelerName} errorMessage={errorMessage} />;
  }
  return (
    <View style={styles.wrapper}>
      <RoomContext.Provider value={room}>
        <LocalCameraPreview facingMode={facingMode} />
        <FlipCameraButton onFlip={flipCamera} />
      </RoomContext.Provider>
      {mediaError ? (
        <View style={styles.mediaErrorBanner}>
          <Text style={styles.mediaErrorText}>{mediaError}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { height: 342, borderRadius: 32, overflow: 'hidden', backgroundColor: '#07131D' },
  video: { flex: 1 },
  flipButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  flipButtonTouchable: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  mediaErrorBanner: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  mediaErrorText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, lineHeight: 18 },
});

function safeDiagnosticError(error: unknown): string {
  if (!(error instanceof Error)) return 'unknown';
  return `${error.name}: ${error.message}`
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[credential-redacted]')
    .replace(/(token=)[^&\s]+/gi, '$1[credential-redacted]');
}
