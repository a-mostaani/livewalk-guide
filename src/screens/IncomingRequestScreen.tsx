import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Header, Pill, Stat, colors } from '../components/Primitives';
import { GuideRouteMap } from '../components/GuideVisuals';
import { incomingRequest } from '../data/mock';

export function IncomingRequestScreen({ onAccept }: { onAccept: () => void }) {
  const [decision, setDecision] = useState<'new' | 'declined' | 'accepted'>('new');

  return (
    <View>
      <Header kicker="Incoming request" title="A traveler wants a live walk nearby." body="Review the route, distance, interests, language, timing, and payout before accepting." />
      <Card style={styles.heroCard}>
        <View style={styles.travelerTop}>
          <View style={styles.avatar}><Text style={styles.avatarText}>SR</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.travelerName}>{incomingRequest.travelerName}</Text>
            <Text style={styles.travelerMeta}>{incomingRequest.travelerCountry} • {incomingRequest.scheduledTime}</Text>
          </View>
          <Text style={styles.payout}>${incomingRequest.payout}</Text>
        </View>
        <Text style={styles.route}>{incomingRequest.route}</Text>
        <View style={styles.stats}>
          <Stat label="Distance" value={`${incomingRequest.distanceKm} km`} />
          <Stat label="Duration" value={incomingRequest.estimatedDuration} />
          <Stat label="Language" value={incomingRequest.language} />
        </View>
        <View style={styles.pills}>
          {incomingRequest.interests.map((interest) => <Pill key={interest} label={interest} selected />)}
        </View>
        <View style={styles.matchBanner}>
          <Ionicons name="sparkles" size={20} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.matchTitle}>Good match: {incomingRequest.specialtyMatch} + {incomingRequest.targetGroupMatch}</Text>
            <Text style={styles.matchBody}>Traveler needs align with your guide specialty and target-group tags.</Text>
          </View>
        </View>
      </Card>
      <GuideRouteMap compact />
      <View style={styles.decisionBanner}>
        <Ionicons name={decision === 'declined' ? 'close-circle' : decision === 'accepted' ? 'checkmark-circle' : 'time'} size={20} color={decision === 'declined' ? colors.danger : decision === 'accepted' ? colors.green : colors.gold} />
        <Text style={styles.decisionText}>{decision === 'declined' ? 'Mock declined. Use Next to continue testing.' : decision === 'accepted' ? 'Mock accepted. Route details are ready.' : 'Accepting unlocks route details and the pre-walk checklist.'}</Text>
      </View>
      <View style={styles.actions}>
        <Button
          label="Decline"
          icon="close"
          variant="secondary"
          onPress={() => {
            setDecision('declined');
            Alert.alert('Request declined', 'Mock decline state only. No traveler was notified.');
          }}
          style={{ flex: 1 }}
        />
        <Button
          label="Accept"
          icon="checkmark"
          variant="success"
          onPress={() => {
            setDecision('accepted');
            onAccept();
          }}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: { marginBottom: 14 },
  travelerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar: { width: 58, height: 58, borderRadius: 22, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.ink, fontWeight: '900', fontSize: 18 },
  travelerName: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  travelerMeta: { color: colors.muted, fontWeight: '700', marginTop: 2 },
  payout: { color: colors.green, fontSize: 28, fontWeight: '900' },
  route: { color: colors.ink, fontWeight: '900', fontSize: 18, lineHeight: 24 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 12 },
  pills: { flexDirection: 'row', flexWrap: 'wrap' },
  matchBanner: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 10, backgroundColor: '#FFF8EA', borderRadius: 18, padding: 13 },
  matchTitle: { color: colors.ink, fontWeight: '900', lineHeight: 20 },
  matchBody: { color: colors.muted, fontWeight: '700', lineHeight: 19, marginTop: 2 },
  decisionBanner: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 14, backgroundColor: colors.white, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: colors.line },
  decisionText: { color: colors.muted, flex: 1, fontWeight: '700', lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
});
