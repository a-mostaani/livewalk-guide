import { describe, expect, it, vi } from 'vitest';
import { fetchRoutePolyline } from '../src/routeGeometry';

const origin = { lat: 51.507432, lng: -0.127812 };
const destination = { lat: 51.511743, lng: -0.123976 };

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

describe('fetchRoutePolyline', () => {
  it('returns undefined without calling the network when no token is configured', async () => {
    const fetcher = vi.fn();
    const result = await fetchRoutePolyline(origin, destination, '', fetcher);
    expect(result).toBeUndefined();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('requests the Mapbox Directions walking profile with both coordinates and a simplified polyline geometry', async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ routes: [{ geometry: 'abc123' }] }));
    const result = await fetchRoutePolyline(origin, destination, 'pk.test', fetcher);

    expect(result).toBe('abc123');
    const [url] = fetcher.mock.calls[0];
    expect(url).toContain('https://api.mapbox.com/directions/v5/mapbox/walking/');
    expect(url).toContain(`${origin.lng.toFixed(5)},${origin.lat.toFixed(5)};${destination.lng.toFixed(5)},${destination.lat.toFixed(5)}`);
    expect(url).toContain('geometries=polyline');
    expect(url).toContain('overview=simplified');
    expect(url).toContain('access_token=pk.test');
  });

  it('returns undefined on a non-ok response instead of throwing', async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({}, false));
    const result = await fetchRoutePolyline(origin, destination, 'pk.test', fetcher);
    expect(result).toBeUndefined();
  });

  it('returns undefined when the response has no route geometry', async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ routes: [] }));
    const result = await fetchRoutePolyline(origin, destination, 'pk.test', fetcher);
    expect(result).toBeUndefined();
  });

  it('returns undefined instead of throwing when the network call rejects', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('offline'));
    const result = await fetchRoutePolyline(origin, destination, 'pk.test', fetcher);
    expect(result).toBeUndefined();
  });
});
