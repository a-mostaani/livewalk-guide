import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BroadcasterPlaceholder, GuideRouteMap, ProgressRail, SafetyNote } from '../components/GuideVisuals';
import { Button, Card, colors } from '../components/Primitives';
import { captions } from '../data/mock';
import { MarketplaceRequest, SessionMessage } from '../api';
import { formatDuration } from '../format';

export function LiveBroadcastScreen({
  request,
  guideName = 'Guide',
  messages,
  onSendMessage,
  onEnd,
}: {
  request?: MarketplaceRequest;
  guideName?: string;
  messages: SessionMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onEnd: () => void;
}) {
  const [talking, setTalking] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [paused, setPaused] = useState(false);
  const [actionNote, setActionNote] = useState('Hold to talk sends guide voice-status events to the traveler.');
  const sessionReady = Boolean(request?.sessionId);
  const travelerName = request?.travelerName?.trim() || 'Traveler';
  const latestTravelerAlert = [...messages].reverse().find((message) =>
    message.senderRole === 'traveler' && (message.text.includes('STOP HERE') || message.text.includes('holding to talk') || message.text.includes('route change'))
  );

  const sendSessionEvent = async (text: string, success: string) => {
    if (!sessionReady) {
      setActionNote('Controls unlock after the shared session starts.');
      Alert.alert('Session not ready', 'Start the shared live session first.');
      return;
    }
    try {
      await onSendMessage(text);
      setActionNote(success);
    } catch {
      setActionNote('Not sent yet — the shared session is not ready.');
      Alert.alert('Message not sent', 'The shared session is not ready yet.');
    }
  };

  const sendReply = () => sendSessionEvent('Guide message: I’ll slow down at the next corner.', 'Message sent to the traveler.');

  const startTalking = () => {
    if (!sessionReady) return;
    setTalking(true);
    void sendSessionEvent('🎙️ Guide is holding to talk.', 'Talk status sent to the traveler.');
  };

  const stopTalking = () => {
    if (!talking) return;
    setTalking(false);
    void sendSessionEvent('🎙️ Guide finished talking.', 'Talk status ended.');
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
      <BroadcasterPlaceholder guideName={guideName.trim() || 'Guide'} travelerName={travelerName} />
      {latestTravelerAlert ? (
        <Card style={styles.alertCard}>
          <View style={styles.alertRow}>
            <Ionicons name="alert-circle" size={24} color={colors.danger} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Traveler needs attention</Text>
              <Text style={styles.alertText}>{latestTravelerAlert.text}</Text>
            </View>
          </View>
        </Card>
      ) : null}
      <Card style={styles.controlCard}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, paused && styles.statusDotPaused]} />
          <Text style={styles.statusText}>{paused ? 'Stream paused locally' : 'Shared session active for traveler'}</Text>
        </View>
        <View style={styles.controlGrid}>
          <TouchableOpacity
            activeOpacity={0.82}
            onPressIn={startTalking}
            onPressOut={stopTalking}
            disabled={!sessionReady}
            style={[styles.holdButton, talking && styles.holdButtonActive, !sessionReady && styles.controlDisabled, styles.controlButton]}
          >
            <Ionicons name={talking ? 'mic' : 'mic-outline'} size={18} color={talking ? colors.white : colors.ink} />
            <Text style={[styles.holdButtonText, talking && styles.holdButtonTextActive]}>{talking ? 'Talking…' : 'Hold to talk'}</Text>
          </TouchableOpacity>
          <Button label="Message" icon="chatbubble-ellipses" variant="secondary" onPress={sendReply} disabled={!sessionReady} style={styles.controlButton} />
          <Button label={paused ? 'Resume' : 'Pause'} icon={paused ? 'play' : 'pause'} variant="secondary" onPress={() => setPaused((value) => !value)} disabled={!sessionReady} style={styles.controlButton} />
          <Button label="End walk" icon="stop-circle" variant="danger" onPress={onEnd} style={styles.controlButton} />
        </View>
        <Text style={styles.actionNote}>{sessionReady ? actionNote : 'Controls unlock after the shared live session starts.'}</Text>
      </Card>
      <Card style={styles.panel}>
        <View style={styles.panelHeader}>
          <View><Text style={styles.panelTitle}>GPS and route</Text><Text style={styles.panelSub}>{formatDuration(request?.durationMinutes)} route • next turn in 80 m</Text></View>
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
  alertCard: { marginTop: 14, backgroundColor: '#FFF1F1', borderColor: '#F1B8B8' },
  alertRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  alertTitle: { color: colors.danger, fontWeight: '900', fontSize: 16, marginBottom: 3 },
  alertText: { color: colors.ink, fontWeight: '800', lineHeight: 20 },
  controlCard: { marginTop: 14 },
  statusRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2AE088' },
  statusDotPaused: { backgroundColor: colors.gold },
  statusText: { color: colors.muted, fontWeight: '800' },
  controlGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  controlButton: { flexBasis: '47%', flexGrow: 1 },
  holdButton: {
    minHeight: 48,
    borderRadius: 18,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  holdButtonActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  holdButtonText: { color: colors.ink, fontWeight: '800', fontSize: 15 },
  holdButtonTextActive: { color: colors.white },
  controlDisabled: { opacity: 0.45 },
  actionNote: { color: colors.muted, fontWeight: '700', lineHeight: 19, marginTop: 12 },
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
