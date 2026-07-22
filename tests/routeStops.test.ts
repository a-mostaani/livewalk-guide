import { describe, expect, it, vi } from 'vitest';
import { decodePolyline, fetchRouteAttractions } from '../src/routeStops';

describe('decodePolyline', () => {
  it('decodes the canonical Google encoded-polyline example', () => {
    const decoded = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    expect(decoded).toEqual([
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ]);
  });

  it('returns an empty array for an empty string', () => {
    expect(decodePolyline('')).toEqual([]);
  });
});

function overpassResponse(elements: unknown) {
  return { ok: true, json: async () => ({ elements }) } as Response;
}

// A short, roughly-straight route for corridor-distance tests.
const route = [
  { lat: 51.5074, lng: -0.1278 },
  { lat: 51.5090, lng: -0.1260 },
  { lat: 51.5117, lng: -0.1240 },
];

describe('fetchRouteAttractions', () => {
  it('returns an empty array without calling the network for a degenerate route', async () => {
    const fetcher = vi.fn();
    const result = await fetchRouteAttractions([{ lat: 0, lng: 0 }], fetcher);
    expect(result).toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('posts an Overpass QL query scoped to tourism/historic tags within the route bounding box', async () => {
    const fetcher = vi.fn().mockResolvedValue(overpassResponse([]));
    await fetchRouteAttractions(route, fetcher);

    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe('https://overpass-api.de/api/interpreter');
    expect(init.method).toBe('POST');
    const body = decodeURIComponent(String(init.body).replace(/^data=/, ''));
    expect(body).toContain('tourism');
    expect(body).toContain('historic');
  });

  it('keeps a named point close to the route and orders results by distance from the start', async () => {
    const nearStart = { lat: 51.5075, lng: -0.1277, tags: { name: 'Near Start Museum', tourism: 'museum' } };
    const nearEnd = { lat: 51.5115, lng: -0.1242, tags: { name: 'Near End Gallery', tourism: 'gallery' } };
    const fetcher = vi.fn().mockResolvedValue(overpassResponse([
      { lat: nearEnd.lat, lon: nearEnd.lng, tags: nearEnd.tags },
      { lat: nearStart.lat, lon: nearStart.lng, tags: nearStart.tags },
    ]));

    const result = await fetchRouteAttractions(route, fetcher);
    expect(result.map((item) => item.title)).toEqual(['Near Start Museum', 'Near End Gallery']);
    expect(result[0].note).toBe('Museum along the route');
  });

  it('discards points far from the route line even if inside its bounding box', async () => {
    const farCorner = { lat: 51.5074, lng: -0.1240, tags: { name: 'Off-route Landmark', historic: 'monument' } };
    const fetcher = vi.fn().mockResolvedValue(overpassResponse([{ lat: farCorner.lat, lon: farCorner.lng, tags: farCorner.tags }]));

    const result = await fetchRouteAttractions(route, fetcher, 50);
    expect(result).toEqual([]);
  });

  it('drops unnamed elements and de-duplicates repeated names', async () => {
    const fetcher = vi.fn().mockResolvedValue(overpassResponse([
      { lat: route[0].lat, lon: route[0].lng, tags: { tourism: 'attraction' } },
      { lat: route[0].lat, lon: route[0].lng, tags: { name: 'Repeated Spot', tourism: 'attraction' } },
      { lat: route[0].lat, lon: route[0].lng, tags: { name: 'Repeated Spot', tourism: 'attraction' } },
    ]));

    const result = await fetchRouteAttractions(route, fetcher);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Repeated Spot');
  });

  it('caps results at maxResults', async () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ lat: route[0].lat, lon: route[0].lng, tags: { name: `Spot ${i}`, tourism: 'attraction' } }));
    const fetcher = vi.fn().mockResolvedValue(overpassResponse(many));

    const result = await fetchRouteAttractions(route, fetcher, 120, 3);
    expect(result).toHaveLength(3);
  });

  it('returns an empty array on a non-ok response or network failure instead of throwing', async () => {
    await expect(fetchRouteAttractions(route, vi.fn().mockResolvedValue(overpassResponse([])).mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response))).resolves.toEqual([]);
    await expect(fetchRouteAttractions(route, vi.fn().mockRejectedValue(new Error('offline')))).resolves.toEqual([]);
  });
});
