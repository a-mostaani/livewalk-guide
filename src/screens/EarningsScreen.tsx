import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Header, Stat, colors } from '../components/Primitives';

export function EarningsScreen({ onSchedule }: { onSchedule: () => void }) {
  const [rating, setRating] = useState(5);
  const gross = 38;
  const commission = 6;
  const payout = gross - commission;

  return (
    <View>
      <Header kicker="Walk complete" title="Your payout is ready for review." body="This summary mirrors the guide-side completion moment: payout, commission, route stats, rating prompt, and next bookings." />
      <Card style={styles.receipt}>
        <View style={styles.medal}><Ionicons name="cash" size={30} color={colors.white} /></View>
        <Text style={styles.receiptTitle}>45 minute walk completed</Text>
        <View style={styles.stats}>
          <Stat label="Gross" value={`$${gross}`} tone="dark" />
          <Stat label="LiveWalk" value={`-$${commission}`} tone="dark" />
          <Stat label="Payout" value={`$${payout}`} tone="dark" />
        </View>
      </Card>
      <Card style={styles.breakdownCard}>
        <Text style={styles.sectionTitle}>Trip summary</Text>
        {[
          ['Route', 'Shibuya Station → Meiji Shrine'],
          ['Distance', '2.8 km'],
          ['Stops shown', '4'],
          ['Captions', 'English translation enabled'],
        ].map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
          </View>
        ))}
      </Card>
      <Card style={styles.ratingCard}>
        <Text style={styles.sectionTitle}>Traveler rating prompt</Text>
        <Text style={styles.ratingBody}>Mock the post-walk feedback moment and make it easy for a guide to understand what affects their profile.</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.8}>
              <Ionicons name={star <= rating ? 'star' : 'star-outline'} size={34} color={colors.gold} />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.feedback}>“Steady camera, safe pacing, and great local stories.”</Text>
      </Card>
      <Button label="View schedule" icon="calendar" onPress={onSchedule} style={{ marginTop: 18 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  receipt: { alignItems: 'center', backgroundColor: colors.ink },
  medal: { width: 64, height: 64, borderRadius: 24, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  receiptTitle: { color: colors.white, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  stats: { flexDirection: 'row', gap: 8, marginTop: 16 },
  breakdownCard: { marginTop: 14 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowLabel: { color: colors.muted, fontWeight: '800' },
  rowValue: { color: colors.ink, fontWeight: '900', flex: 1, textAlign: 'right' },
  ratingCard: { marginTop: 14, alignItems: 'center' },
  ratingBody: { color: colors.muted, textAlign: 'center', lineHeight: 20, fontWeight: '700', marginBottom: 12 },
  stars: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  feedback: { color: colors.ink, textAlign: 'center', lineHeight: 21, fontWeight: '800' },
});
