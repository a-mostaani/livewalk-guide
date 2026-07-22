import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LiveKitRoom, VideoTrack } from '@livekit/react-native';
import { useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { LIVEKIT_WS_URL } from '../config';
import { BroadcasterPlaceholder } from './GuideVisuals';
import type { GuideBroadcastConnectionProps } from '../session/guideBroadcast';

type FacingMode = 'user' | 'environment';

function LocalCameraPreview({ facingMode, onFlip }: { facingMode: FacingMode; onFlip: () => void }) {
  const { localParticipant, cameraTrack } = useLocalParticipant();
  const trackRef = cameraTrack ? { participant: localParticipant, publication: cameraTrack, source: Track.Source.Camera } : undefined;

  const flipCamera = async () => {
    const next: FacingMode = facingMode === 'environment' ? 'user' : 'environment';
    await localParticipant.setCameraEnabled(true, { facingMode: next });
    onFlip();
  };

  return (
    <>
      <VideoTrack trackRef={trackRef} style={styles.video} objectFit="cover" mirror={facingMode === 'user'} />
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Switch camera" style={styles.flipButton} onPress={() => void flipCamera()}>
        <Ionicons name="camera-reverse" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </>
  );
}

export function GuideBroadcastVideo({
  connectionProps,
  guideName,
  travelerName,
}: {
  connectionProps: GuideBroadcastConnectionProps;
  guideName: string;
  travelerName: string;
}) {
  // Environment (back) camera by default - a walking-tour guide broadcasts
  // their surroundings to the traveler, not a selfie view. The guide can
  // still flip to the front camera (e.g. to say hello) via the on-screen button.
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');

  if (!connectionProps.connect || !connectionProps.token) {
    return <BroadcasterPlaceholder guideName={guideName} travelerName={travelerName} />;
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
        <LocalCameraPreview facingMode={facingMode} onFlip={() => setFacingMode((current) => current === 'environment' ? 'user' : 'environment')} />
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
});
