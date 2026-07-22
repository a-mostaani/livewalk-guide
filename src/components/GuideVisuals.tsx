import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, colors } from './Primitives';

function numeric(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function coordinate(point?: { lat?: number; lng?: number } | null) {
  return numeric(point?.lat) && numeric(point?.lng) ? { lat: point.lat, lng: point.lng } : undefined;
}

function pin(size: 's' | 'l', label: string, color: string, lng: number, lat: number) {
  return `pin-${size}-${label}+${color}(${lng.toFixed(5)},${lat.toFixed(5)})`;
}

// Static Images can draw a path overlay, but it does not compute routing
// itself - the actual walking-route geometry comes from the separate
// Directions API (see routeGeometry.ts/useRoutePolyline), fetched once and
// passed in here as an encoded polyline.
function path(polyline: string, color: string) {
  return `path-4+${color}-0.85(${encodeURIComponent(polyline)})`;
}

function buildRouteMapImageUrl({
  origin,
  destination,
  routePolyline,
  mapboxToken,
}: {
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  routePolyline?: string;
  mapboxToken: string;
}) {
  if (!mapboxToken || !origin || !destination) return undefined;
  const overlays = [
    routePolyline ? path(routePolyline, colors.gold.slice(1)) : undefined,
    pin('s', 'a', colors.green.slice(1), origin.lng, origin.lat),
    pin('s', 'b', colors.ink.slice(1), destination.lng, destination.lat),
  ].filter(Boolean).join(',');
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlays}/auto/600x360@2x?access_token=${encodeURIComponent(mapboxToken)}`;
}

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

export function GuideRouteMap({
  origin,
  destination,
  mapboxToken,
  routePolyline,
  compact = false,
}: {
  origin?: { label: string; lat?: number; lng?: number };
  destination?: { label: string; lat?: number; lng?: number };
  mapboxToken: string;
  routePolyline?: string;
  compact?: boolean;
}) {
  const originCoord = coordinate(origin);
  const destinationCoord = coordinate(destination);
  const imageUrl = buildRouteMapImageUrl({ origin: originCoord, destination: destinationCoord, routePolyline, mapboxToken });

  if (!originCoord || !destinationCoord) {
    return (
      <View style={[styles.map, compact && styles.mapCompact, styles.mapWaiting]}>
        <Ionicons name="map-outline" size={28} color={colors.blue} />
        <Text style={styles.mapWaitingTitle}>No route yet</Text>
        <Text style={styles.mapWaitingText}>The planned route appears once the accepted request has coordinates.</Text>
      </View>
    );
  }

  if (!imageUrl) {
    return (
      <View style={[styles.map, compact && styles.mapCompact, styles.mapWaiting]}>
        <Ionicons name="map-outline" size={28} color={colors.blue} />
        <Text style={styles.mapWaitingTitle}>Map token missing</Text>
        <Text style={styles.mapWaitingText}>The Mapbox public token is not configured for this build.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.map, compact && styles.mapCompact]}>
      <Image source={{ uri: imageUrl }} style={styles.mapImage} resizeMode="cover" />
      <Text style={styles.mapLabel}>{routePolyline ? 'Planned walking route' : 'Route preview'}</Text>
    </View>
  );
}

export function BroadcasterPlaceholder({ guideName = 'Guide', travelerName = 'Traveler' }: { guideName?: string; travelerName?: string }) {
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
        <Text style={styles.videoEyebrow}>Guide camera</Text>
        <Text style={styles.videoTitle}>{guideName}</Text>
        <Text style={styles.videoText}>Mock broadcaster surface for Expo Go. Live video SDK plugs in here.</Text>
      </View>
      <View style={styles.videoBottom}>
        <Text style={styles.videoMeta}>Traveler: {travelerName} • English captions</Text>
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
  mapImage: { width: '100%', height: '100%' },
  mapWaiting: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  mapWaitingTitle: { color: colors.ink, fontSize: 16, fontWeight: '900', marginTop: 8 },
  mapWaitingText: { color: colors.muted, textAlign: 'center', lineHeight: 19, fontWeight: '700', marginTop: 4 },
  mapLabel: { position: 'absolute', left: 16, bottom: 14, color: colors.blue, fontWeight: '900', backgroundColor: 'rgba(255,255,255,0.86)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, overflow: 'hidden' },
  video: { height: 342, borderRadius: 32, backgroundColor: '#07131D', overflow: 'hidden', position: 'relative' },
  videoGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 145, backgroundColor: '#173D52', opacity: 0.92 },
  videoBadge: { position: 'absolute', top: 18, left: 18, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF5A57' },
  videoBadgeText: { color: colors.white, fontWeight: '900', fontSize: 12 },
  networkBadge: { position: 'absolute', top: 18, right: 18, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 5 },
  networkText: { color: colors.ink, fontWeight: '900', fontSize: 12 },
  videoCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  videoEyebrow: { color: colors.gold, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: 10, fontSize: 11 },
  videoTitle: { color: colors.white, fontSize: 24, fontWeight: '900', marginTop: 4 },
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
