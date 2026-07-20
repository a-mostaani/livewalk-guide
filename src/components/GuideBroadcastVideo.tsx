import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LiveKitRoom, VideoTrack } from '@livekit/react-native';
import { useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { LIVEKIT_WS_URL } from '../config';
import { BroadcasterPlaceholder } from './GuideVisuals';
import type { GuideBroadcastConnectionProps } from '../session/guideBroadcast';

function LocalCameraPreview() {
  const { localParticipant, cameraTrack } = useLocalParticipant();
  const trackRef = cameraTrack ? { participant: localParticipant, publication: cameraTrack, source: Track.Source.Camera } : undefined;
  return <VideoTrack trackRef={trackRef} style={styles.video} objectFit="cover" mirror />;
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
  if (!connectionProps.connect || !connectionProps.token) {
    return <BroadcasterPlaceholder guideName={guideName} travelerName={travelerName} />;
  }
  return (
    <View style={styles.wrapper}>
      <LiveKitRoom
        serverUrl={LIVEKIT_WS_URL}
        token={connectionProps.token}
        connect={connectionProps.connect}
        video={connectionProps.video}
        audio={connectionProps.audio}
      >
        <LocalCameraPreview />
      </LiveKitRoom>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { height: 342, borderRadius: 32, overflow: 'hidden', backgroundColor: '#07131D' },
  video: { flex: 1 },
});
