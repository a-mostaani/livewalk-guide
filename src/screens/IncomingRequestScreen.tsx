import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Header, Pill, Stat, colors } from '../components/Primitives';
import { GuideRouteMap } from '../components/GuideVisuals';
import { MarketplaceRequest } from '../api';
import { formatDuration, formatEstimateTotal, formatScheduledStart } from '../format';

export function IncomingRequestScreen({ request, busy = false, onAccept, onDecline }: { request?: MarketplaceRequest; busy?: boolean; onAccept: () => void; onDecline: () => void }) {
  if (!request) {
    return (
      <View>
        <Header kicker="Incoming request" title="No live traveler request selected." body="Create a request in the traveler APK, then return to the dashboard to open it here." />
        <Card style={styles.decisionBanner}><Text style={styles.decisionText}>The guide app is connected to the shared backend and polling for pending requests.</Text></Card>
      </View>
    );
  }

  const travelerName = request.travelerName?.trim() || 'Traveler';

  return (
    <View>
      <Header kicker="Incoming request" title={`${travelerName} wants a live walk nearby.`} body="This card came from the logged-in traveler profile through the shared backend." />
      <Card style={styles.heroCard}>
        <View style={styles.travelerTop}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{travelerName.slice(0, 2).toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.travelerName}>{travelerName}</Text>
            <Text style={styles.travelerMeta}>{formatScheduledStart(request.scheduledStart)} • {request.id}</Text>
          </View>
          <Text style={styles.payout}>{formatEstimateTotal(request.estimate)}</Text>
        </View>
        <Text style={styles.route}>{request.route}</Text>
        <View style={styles.stats}>
          <Stat label="Status" value={request.status} />
          <Stat label="Duration" value={formatDuration(request.durationMinutes)} />
          <Stat label="Language" value={request.language} />
        </View>
        <View style={styles.pills}>{request.interests.map((interest) => <Pill key={interest} label={interest} selected />)}</View>
        <View style={styles.matchBanner}>
          <Ionicons name="sparkles" size={20} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.matchTitle}>Good demo match: English + local stories</Text>
            <Text style={styles.matchBody}>Accepting updates the traveler APK to confirmed and creates the shared session room.</Text>
          </View>
        </View>
      </Card>
      <GuideRouteMap compact />
      <View style={styles.decisionBanner}>
        <Ionicons name="sync" size={20} color={colors.green} />
        <Text style={styles.decisionText}>Accept or decline is posted to the backend immediately.</Text>
      </View>
      <View style={styles.actions}>
        <Button label={busy ? 'Declining…' : 'Decline'} icon="close" variant="secondary" onPress={onDecline} disabled={busy} style={{ flex: 1 }} />
        <Button label={busy ? 'Accepting…' : 'Accept'} icon="checkmark" variant="success" onPress={onAccept} disabled={busy} style={{ flex: 1 }} />
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
