import { useEffect, useState } from 'react';
import { fetchRoutePolyline } from '../routeGeometry';

type LoosePoint = { lat?: number; lng?: number } | undefined;

function toRoutePoint(point: LoosePoint) {
  return typeof point?.lat === 'number' && Number.isFinite(point.lat) && typeof point?.lng === 'number' && Number.isFinite(point.lng)
    ? { lat: point.lat, lng: point.lng }
    : undefined;
}

// The route between origin and destination never changes once a request has
// coordinates, so this fetches once per (origin, destination) pair - keyed on
// a stable string, not the raw point objects, since a fresh object reference
// on every render would otherwise re-fetch on every render.
export function useRoutePolyline(originPoint: LoosePoint, destinationPoint: LoosePoint, mapboxToken: string) {
  const origin = toRoutePoint(originPoint);
  const destination = toRoutePoint(destinationPoint);
  const [polyline, setPolyline] = useState<string | undefined>();
  const key = origin && destination ? `${origin.lat},${origin.lng}|${destination.lat},${destination.lng}` : '';

  useEffect(() => {
    let active = true;
    setPolyline(undefined);
    if (!origin || !destination || !mapboxToken) return;
    void fetchRoutePolyline(origin, destination, mapboxToken).then((result) => {
      if (active) setPolyline(result);
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, mapboxToken]);

  return polyline;
}
