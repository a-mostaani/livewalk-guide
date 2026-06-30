# LiveWalk Guide MVP

Android-ready clickable MVP for the guide side of LiveWalk, a marketplace where remote travelers book local guides to physically walk a route while streaming live video.

## What is included
- Polished React Native / Expo guide prototype matching the clean premium travel + utility direction of the traveler MVP.
- Android-friendly navigation: tap the top step labels or use the persistent Previous/Next bar at the bottom to move through all nine screens.
- Vertically scrollable screens with safe-area padding so controls stay reachable on smaller Android phones.
- Complete guide-side click-through flow:
  1. Start / guide onboarding
  2. Availability dashboard
  3. Incoming traveler request
  4. Route details
  5. Confirmed trip / pre-walk checklist
  6. Live broadcast session
  7. Earnings / summary
  8. Schedule / bookings
  9. Ratings profile
- Mocked guide availability, mocked request dispatch, mocked route/GPS, mocked broadcaster video, mocked traveler messages, mocked captions/translation, mocked payouts, mocked ratings.
- Mocked guide specialty and target-group tags, including visible dashboard/profile tags, an incoming-request match banner, and tap-to-select profile settings UI.
- Concise app flow in [`FLOW.md`](./FLOW.md).

## Run on Android

### Option A: Physical Android device with Expo Go
1. Install Node.js 20+.
2. Install Expo Go on the Android phone from Google Play.
3. From this project directory, install dependencies:

```bash
npm install
```

4. Start Expo:

```bash
npm start
```

5. Scan the QR code with Expo Go.
6. Move through the MVP by tapping the Start/Dash/Request/Route/Ready/Live/Earn/Books/Rating step labels or the bottom Previous/Next buttons. The main screen area scrolls vertically on smaller Android displays.

### Option B: Android emulator
1. Install Android Studio and create an Android virtual device.
2. Start the emulator.
3. From this project directory:

```bash
npm install
npm run android
```

Expo will open the app on the running emulator.

## Useful development commands

```bash
npm start          # Start Expo dev server
npm run android    # Start on Android device/emulator
npm run web        # Optional browser preview for fast UI checks
npm run typecheck  # TypeScript verification
npm run export:web # Static web export check
```

## What is mocked
- Guide authentication and verification
- Specialty tags and target-group tags, including profile selection UI and request match context, mocked locally without persistence or production matching weights
- Availability discovery and marketplace dispatch
- Incoming request notification and accept/decline workflow
- Route APIs, live maps, GPS tracking, and turn prompts
- Live video broadcaster SDK
- In-session chat and traveler controls
- Captions, speech recognition, and translation
- Payments, commissions, payouts, receipts, disputes, and taxes
- Ratings, reviews, badges, and trust/safety moderation
- Scheduling, calendar sync, reminders, cancellation rules, and time zones

## Next backend integrations needed
1. **Guide accounts and verification**: identity/KYC, profile, guide languages, area coverage, safety acknowledgements.
2. **Guide tags and matching**: persisted specialty tags such as Architecture, History, Shopping, Food, Real estate, Local culture, Nightlife, and Accessibility; target-group tags such as First-time visitors, Families, Solo travelers, Property buyers, Business travelers, Students, and Seniors; matching logic that scores traveler intent against guide strengths.
3. **Availability and dispatch**: online/offline status, location permissions, nearby request matching, request expiry, accept/decline state.
4. **Places and routing**: Google Maps/Mapbox search, route previews, public-space constraints, GPS updates, turn prompts.
5. **Live broadcast stack**: WebRTC or managed live video SDK, audio mute, pause/resume, device/network health.
6. **Realtime session channel**: traveler messages, control commands, caption events, route progress, emergency stop/reporting.
7. **Captions/translation**: live speech-to-text, translation pipeline, language preferences, transcript storage.
8. **Bookings and scheduling**: guide calendar, reminders, time zones, cancellations, no-show policy.
9. **Payments and payouts**: payment capture, platform commission, guide payout, receipts, tax reporting, disputes.
10. **Trust and safety**: review moderation, privacy filters, public-space policy, guide quality scoring.
11. **Analytics**: guide acceptance rate, response time, stream quality, completion rate, payout performance.

## Project structure

```text
App.tsx                         Main app state and screen navigation
src/components/Primitives.tsx    Shared UI building blocks
src/components/GuideVisuals.tsx  Mock map/video/progress visuals
src/data/mock.ts                 Mock guide tags, request match context, captions, bookings, reviews
src/screens/*                    Guide flow screens
FLOW.md                          Product flow summary
README.md                        Setup, run, mocked scope, next integrations
```

## Shared backend integration

This build points at the published demo backend:

```text
https://rendezvous-livewalk-api.webpeter.com
```

Functional vertical slice now included:
1. Guide polls for pending traveler requests from the shared backend.
2. Guide can accept/decline a real request created by the traveler APK.
3. Accepting updates the traveler booking to confirmed.
4. A basic shared live session can be started.
5. Both sides can post/read basic session messages.

For a clean demo, call `POST /api/demo/reset` on the backend or use the reset button in the rebuilt traveler APK.
