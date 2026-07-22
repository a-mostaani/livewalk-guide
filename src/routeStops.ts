export type RoutePoint = { lat: number; lng: number };

export type RouteAttraction = {
  title: string;
  note: string;
  lat: number;
  lng: number;
};

// Standard Google/Mapbox encoded-polyline algorithm (precision 5, matching
// the `geometries=polyline` format requested from the Directions API).
export function decodePolyline(encoded: string, precision = 5): RoutePoint[] {
  const factor = 10 ** precision;
  const coordinates: RoutePoint[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push({ lat: lat / factor, lng: lng / factor });
  }
  return coordinates;
}

// Flat-plane approximation, accurate enough for short walking distances -
// same style already used elsewhere in this project (traveler's
// LiveWalkScreen progress/distance calculations) rather than full haversine.
const METERS_PER_DEGREE_LAT = 111320;
function metersPerDegreeLng(lat: number) {
  return METERS_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180);
}

function toLocalMeters(point: RoutePoint, origin: RoutePoint) {
  return {
    x: (point.lng - origin.lng) * metersPerDegreeLng(origin.lat),
    y: (point.lat - origin.lat) * METERS_PER_DEGREE_LAT,
  };
}

function distanceMeters(a: RoutePoint, b: RoutePoint) {
  const local = toLocalMeters(b, a);
  return Math.sqrt(local.x ** 2 + local.y ** 2);
}

function distanceToSegmentMeters(point: RoutePoint, segStart: RoutePoint, segEnd: RoutePoint) {
  const p = toLocalMeters(point, segStart);
  const b = toLocalMeters(segEnd, segStart);
  const lengthSquared = b.x ** 2 + b.y ** 2;
  const t = lengthSquared < 1 ? 0 : Math.max(0, Math.min(1, (p.x * b.x + p.y * b.y) / lengthSquared));
  const projection = { x: b.x * t, y: b.y * t };
  return Math.sqrt((p.x - projection.x) ** 2 + (p.y - projection.y) ** 2);
}

function minDistanceToRoute(point: RoutePoint, route: RoutePoint[]) {
  let min = Infinity;
  for (let i = 0; i < route.length - 1; i++) {
    min = Math.min(min, distanceToSegmentMeters(point, route[i], route[i + 1]));
  }
  return min;
}

function boundingBox(route: RoutePoint[], paddingMeters: number) {
  const lats = route.map((p) => p.lat);
  const lngs = route.map((p) => p.lng);
  const south = Math.min(...lats);
  const north = Math.max(...lats);
  const west = Math.min(...lngs);
  const east = Math.max(...lngs);
  const latPad = paddingMeters / METERS_PER_DEGREE_LAT;
  const lngPad = paddingMeters / metersPerDegreeLng((south + north) / 2);
  return { south: south - latPad, north: north + latPad, west: west - lngPad, east: east + lngPad };
}

function buildOverpassQuery(bbox: { south: number; west: number; north: number; east: number }) {
  const box = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  return `[out:json][timeout:25];(node["tourism"~"attraction|museum|artwork|viewpoint|gallery"](${box});node["historic"](${box}););out body 30;`;
}

function describeAttraction(tags: Record<string, string>) {
  const category = (tags.tourism || tags.historic || 'point of interest').replace(/_/g, ' ');
  const label = category.charAt(0).toUpperCase() + category.slice(1);
  return tags.description ? `${label} · ${tags.description}` : `${label} along the route`;
}

// Finds real, named tourism/historic points from OpenStreetMap (via the free,
// keyless Overpass API) within `corridorMeters` of the actual route line -
// not just its bounding box, so a long straight route doesn't pull in
// irrelevant points from the box's far corners. Ordered by distance from the
// route's start as an approximation of "order encountered along the walk"
// (exact arc-length-along-route ordering would need per-point projection
// bookkeeping this doesn't attempt).
export async function fetchRouteAttractions(
  route: RoutePoint[],
  fetcher: typeof fetch = fetch,
  corridorMeters = 120,
  maxResults = 6,
): Promise<RouteAttraction[]> {
  if (route.length < 2) return [];
  const query = buildOverpassQuery(boundingBox(route, 200));

  let elements: Array<{ lat?: number; lon?: number; tags?: Record<string, string> }>;
  try {
    const response = await fetcher('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!response.ok) return [];
    const data = await response.json();
    elements = Array.isArray(data?.elements) ? data.elements : [];
  } catch {
    return [];
  }

  const origin = route[0];
  const seenNames = new Set<string>();
  return elements
    .filter((el): el is { lat: number; lon: number; tags: Record<string, string> } =>
      typeof el.lat === 'number' && typeof el.lon === 'number' && Boolean(el.tags?.name?.trim()))
    .map((el) => ({ point: { lat: el.lat, lng: el.lon }, tags: el.tags }))
    .filter((item) => minDistanceToRoute(item.point, route) <= corridorMeters)
    .sort((a, b) => distanceMeters(origin, a.point) - distanceMeters(origin, b.point))
    .filter((item) => {
      const key = item.tags.name.trim().toLowerCase();
      if (seenNames.has(key)) return false;
      seenNames.add(key);
      return true;
    })
    .slice(0, maxResults)
    .map((item) => ({ title: item.tags.name.trim(), note: describeAttraction(item.tags), lat: item.point.lat, lng: item.point.lng }));
}
