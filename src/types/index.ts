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
