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


export type MarketplaceGuide = {
  id: string;
  name: string;
  avatar?: string;
};

export type MarketplaceRequest = {
  id: string;
  travelerName: string;
  origin: string;
  destination: string;
  route: string;
  scheduledTime: string;
  duration: string;
  language: string;
  interests: string[];
  status: 'pending' | 'accepted' | 'declined' | 'live';
  guide: MarketplaceGuide | null;
  sessionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LiveSession = {
  id: string;
  requestId: string;
  status: 'ready' | 'live';
  startedAt?: string | null;
  location?: { label?: string; progress?: number } | null;
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
  createdAt: string;
};

export type AuthPayload = {
  name?: string;
  email: string;
  password: string;
};
