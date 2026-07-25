import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LiveKitRoom, VideoTrack } from '@livekit/react-native';
import { useLocalParticipant } from '@livekit/components-react';
import { LocalVideoTrack, MediaDeviceFailure, Room, Track } from 'livekit-client';
import { LIVEKIT_WS_URL } from '../config';
import { BroadcasterPlaceholder } from './GuideVisuals';
import type { GuideBroadcastConnectionProps } from '../session/guideBroadcast';

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

function FlipCameraButton({ facingMode, onFlip }: { facingMode: FacingMode; onFlip: () => void }) {
  const { localParticipant } = useLocalParticipant();

  const flipCamera = async () => {
    const next: FacingMode = facingMode === 'environment' ? 'user' : 'environment';
    // setCameraEnabled(true, ...) only unmutes an already-published track and
    // silently ignores new capture options - it does not switch the physical
    // camera. Restarting the existing LocalVideoTrack with a new facingMode
    // constraint is what actually re-negotiates the device.
    const publication = localParticipant.getTrackPublication(Track.Source.Camera);
    const track = publication?.track;
    if (track instanceof LocalVideoTrack) {
      await track.restartTrack({ facingMode: next });
    } else {
      await localParticipant.setCameraEnabled(true, { facingMode: next });
    }
    onFlip();
  };

  return (
    // Forces this overlay onto its own hardware layer on Android so it
    // reliably composites above the SurfaceView-backed video beneath it.
    <View style={styles.flipButton} renderToHardwareTextureAndroid={Platform.OS === 'android'}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Switch camera" style={styles.flipButtonTouchable} onPress={() => void flipCamera()}>
        <Ionicons name="camera-reverse" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

export function GuideBroadcastVideo({
  connectionProps,
  guideName,
  travelerName,
  errorMessage,
}: {
  connectionProps: GuideBroadcastConnectionProps;
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
  const retriedSourcesRef = useRef<Set<Track.Source>>(new Set());

  // A fresh session gets a clean retry budget and clears any error left over
  // from a previous booking cycle.
  useEffect(() => {
    retriedSourcesRef.current.clear();
    setMediaError(undefined);
  }, [connectionProps.token]);

  // Right after a freshly-granted Android runtime permission, the very first
  // camera/mic open can transiently fail before the OS settles the device -
  // this was reported as "camera worked on the 2nd booking cycle, not the
  // 1st". Retry once automatically instead of leaving the guide stuck with
  // no video until they restart the app; only give up (and tell the guide)
  // after a second failure on the same device, or immediately on an actual
  // permission denial where retrying can't help.
  const handleMediaDeviceFailure = useCallback((failure?: MediaDeviceFailure, kind?: MediaDeviceKind) => {
    const source = kind === 'audioinput' ? Track.Source.Microphone : Track.Source.Camera;
    const label = source === Track.Source.Camera ? 'camera' : 'microphone';
    if (failure === MediaDeviceFailure.PermissionDenied) {
      setMediaError(`Camera and microphone permission is required to broadcast.`);
      return;
    }
    if (retriedSourcesRef.current.has(source)) {
      setMediaError(`Could not start the ${label}. Try leaving and rejoining the walk.`);
      return;
    }
    retriedSourcesRef.current.add(source);
    setTimeout(() => {
      const localParticipant = roomRef.current?.localParticipant;
      if (!localParticipant) return;
      if (source === Track.Source.Camera) void localParticipant.setCameraEnabled(true, { facingMode });
      else void localParticipant.setMicrophoneEnabled(true);
    }, 800);
  }, [facingMode]);

  if (!connectionProps.connect || !connectionProps.token) {
    return <BroadcasterPlaceholder guideName={guideName} travelerName={travelerName} errorMessage={errorMessage} />;
  }
  return (
    <View style={styles.wrapper}>
      <LiveKitRoom
        room={roomRef.current}
        serverUrl={LIVEKIT_WS_URL}
        token={connectionProps.token}
        connect={connectionProps.connect}
        video={connectionProps.video ? { facingMode } : false}
        audio={connectionProps.audio}
        onMediaDeviceFailure={handleMediaDeviceFailure}
      >
        <LocalCameraPreview facingMode={facingMode} />
        <FlipCameraButton facingMode={facingMode} onFlip={() => setFacingMode((current) => current === 'environment' ? 'user' : 'environment')} />
      </LiveKitRoom>
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
