import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Header, Stat, colors } from '../components/Primitives';
import { MarketplaceRequest } from '../api';

const checklistItems = [
  'I am at the public starting point',
  'Battery is above 40% or charger is ready',
  'Network looks stable for video',
  'Camera lens is clean and phone grip is secure',
  'Traveler language and interests reviewed',
];

export function ChecklistScreen({ request, onReadyChange, onStartStream }: { request?: MarketplaceRequest; onReadyChange?: (ready: boolean) => void; onStartStream: () => void }) {
  const [checked, setChecked] = useState<string[]>([]);
  const toggle = (item: string) => setChecked((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
  const readyCount = checked.length;
  const missingItems = checklistItems.filter((item) => !checked.includes(item));
  const allChecked = missingItems.length === 0;

  useEffect(() => {
    onReadyChange?.(allChecked);
  }, [allChecked, onReadyChange]);

  return (
    <View>
      <Header kicker="Confirmed trip" title="Run the pre-walk checklist." body="Complete every readiness check to unlock the shared live session." />
      <Card style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.icon}><Ionicons name="calendar" size={26} color={colors.white} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{request?.route ?? 'No accepted request selected'}</Text>
            <Text style={styles.heroSub}>{request?.scheduledTime ?? '—'} • {request?.language ?? '—'}</Text>
          </View>
        </View>
        <View style={styles.stats}>
          <Stat label="Payout" value="$32" tone="dark" />
          <Stat label="Ready" value={`${readyCount}/5`} tone="dark" />
          <Stat label="Duration" value={request?.duration ?? '—'} tone="dark" />
        </View>
      </Card>
      <Card style={styles.checkCard}>
        {checklistItems.map((item) => {
          const active = checked.includes(item);
          return (
            <TouchableOpacity key={item} activeOpacity={0.82} onPress={() => toggle(item)} style={styles.checkRow}>
              <Ionicons name={active ? 'checkbox' : 'square-outline'} size={24} color={active ? colors.green : colors.muted} />
              <Text style={[styles.checkText, active && styles.checkTextActive]}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </Card>
      <Card style={[styles.reminderCard, allChecked && styles.readyCard]}>
        <Text style={styles.reminderTitle}>{allChecked ? 'Ready to start' : 'Finish the readiness checks'}</Text>
        <Text style={styles.reminderText}>
          {allChecked
            ? `All ${checklistItems.length} checks are complete. Starting live writes the shared state for both APKs.`
            : `${readyCount}/${checklistItems.length} complete. Check: ${missingItems[0]}.`}
        </Text>
      </Card>
      <Button
        label={allChecked ? 'Start shared live session' : 'Complete checklist first'}
        icon={allChecked ? 'videocam' : 'lock-closed'}
        onPress={onStartStream}
        disabled={!allChecked}
        style={{ marginTop: 18 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: { backgroundColor: colors.ink, marginBottom: 14 },
  heroTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  icon: { width: 56, height: 56, borderRadius: 20, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: colors.white, fontSize: 19, fontWeight: '900', lineHeight: 24 },
  heroSub: { color: 'rgba(255,255,255,0.72)', marginTop: 4, fontWeight: '700' },
  stats: { flexDirection: 'row', gap: 8, marginTop: 16 },
  checkCard: { gap: 4 },
  checkRow: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 11 },
  checkText: { color: colors.muted, fontWeight: '800', flex: 1, lineHeight: 20 },
  checkTextActive: { color: colors.ink },
  reminderCard: { marginTop: 14, backgroundColor: '#FFF8EA' },
  readyCard: { backgroundColor: '#E9F7F2', borderColor: '#B7E1D1' },
  reminderTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', marginBottom: 6 },
  reminderText: { color: colors.muted, fontWeight: '700', lineHeight: 20 },
});
