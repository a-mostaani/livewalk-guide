import type { Estimate } from './types';

export function formatScheduledStart(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatDuration(minutes?: number) {
  return Number.isFinite(minutes) && minutes ? `${minutes} min` : '—';
}

export function formatEstimateTotal(estimate?: Estimate) {
  return estimate ? `$${estimate.total}` : 'Pending';
}
