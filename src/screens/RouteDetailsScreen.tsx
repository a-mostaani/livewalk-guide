import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Header, Pill, Stat, colors } from '../components/Primitives';
import { GuideRouteMap, SafetyNote } from '../components/GuideVisuals';
import { routeStops } from '../data/mock';
import { MarketplaceRequest } from '../api';
import { formatDuration, formatEstimateTotal } from '../format';

export function RouteDetailsScreen({ request, onContinue }: { request?: MarketplaceRequest; onContinue: () => void }) {
  return (
    <View>
      <Header kicker="Route details" title="Confirm the walk path before you head out." body="Route details are read from the accepted traveler request." />
      <GuideRouteMap />
      <Card style={styles.routeCard}>
        <Text style={styles.sectionTitle}>Start</Text>
        <Text style={styles.routeText}>{request?.origin.label ?? 'No request selected'}</Text>
        <Text style={styles.arrow}>↓</Text>
        <Text style={styles.sectionTitle}>Destination</Text>
        <Text style={styles.routeText}>{request?.destination.label ?? 'Create and accept a traveler request first'}</Text>
        <View style={styles.stats}>
          <Stat label="Booking" value={request?.id.slice(0, 8) ?? '—'} />
          <Stat label="Payout" value={formatEstimateTotal(request?.estimate)} />
          <Stat label="Time" value={formatDuration(request?.durationMinutes)} />
        </View>
        <View style={styles.pills}>
          {request?.language ? <Pill label={request.language} selected /> : null}
          {request?.interests.map((interest) => <Pill key={interest} label={interest} />)}
        </View>
      </Card>
      <Card style={styles.stopsCard}>
        <Text style={styles.sectionTitle}>Stops and prompts</Text>
        {routeStops.map((stop, index) => (
          <View key={stop.title} style={styles.stopRow}>
            <View style={styles.stopIndex}><Text style={styles.stopIndexText}>{index + 1}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.stopTitle}>{stop.title}</Text><Text style={styles.stopNote}>{stop.note}</Text></View>
          </View>
        ))}
      </Card>
      <SafetyNote />
      <Button label="Open pre-walk checklist" icon="checkmark-done" onPress={onContinue} style={{ marginTop: 18 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  routeCard: { marginTop: 14 },
  sectionTitle: { color: colors.ink, fontWeight: '900', fontSize: 17, marginBottom: 6 },
  routeText: { color: colors.muted, fontWeight: '800', lineHeight: 20 },
  arrow: { color: colors.gold, fontSize: 24, fontWeight: '900', marginVertical: 8 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 12 },
  pills: { flexDirection: 'row', flexWrap: 'wrap' },
  stopsCard: { marginTop: 14, gap: 12 },
  stopRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stopIndex: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  stopIndexText: { color: colors.white, fontWeight: '900' },
  stopTitle: { color: colors.ink, fontWeight: '900', fontSize: 15 },
  stopNote: { color: colors.muted, marginTop: 3, lineHeight: 19, fontWeight: '700' },
});
