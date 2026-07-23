import React, { useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LiveKitRoom, VideoTrack } from '@livekit/react-native';
import { useLocalParticipant } from '@livekit/components-react';
import { LocalVideoTrack, Track } from 'livekit-client';
import { LIVEKIT_WS_URL } from '../config';
import { BroadcasterPlaceholder } from './GuideVisuals';
import type { GuideBroadcastConnectionProps } from '../session/guideBroadcast';

type FacingMode = 'user' | 'environment';

function LocalCameraPreview({ facingMode }: { facingMode: FacingMode }) {
  const { cameraTrack, localParticipant } = useLocalParticipant();
  const trackRef = cameraTrack ? { participant: localParticipant, publication: cameraTrack, source: Track.Source.Camera } : undefined;

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

  if (!connectionProps.connect || !connectionProps.token) {
    return <BroadcasterPlaceholder guideName={guideName} travelerName={travelerName} errorMessage={errorMessage} />;
  }
  return (
    <View style={styles.wrapper}>
      <LiveKitRoom
        serverUrl={LIVEKIT_WS_URL}
        token={connectionProps.token}
        connect={connectionProps.connect}
        video={connectionProps.video ? { facingMode } : false}
        audio={connectionProps.audio}
      >
        <LocalCameraPreview facingMode={facingMode} />
        <FlipCameraButton facingMode={facingMode} onFlip={() => setFacingMode((current) => current === 'environment' ? 'user' : 'environment')} />
      </LiveKitRoom>
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
});
