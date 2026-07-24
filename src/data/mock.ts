import { Booking, Review, TripRequest } from '../types';

export const guideProfile = {
  name: 'Yuki Tanaka',
  city: 'Tokyo',
  area: 'Shibuya / Harajuku',
  language: 'English + Japanese',
  specialties: ['Architecture', 'History', 'Food', 'Local culture', 'Accessibility'],
  targetGroups: ['First-time visitors', 'Families', 'Solo travelers', 'Property buyers'],
  rating: 4.96,
  walks: 184,
  responseTime: '42 sec',
  todayEarnings: '$86',
};

export const specialtyTagOptions = ['Architecture', 'History', 'Shopping', 'Food', 'Real estate', 'Local culture', 'Nightlife', 'Accessibility'];

export const targetGroupTagOptions = ['First-time visitors', 'Families', 'Solo travelers', 'Property buyers', 'Business travelers', 'Students', 'Seniors'];

export const incomingRequest: TripRequest = {
  travelerName: 'Sofia R.',
  travelerCountry: 'Spain',
  route: 'Shibuya Station → Meiji Shrine forest entrance',
  start: 'Hachikō Square, Shibuya Station',
  destination: 'Meiji Shrine forest entrance',
  distanceKm: 2.8,
  estimatedDuration: '45 min',
  language: 'English',
  interests: ['Hidden corners', 'Food stops', 'Local stories'],
  specialtyMatch: 'Architecture',
  targetGroupMatch: 'First-time visitors',
  payout: 32,
  scheduledTime: 'Today, 16:30',
};

export const captions = [
  'Guide: I am crossing into the quieter side street now. I will keep the phone steady.',
  'Translated: This small shrine is where commuters often stop before work.',
  'Traveler: Could you pause at the food stalls and show the menus?',
];

export const messages = [
  { from: 'Sofia', text: 'Can we slow down near the ramen signs?' },
  { from: 'You', text: 'Yes, stopping after the crossing.' },
  { from: 'Sofia', text: 'Translation captions look good.' },
];

export const bookings: Booking[] = [
  { id: '1', title: 'Shibuya food corners', time: 'Today, 16:30', status: 'Upcoming', payout: '$32' },
  { id: '2', title: 'Asakusa morning temples', time: 'Tomorrow, 09:00', status: 'Pending', payout: '$48' },
  { id: '3', title: 'Harajuku side streets', time: 'Yesterday, 18:00', status: 'Completed', payout: '$29' },
  { id: '4', title: 'Ueno park cherry walk', time: 'Mon, 11:00', status: 'Upcoming', payout: '$36' },
];

export const reviews: Review[] = [
  { traveler: 'Maya L.', rating: 5, route: 'Asakusa temples', text: 'Great pacing, clear street context, and very steady video.' },
  { traveler: 'Diego P.', rating: 5, route: 'Harajuku lanes', text: 'Felt like being there. Translation and food explanations were excellent.' },
  { traveler: 'Amelia K.', rating: 4, route: 'Ueno park', text: 'Friendly and careful. A little wind noise near the pond, otherwise excellent.' },
];

export const badges = ['Steady camera', 'Fast responder', 'Local stories', 'Safe route'];
