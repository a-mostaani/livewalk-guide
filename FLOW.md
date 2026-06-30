# LiveWalk Guide MVP Flow

## Scope
This MVP covers only the guide side of LiveWalk. Traveler apps, marketplace dispatch, payments, video streaming, route APIs, realtime captions, backend accounts, persisted guide tags, production matching weights, and safety systems are represented with mocked data and local state.

## Interaction model
- The top Start/Dash/Request/Route/Ready/Live/Earn/Books/Rating labels are pressable step tabs.
- A persistent bottom Previous/Next bar lets Android testers move through all nine pages even when a screen's own CTA is below the fold.
- Each page scrolls vertically inside the safe area so lower controls are reachable on smaller phones and above Android system navigation.

## Guide flow
1. **Start / guide onboarding**
   - Guide sees the earning value proposition: local knowledge becomes paid live video walks.
   - The visual direction mirrors the traveler MVP: premium travel, practical utility, map-first and video-first.

2. **Availability dashboard**
   - Guide can toggle online/offline with mocked state.
   - Current area, language, guide rating, today’s earnings, walk count, and response time are visible.
   - Specialty tags and target-group tags are visible on the profile card so the guide can see how they are positioned for matching.

3. **Incoming request**
   - Guide sees a traveler request card with route, distance, estimated duration, language, interests, scheduled time, and payout.
   - A mocked match cue explains why the request fits the guide, for example “Good match: Architecture + First-time visitors.”
   - Accept/decline controls are clickable. Accept moves into route details; decline is mocked locally.

4. **Route details**
   - App shows mocked start/destination, route preview, distance, payout, duration, planned stops, traveler interests, and public-space safety note.

5. **Confirmed trip / pre-walk checklist**
   - Guide sees the confirmed walk, payout, readiness count, and checkboxes for arrival, battery, network, camera, and traveler context.
   - Start stream enters the mock live broadcaster.

6. **Live broadcast session**
   - App presents a broadcaster video placeholder, timer, mute/message/pause/end controls, GPS route panel, route progress, turn prompt, traveler messages, and captions/translation panel.
   - All controls use local mocked state or mock alerts.

7. **Earnings / summary**
   - Guide sees completed walk payout, LiveWalk commission, net payout, trip summary, and rating feedback prompt.

8. **Schedule / bookings**
   - Guide sees upcoming, pending, and completed requests in a simple mocked list with times and payouts.

9. **Ratings profile**
   - Guide sees rating, walk count, badges, language/area profile, and recent reviews.
   - Guide can tap mocked specialty tags such as Architecture, History, Shopping, Food, Real estate, Local culture, Nightlife, and Accessibility.
   - Guide can tap mocked target-group tags such as First-time visitors, Families, Solo travelers, Property buyers, Business travelers, Students, and Seniors.
   - The selected tags feed a local match-preview line only; production persistence and matching logic are deferred.
   - Restart returns to the guide dashboard.

## Assumptions for this first Android-ready version
- Expo + React Native is the fastest practical path to Android testing with Expo Go or an Android emulator.
- All data is mocked locally so the user can click through the guide journey without a backend.
- Guide tags are modeled as two groups: specialties describe what the guide is best at, while target groups describe who the guide is best suited to serve. The MVP shows these tags in dashboard/profile surfaces and uses them to explain incoming-request fit.
- Native maps, live video, payments, notifications, accounts, guide verification, and dispatch are intentionally deferred.

## Shared backend booking cycle added
- The guide dashboard now polls `https://rendezvous-livewalk-api.webpeter.com` for pending traveler requests every 2 seconds.
- Pending requests come from the traveler APK, not local mock state.
- Accepting a request updates the shared booking to confirmed and creates a live session room.
- Starting the stream marks the shared session live and both APKs can exchange basic status/messages.

## End-to-end APK test
1. Open the Traveler APK and submit a request.
2. Open the Guide APK dashboard; the pending count should update.
3. Tap **View live request**, then **Accept**.
4. The Traveler APK should confirm the booking within roughly 2 seconds.
5. Start/join the shared session and exchange a quick message.
