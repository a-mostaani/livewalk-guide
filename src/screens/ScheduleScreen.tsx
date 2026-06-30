import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Header, colors } from '../components/Primitives';
import { bookings } from '../data/mock';

export function ScheduleScreen({ onRatings }: { onRatings: () => void }) {
  return (
    <View>
      <Header kicker="Bookings" title="Keep upcoming and completed walks in one list." body="Scheduling is mocked, but this screen frames the guide’s day: upcoming, pending, completed, route title, time, and payout." />
      <View style={styles.list}>
        {bookings.map((booking) => {
          const completed = booking.status === 'Completed';
          const pending = booking.status === 'Pending';
          return (
            <Card key={booking.id} style={styles.bookingCard}>
              <View style={[styles.statusIcon, completed && styles.statusComplete, pending && styles.statusPending]}>
                <Ionicons name={completed ? 'checkmark' : pending ? 'time' : 'calendar'} size={20} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTop}>
                  <Text style={styles.bookingTitle}>{booking.title}</Text>
                  <Text style={styles.payout}>{booking.payout}</Text>
                </View>
                <Text style={styles.bookingMeta}>{booking.time}</Text>
                <Text style={[styles.statusText, completed && styles.statusTextComplete, pending && styles.statusTextPending]}>{booking.status}</Text>
              </View>
            </Card>
          );
        })}
      </View>
      <Card style={styles.noteCard}>
        <Text style={styles.noteTitle}>Next scheduling integrations</Text>
        <Text style={styles.noteText}>Availability windows, request expiry, timezone handling, reminders, cancellation rules, and calendar sync plug in after backend booking state exists.</Text>
      </Card>
      <Button label="Open ratings profile" icon="star" onPress={onRatings} style={{ marginTop: 18 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  bookingCard: { flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16 },
  statusIcon: { width: 46, height: 46, borderRadius: 18, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  statusComplete: { backgroundColor: colors.green },
  statusPending: { backgroundColor: colors.gold },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  bookingTitle: { color: colors.ink, fontWeight: '900', fontSize: 16, flex: 1 },
  payout: { color: colors.green, fontWeight: '900' },
  bookingMeta: { color: colors.muted, fontWeight: '700', marginTop: 3 },
  statusText: { color: colors.blue, fontWeight: '900', marginTop: 7 },
  statusTextComplete: { color: colors.green },
  statusTextPending: { color: colors.gold },
  noteCard: { marginTop: 14, backgroundColor: '#FFF8EA' },
  noteTitle: { color: colors.ink, fontWeight: '900', fontSize: 17, marginBottom: 6 },
  noteText: { color: colors.muted, fontWeight: '700', lineHeight: 20 },
});
