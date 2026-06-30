import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Header, Stat, colors } from '../components/Primitives';
import { incomingRequest } from '../data/mock';

const checklistItems = [
  'I am at the public starting point',
  'Battery is above 40% or charger is ready',
  'Network looks stable for video',
  'Camera lens is clean and phone grip is secure',
  'Traveler language and interests reviewed',
];

export function ChecklistScreen({ onStartStream }: { onStartStream: () => void }) {
  const [checked, setChecked] = useState<string[]>([checklistItems[0], checklistItems[2]]);
  const toggle = (item: string) => setChecked((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
  const readyCount = checked.length;

  return (
    <View>
      <Header kicker="Confirmed trip" title="Run the pre-walk checklist." body="Before a live traveler joins, guides need a fast readiness screen for location, battery, network, and route context." />
      <Card style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.icon}><Ionicons name="calendar" size={26} color={colors.white} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{incomingRequest.route}</Text>
            <Text style={styles.heroSub}>{incomingRequest.scheduledTime} • {incomingRequest.language}</Text>
          </View>
        </View>
        <View style={styles.stats}>
          <Stat label="Payout" value={`$${incomingRequest.payout}`} tone="dark" />
          <Stat label="Ready" value={`${readyCount}/5`} tone="dark" />
          <Stat label="Duration" value={incomingRequest.estimatedDuration} tone="dark" />
        </View>
      </Card>
      <Card style={styles.checkCard}>
        {checklistItems.map((item) => {
          const active = checked.includes(item);
          return (
            <TouchableOpacity key={item} activeOpacity={0.82} onPress={() => toggle(item)} style={styles.checkRow}>
              <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={active ? colors.green : colors.muted} />
              <Text style={[styles.checkText, active && styles.checkTextActive]}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </Card>
      <Card style={styles.reminderCard}>
        <Text style={styles.reminderTitle}>Broadcast reminders</Text>
        <Text style={styles.reminderText}>Keep the traveler informed, narrate turns before making them, avoid filming private homes closely, and use pause if someone asks not to be filmed.</Text>
      </Card>
      <Button label="Start mock stream" icon="videocam" onPress={onStartStream} style={{ marginTop: 18 }} />
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
  checkRow: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 10 },
  checkText: { color: colors.muted, fontWeight: '800', flex: 1, lineHeight: 20 },
  checkTextActive: { color: colors.ink },
  reminderCard: { marginTop: 14, backgroundColor: '#FFF8EA' },
  reminderTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', marginBottom: 6 },
  reminderText: { color: colors.muted, fontWeight: '700', lineHeight: 20 },
});
