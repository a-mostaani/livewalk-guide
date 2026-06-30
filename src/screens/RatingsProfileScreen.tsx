import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Header, Pill, Stat, colors } from '../components/Primitives';
import { badges, guideProfile, reviews, specialtyTagOptions, targetGroupTagOptions } from '../data/mock';

export function RatingsProfileScreen({ onRestart }: { onRestart: () => void }) {
  const [selectedSpecialties, setSelectedSpecialties] = useState(guideProfile.specialties);
  const [selectedTargetGroups, setSelectedTargetGroups] = useState(guideProfile.targetGroups);

  const toggleSpecialty = (tag: string) => {
    setSelectedSpecialties((current) => current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]);
  };

  const toggleTargetGroup = (tag: string) => {
    setSelectedTargetGroups((current) => current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]);
  };

  return (
    <View>
      <Header kicker="Guide profile" title="Ratings, tags, and recent reviews." body="This screen previews how a guide understands reputation and edits the specialty and target-group tags that influence matching." />
      <Card style={styles.profileHero}>
        <View style={styles.avatar}><Text style={styles.avatarText}>YT</Text></View>
        <Text style={styles.name}>{guideProfile.name}</Text>
        <Text style={styles.meta}>{guideProfile.area} • {guideProfile.language}</Text>
        <View style={styles.heroStats}>
          <Stat label="Rating" value={`${guideProfile.rating}`} tone="dark" />
          <Stat label="Walks" value={`${guideProfile.walks}`} tone="dark" />
          <Stat label="Badges" value={`${badges.length}`} tone="dark" />
        </View>
      </Card>
      <Card style={styles.tagCard}>
        <View style={styles.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Guide matching tags</Text>
            <Text style={styles.sectionSubtitle}>Mock settings UI: tap tags to preview what a guide would select.</Text>
          </View>
          <Ionicons name="options" size={24} color={colors.blue} />
        </View>
        <Text style={styles.tagLabel}>Specialty tags</Text>
        <View style={styles.pills}>
          {specialtyTagOptions.map((tag) => (
            <Pill key={tag} label={tag} selected={selectedSpecialties.includes(tag)} onPress={() => toggleSpecialty(tag)} />
          ))}
        </View>
        <Text style={styles.tagLabel}>Target group tags</Text>
        <View style={styles.pills}>
          {targetGroupTagOptions.map((tag) => (
            <Pill key={tag} label={tag} selected={selectedTargetGroups.includes(tag)} onPress={() => toggleTargetGroup(tag)} />
          ))}
        </View>
        <View style={styles.matchPreview}>
          <Ionicons name="flash" size={18} color={colors.gold} />
          <Text style={styles.matchPreviewText}>Match preview: {selectedSpecialties[0] ?? 'Select specialty'} + {selectedTargetGroups[0] ?? 'Select target group'}</Text>
        </View>
      </Card>
      <Card style={styles.badgeCard}>
        <Text style={styles.sectionTitle}>Badges</Text>
        <View style={styles.pills}>
          {badges.map((badge) => <Pill key={badge} label={badge} selected />)}
        </View>
      </Card>
      <View style={styles.reviewList}>
        {reviews.map((review) => (
          <Card key={`${review.traveler}-${review.route}`} style={styles.reviewCard}>
            <View style={styles.reviewTop}>
              <View>
                <Text style={styles.reviewer}>{review.traveler}</Text>
                <Text style={styles.route}>{review.route}</Text>
              </View>
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={14} color={colors.gold} />
                <Text style={styles.ratingText}>{review.rating}</Text>
              </View>
            </View>
            <Text style={styles.reviewText}>“{review.text}”</Text>
          </Card>
        ))}
      </View>
      <Button label="Restart MVP flow" icon="refresh" onPress={onRestart} style={{ marginTop: 18 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  profileHero: { backgroundColor: colors.ink, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 28, backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: colors.ink, fontSize: 22, fontWeight: '900' },
  name: { color: colors.white, fontWeight: '900', fontSize: 24 },
  meta: { color: 'rgba(255,255,255,0.72)', fontWeight: '700', marginTop: 4, textAlign: 'center' },
  heroStats: { flexDirection: 'row', gap: 8, marginTop: 16 },
  tagCard: { marginTop: 14 },
  badgeCard: { marginTop: 14 },
  sectionHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', marginBottom: 12 },
  sectionSubtitle: { color: colors.muted, fontWeight: '700', lineHeight: 19 },
  tagLabel: { color: colors.muted, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 11, marginBottom: 8, marginTop: 8 },
  pills: { flexDirection: 'row', flexWrap: 'wrap' },
  matchPreview: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#FFF8EA', borderRadius: 16, padding: 12, marginTop: 8 },
  matchPreviewText: { color: colors.ink, fontWeight: '800', flex: 1, lineHeight: 20 },
  reviewList: { gap: 12, marginTop: 14 },
  reviewCard: { padding: 16 },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  reviewer: { color: colors.ink, fontWeight: '900', fontSize: 16 },
  route: { color: colors.muted, fontWeight: '700', marginTop: 2 },
  ratingPill: { flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: colors.cream, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, alignSelf: 'flex-start' },
  ratingText: { color: colors.ink, fontWeight: '900' },
  reviewText: { color: colors.ink, lineHeight: 21, fontWeight: '700' },
});
