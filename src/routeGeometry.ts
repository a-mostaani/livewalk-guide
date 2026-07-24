export type RoutePoint = { lat: number; lng: number };

// Mapbox's Static Images API can draw a path overlay, but it does not compute
// routing itself - it only renders geometry you already have. Real
// street-following walking-route geometry comes from the separate Directions
// API, called once per (origin, destination) pair and cached by the caller
// (the route never changes once a request has coordinates).
export async function fetchRoutePolyline(
  origin: RoutePoint,
  destination: RoutePoint,
  mapboxToken: string,
  fetcher: typeof fetch = fetch,
): Promise<string | undefined> {
  if (!mapboxToken) return undefined;
  const coordinates = `${origin.lng.toFixed(5)},${origin.lat.toFixed(5)};${destination.lng.toFixed(5)},${destination.lat.toFixed(5)}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coordinates}?geometries=polyline&overview=simplified&access_token=${encodeURIComponent(mapboxToken)}`;
  try {
    const response = await fetcher(url);
    if (!response.ok) return undefined;
    const data = await response.json();
    const polyline = data?.routes?.[0]?.geometry;
    return typeof polyline === 'string' && polyline ? polyline : undefined;
  } catch {
    return undefined;
  }
}
