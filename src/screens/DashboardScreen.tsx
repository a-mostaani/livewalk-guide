import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Header, Pill, Stat, colors } from '../components/Primitives';
import { guideProfile } from '../data/mock';

export function DashboardScreen({ online, onToggleOnline, onViewRequest }: { online: boolean; onToggleOnline: () => void; onViewRequest: () => void }) {
  return (
    <View>
      <Header
        kicker="Availability"
        title={online ? 'You are available for nearby walks.' : 'Go online when you are ready to guide.'}
        body="This guide dashboard keeps status, current area, language, rating, and today’s progress visible before requests arrive."
      />
      <Card style={styles.statusCard}>
        <View style={styles.statusTop}>
          <View>
            <Text style={styles.statusLabel}>Guide status</Text>
            <Text style={styles.statusTitle}>{online ? 'Online' : 'Offline'}</Text>
          </View>
          <Switch value={online} onValueChange={onToggleOnline} trackColor={{ false: colors.line, true: '#A8DFCF' }} thumbColor={online ? colors.green : colors.white} />
        </View>
        <View style={styles.signalRow}>
          <View style={[styles.signalDot, online && styles.signalDotOnline]} />
          <Text style={styles.signalText}>{online ? 'Receiving mocked traveler requests' : 'Not visible to travelers'}</Text>
        </View>
      </Card>
      <Card style={styles.profileCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>YT</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{guideProfile.name}</Text>
            <Text style={styles.meta}>{guideProfile.city} • {guideProfile.area}</Text>
          </View>
          <View style={styles.ratingPill}><Text style={styles.rating}>★ {guideProfile.rating}</Text></View>
        </View>
        <View style={styles.pills}>
          <Pill label={guideProfile.language} selected />
          <Pill label="Public routes only" />
        </View>
        <View style={styles.tagSection}>
          <Text style={styles.tagLabel}>Specialties</Text>
          <View style={styles.pills}>
            {guideProfile.specialties.map((tag) => <Pill key={tag} label={tag} selected />)}
          </View>
        </View>
        <View style={styles.tagSection}>
          <Text style={styles.tagLabel}>Target groups</Text>
          <View style={styles.pills}>
            {guideProfile.targetGroups.map((tag) => <Pill key={tag} label={tag} />)}
          </View>
        </View>
      </Card>
      <View style={styles.stats}>
        <Stat label="Walks" value={`${guideProfile.walks}`} />
        <Stat label="Today" value={guideProfile.todayEarnings} />
        <Stat label="Response" value={guideProfile.responseTime} />
      </View>
      <Card style={styles.requestTeaser}>
        <View style={styles.requestIcon}><Ionicons name="notifications" size={24} color={colors.white} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.requestTitle}>Incoming request ready</Text>
          <Text style={styles.requestBody}>Preview the traveler card, accept/decline actions, and route details.</Text>
        </View>
      </Card>
      <Button label="View incoming request" icon="radio" onPress={onViewRequest} style={{ marginTop: 18 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  statusCard: { backgroundColor: colors.ink, marginBottom: 14 },
  statusTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusLabel: { color: 'rgba(255,255,255,0.68)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 },
  statusTitle: { color: colors.white, fontSize: 30, fontWeight: '900', marginTop: 2 },
  signalRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 14 },
  signalDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.muted },
  signalDotOnline: { backgroundColor: '#2AE088' },
  signalText: { color: 'rgba(255,255,255,0.76)', fontWeight: '700' },
  profileCard: { marginBottom: 14 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 58, height: 58, borderRadius: 22, backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.ink, fontWeight: '900', fontSize: 18 },
  name: { color: colors.ink, fontSize: 19, fontWeight: '900' },
  meta: { color: colors.muted, fontWeight: '700', marginTop: 2 },
  ratingPill: { backgroundColor: colors.cream, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  rating: { color: colors.gold, fontWeight: '900' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 },
  tagSection: { marginTop: 2 },
  tagLabel: { color: colors.muted, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 11, marginTop: 12 },
  stats: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  requestTeaser: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  requestIcon: { width: 54, height: 54, borderRadius: 20, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  requestTitle: { color: colors.ink, fontWeight: '900', fontSize: 17 },
  requestBody: { color: colors.muted, lineHeight: 19, marginTop: 3 },
});
