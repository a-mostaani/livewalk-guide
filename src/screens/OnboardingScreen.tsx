import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandMark } from '../components/GuideVisuals';
import { Button, Card, Header, Stat, colors } from '../components/Primitives';

export function OnboardingScreen({ onStart }: { onStart: () => void }) {
  return (
    <View>
      <BrandMark />
      <Header
        kicker="Earn by walking live"
        title="Turn local knowledge into guided video walks."
        body="Go online, accept traveler requests nearby, stream the route safely, and earn for real-time local presence, captions, translation, and route context."
      />
      <View style={styles.stats}>
        <Stat label="Mock payout" value="$32" />
        <Stat label="Route" value="2.8 km" />
        <Stat label="Session" value="45 min" />
      </View>
      <View style={styles.cards}>
        {[
          ['cash', 'Earn per walk', 'See the route, duration, language, interests, and estimated payout before accepting.'],
          ['videocam', 'Broadcast ready', 'Camera preview, route progress, captions, messages, and session controls live in one place.'],
          ['shield-checkmark', 'Safety first', 'Public-space reminders and pause/end controls are designed into the guide flow.'],
        ].map(([icon, title, body]) => (
          <Card key={title} style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{title}</Text>
              <Text style={styles.featureBody}>{body}</Text>
            </View>
          </Card>
        ))}
      </View>
      <Button label="Open guide dashboard" icon="arrow-forward" onPress={onStart} />
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8, marginTop: 14 },
  cards: { gap: 10, marginVertical: 18 },
  feature: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderRadius: 22 },
  featureIcon: { width: 42, height: 42, borderRadius: 16, backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { color: colors.ink, fontWeight: '900', fontSize: 15 },
  featureBody: { color: colors.muted, marginTop: 3, lineHeight: 18 },
});
