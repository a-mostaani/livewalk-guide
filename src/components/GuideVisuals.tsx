import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, colors } from './Primitives';

export function BrandMark() {
  return (
    <View style={styles.brandRow}>
      <View style={styles.logo}>
        <Ionicons name="walk" size={21} color={colors.white} />
      </View>
      <View>
        <Text style={styles.brand}>LiveWalk</Text>
        <Text style={styles.brandSub}>Guide</Text>
      </View>
    </View>
  );
}

export function GuideRouteMap({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.map, compact && styles.mapCompact]}>
      <View style={[styles.mapBlock, styles.blockOne]} />
      <View style={[styles.mapBlock, styles.blockTwo]} />
      <View style={[styles.mapBlock, styles.blockThree]} />
      <View style={[styles.mapBlock, styles.blockFour]} />
      <View style={styles.routeLine} />
      <View style={[styles.pin, styles.pinStart]}>
        <Ionicons name="play" size={13} color={colors.white} />
      </View>
      <View style={[styles.pin, styles.pinStop]}>
        <Ionicons name="camera" size={13} color={colors.ink} />
      </View>
      <View style={[styles.pin, styles.pinEnd]}>
        <Ionicons name="flag" size={14} color={colors.white} />
      </View>
      <View style={styles.gpsDot} />
      <Text style={styles.mapLabel}>Mock GPS route • guide view</Text>
    </View>
  );
}

export function BroadcasterPlaceholder() {
  return (
    <View style={styles.video}>
      <View style={styles.videoGlow} />
      <View style={styles.videoBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.videoBadgeText}>BROADCASTING</Text>
      </View>
      <View style={styles.networkBadge}>
        <Ionicons name="cellular" size={14} color={colors.green} />
        <Text style={styles.networkText}>5G strong</Text>
      </View>
      <View style={styles.videoCenter}>
        <Ionicons name="videocam" size={40} color={colors.white} />
        <Text style={styles.videoTitle}>Your camera preview</Text>
        <Text style={styles.videoText}>Mock broadcaster surface for Expo Go. Live video SDK plugs in here.</Text>
      </View>
      <View style={styles.videoBottom}>
        <Text style={styles.videoMeta}>Traveler: Sofia • English captions</Text>
        <Text style={styles.videoMeta}>18:42 left</Text>
      </View>
    </View>
  );
}

export function ProgressRail({ progress = 48 }: { progress?: number }) {
  return (
    <Card style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <View>
          <Text style={styles.progressTitle}>Route progress</Text>
          <Text style={styles.progressSub}>Follow the planned public route</Text>
        </View>
        <Text style={styles.progressPct}>{progress}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${progress}%` }]} />
      </View>
      <View style={styles.routeStops}>
        <Text style={styles.stopText}>Station</Text>
        <Text style={styles.stopText}>Market</Text>
        <Text style={styles.stopText}>Shrine</Text>
      </View>
    </Card>
  );
}

export function SafetyNote({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.safety, compact && styles.safetyCompact]}>
      <Ionicons name="shield-checkmark" size={20} color={colors.green} />
      <Text style={styles.safetyText}>Stay in public spaces, keep situational awareness, and pause the stream if privacy or safety is unclear.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  logo: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  brand: { color: colors.ink, fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  brandSub: { color: colors.muted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },
  map: {
    height: 220,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.blueSoft,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(13,77,102,0.16)',
  },
  mapCompact: { height: 154, borderRadius: 22 },
  mapBlock: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 18 },
  blockOne: { left: 18, top: 22, width: 108, height: 68, transform: [{ rotate: '-8deg' }] },
  blockTwo: { right: 14, top: 42, width: 132, height: 82, transform: [{ rotate: '12deg' }] },
  blockThree: { left: 54, bottom: 24, width: 172, height: 62, transform: [{ rotate: '5deg' }] },
  blockFour: { right: 38, bottom: 18, width: 74, height: 54, transform: [{ rotate: '-12deg' }], opacity: 0.72 },
  routeLine: {
    position: 'absolute',
    left: 52,
    top: 75,
    width: 226,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.gold,
    transform: [{ rotate: '28deg' }],
  },
  pin: { position: 'absolute', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pinStart: { left: 40, top: 56, backgroundColor: colors.green },
  pinStop: { left: '52%', top: '45%', backgroundColor: colors.white, borderWidth: 2, borderColor: colors.gold },
  pinEnd: { right: 42, bottom: 50, backgroundColor: colors.ink },
  gpsDot: {
    position: 'absolute',
    left: '43%',
    top: '51%',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.white,
    borderWidth: 5,
    borderColor: colors.blue,
  },
  mapLabel: { position: 'absolute', left: 16, bottom: 14, color: colors.blue, fontWeight: '900' },
  video: { height: 342, borderRadius: 32, backgroundColor: '#07131D', overflow: 'hidden', position: 'relative' },
  videoGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 145, backgroundColor: '#173D52', opacity: 0.92 },
  videoBadge: { position: 'absolute', top: 18, left: 18, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF5A57' },
  videoBadgeText: { color: colors.white, fontWeight: '900', fontSize: 12 },
  networkBadge: { position: 'absolute', top: 18, right: 18, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 5 },
  networkText: { color: colors.ink, fontWeight: '900', fontSize: 12 },
  videoCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  videoTitle: { color: colors.white, fontSize: 24, fontWeight: '900', marginTop: 10 },
  videoText: { color: 'rgba(255,255,255,0.72)', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  videoBottom: { position: 'absolute', bottom: 18, left: 18, right: 18, flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  videoMeta: { color: colors.white, fontWeight: '800', fontSize: 12, flexShrink: 1 },
  progressCard: { marginTop: 14 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, gap: 10 },
  progressTitle: { color: colors.ink, fontWeight: '900', fontSize: 16 },
  progressSub: { color: colors.muted, fontWeight: '700', fontSize: 12, marginTop: 2 },
  progressPct: { color: colors.green, fontWeight: '900' },
  track: { height: 10, backgroundColor: colors.blueSoft, borderRadius: 999, overflow: 'hidden' },
  trackFill: { height: '100%', backgroundColor: colors.green, borderRadius: 999 },
  routeStops: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  stopText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  safety: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: '#EAF7F2', borderRadius: 20, padding: 14, marginTop: 14 },
  safetyCompact: { marginTop: 0 },
  safetyText: { color: colors.ink, fontWeight: '700', lineHeight: 20, flex: 1 },
});
