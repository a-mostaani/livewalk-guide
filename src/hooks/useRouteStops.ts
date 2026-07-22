import { useEffect, useState } from 'react';
import { decodePolyline, fetchRouteAttractions, type RouteAttraction } from '../routeStops';

export type RouteStopsStatus = 'idle' | 'loading' | 'ready' | 'error';

// Fetches once per route polyline (the route itself is stable once a request
// has coordinates - same rationale as useRoutePolyline not re-fetching on
// every guide-location poll).
export function useRouteStops(routePolyline: string | undefined) {
  const [stops, setStops] = useState<RouteAttraction[]>([]);
  const [status, setStatus] = useState<RouteStopsStatus>('idle');

  useEffect(() => {
    let active = true;
    setStops([]);
    if (!routePolyline) {
      setStatus('idle');
      return;
    }
    setStatus('loading');
    const points = decodePolyline(routePolyline);
    fetchRouteAttractions(points).then((result) => {
      if (!active) return;
      setStops(result);
      setStatus('ready');
    }).catch(() => {
      if (active) setStatus('error');
    });
    return () => { active = false; };
  }, [routePolyline]);

  return { stops, status };
}
