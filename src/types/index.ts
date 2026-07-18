export type Screen =
  | 'onboarding'
  | 'dashboard'
  | 'request'
  | 'route'
  | 'checklist'
  | 'live'
  | 'earnings'
  | 'schedule'
  | 'ratings';

export type TripRequest = {
  travelerName: string;
  travelerCountry: string;
  route: string;
  start: string;
  destination: string;
  distanceKm: number;
  estimatedDuration: string;
  language: string;
  interests: string[];
  specialtyMatch: string;
  targetGroupMatch: string;
  payout: number;
  scheduledTime: string;
};

export type Booking = {
  id: string;
  title: string;
  time: string;
  status: 'Upcoming' | 'Completed' | 'Pending';
  payout: string;
};

export type Review = {
  traveler: string;
  rating: number;
  text: string;
  route: string;
};


export type RequestPoint = {
  label: string;
  lat: number;
  lng: number;
};

export type Estimate = {
  currency: string;
  distanceKm: number;
  walkingMinutes: number;
  platformFee: number;
  guideFee: number;
  total: number;
};

export type MarketplaceGuide = {
  id: string;
  name: string;
  avatar?: string;
};

export type MarketplaceRequest = {
  id: string;
  travelerName: string;
  origin: RequestPoint;
  destination: RequestPoint;
  route: string;
  scheduledStart: string;
  durationMinutes: number;
  language: string;
  interests: string[];
  estimate: Estimate;
  status: 'pending' | 'accepted' | 'declined' | 'live' | 'completed' | 'cancelled';
  guide: MarketplaceGuide | null;
  sessionId: string | null;
  createdAt: string;
  updatedAt: string;
  requestCancellation?: unknown;
  cancellation?: unknown;
  requestCancellationReason?: unknown;
  cancellationReason?: unknown;
};

export type LiveSession = {
  id: string;
  requestId: string;
  status: 'ready' | 'live' | 'ended' | 'cancelled';
  startedAt?: string | null;
  endedAt?: string | null;
  location?: { label?: string; lat?: number; lng?: number; accuracy?: number | null; timestamp?: string; progress?: number } | null;
  requestCancellation?: unknown;
  cancellation?: unknown;
  requestCancellationReason?: unknown;
  cancellationReason?: unknown;
};

export type SessionMessage = {
  id: string;
  sessionId: string;
  senderRole: string;
  senderName: string;
  text: string;
  createdAt: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: 'traveler' | 'guide';
  city: string;
  createdAt: string;
};

export type AuthPayload = {
  name?: string;
  city?: string;
  email: string;
  password: string;
};
