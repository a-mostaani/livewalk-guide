import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BroadcasterPlaceholder, GuideRouteMap, ProgressRail, SafetyNote } from '../components/GuideVisuals';
import { Button, Card, colors } from '../components/Primitives';
import { captions } from '../data/mock';
import { MarketplaceRequest, SessionMessage } from '../api';

export function LiveBroadcastScreen({
  request,
  messages,
  onSendMessage,
  onEnd,
}: {
  request?: MarketplaceRequest;
  messages: SessionMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onEnd: () => void;
}) {
  const [muted, setMuted] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [paused, setPaused] = useState(false);

  const sendReply = async () => {
    try {
      await onSendMessage('I’ll slow down at the next corner.');
    } catch {
      Alert.alert('Message not sent', 'The shared session is not ready yet.');
    }
  };

  return (
    <View>
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Shared live broadcast</Text>
          <Text style={styles.title}>{request?.route ?? 'Shibuya → Meiji Shrine'}</Text>
        </View>
        <View style={styles.timerPill}><Text style={styles.timerText}>{request?.status === 'live' ? 'LIVE' : 'Ready'}</Text></View>
      </View>
      <BroadcasterPlaceholder />
      <Card style={styles.controlCard}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, paused && styles.statusDotPaused]} />
          <Text style={styles.statusText}>{paused ? 'Stream paused locally' : 'Shared session active for traveler'}</Text>
        </View>
        <View style={styles.controlGrid}>
          <Button label={muted ? 'Unmute' : 'Mute'} icon={muted ? 'mic-off' : 'mic'} variant={muted ? 'primary' : 'secondary'} onPress={() => setMuted((value) => !value)} style={styles.controlButton} />
          <Button label="Message" icon="chatbubble-ellipses" variant="secondary" onPress={sendReply} style={styles.controlButton} />
          <Button label={paused ? 'Resume' : 'Pause'} icon={paused ? 'play' : 'pause'} variant="secondary" onPress={() => setPaused((value) => !value)} style={styles.controlButton} />
          <Button label="End walk" icon="stop-circle" variant="danger" onPress={onEnd} style={styles.controlButton} />
        </View>
      </Card>
      <Card style={styles.panel}>
        <View style={styles.panelHeader}>
          <View><Text style={styles.panelTitle}>GPS and route</Text><Text style={styles.panelSub}>{request?.duration ?? '45 min'} route • next turn in 80 m</Text></View>
          <Ionicons name="navigate-circle" size={28} color={colors.blue} />
        </View>
        <GuideRouteMap compact />
        <ProgressRail progress={48} />
      </Card>
      <Card style={styles.panel}>
        <View style={styles.panelHeader}>
          <View><Text style={styles.panelTitle}>Traveler messages</Text><Text style={styles.panelSub}>Synced through the backend session room</Text></View>
          <Ionicons name="chatbubbles" size={25} color={colors.gold} />
        </View>
        <View style={styles.messageList}>
          {(messages.length ? messages : [{ id: 'empty', senderName: 'LiveWalk', text: 'No shared messages yet.', senderRole: 'system', sessionId: '', createdAt: '' }]).map((message) => (
            <View key={message.id} style={[styles.messageBubble, message.senderRole === 'guide' && styles.messageBubbleMine]}>
              <Text style={styles.messageFrom}>{message.senderName}</Text>
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
          ))}
        </View>
      </Card>
      <Card style={styles.panel}>
        <View style={styles.panelHeader}>
          <View><Text style={styles.panelTitle}>Captions and translation</Text><Text style={styles.panelSub}>{captionsOn ? 'English translation visible' : 'Captions hidden'}</Text></View>
          <Button label={captionsOn ? 'On' : 'Off'} variant="secondary" onPress={() => setCaptionsOn((value) => !value)} />
        </View>
        <View style={styles.captionList}>{captions.map((caption) => <View key={caption} style={styles.captionBubble}><Text style={styles.captionText}>{caption}</Text></View>)}</View>
      </Card>
      <SafetyNote />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
  kicker: { color: colors.gold, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: colors.ink, fontSize: 22, fontWeight: '900', marginTop: 4 },
  timerPill: { backgroundColor: colors.ink, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  timerText: { color: colors.white, fontWeight: '900' },
  controlCard: { marginTop: 14 },
  statusRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2AE088' },
  statusDotPaused: { backgroundColor: colors.gold },
  statusText: { color: colors.muted, fontWeight: '800' },
  controlGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  controlButton: { flexBasis: '47%', flexGrow: 1 },
  panel: { marginTop: 14 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 },
  panelTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  panelSub: { color: colors.muted, fontWeight: '700', marginTop: 2 },
  messageList: { gap: 8 },
  messageBubble: { backgroundColor: colors.cream, borderRadius: 16, padding: 12, alignSelf: 'flex-start', maxWidth: '92%' },
  messageBubbleMine: { alignSelf: 'flex-end', backgroundColor: colors.blueSoft },
  messageFrom: { color: colors.gold, fontWeight: '900', marginBottom: 3, fontSize: 12 },
  messageText: { color: colors.ink, fontWeight: '700', lineHeight: 20 },
  captionList: { gap: 8 },
  captionBubble: { backgroundColor: colors.cream, borderRadius: 16, padding: 12 },
  captionText: { color: colors.ink, lineHeight: 20, fontWeight: '700' },
});
