import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from './src/api';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { Button, colors } from './src/components/Primitives';
import { QaBuildBadge } from './src/components/QaBuildBadge';
import { CancelledWalkState } from './src/components/CancelledWalkState';
import { AuthScreen } from './src/screens/AuthScreen';
import { ChecklistScreen } from './src/screens/ChecklistScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { EarningsScreen } from './src/screens/EarningsScreen';
import { IncomingRequestScreen } from './src/screens/IncomingRequestScreen';
import { LiveBroadcastScreen } from './src/screens/LiveBroadcastScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { RatingsProfileScreen } from './src/screens/RatingsProfileScreen';
import { RouteDetailsScreen } from './src/screens/RouteDetailsScreen';
import { ScheduleScreen } from './src/screens/ScheduleScreen';
import { useSession } from './src/hooks/useSession';
import { getGuideScreenContent, type GuideScreenContent, isGuideWorkflowScreen } from './src/session/requestLifecycle';
import { Screen } from './src/types';

const screenOrder: Screen[] = ['onboarding', 'dashboard', 'request', 'route', 'checklist', 'live', 'earnings', 'schedule', 'ratings'];

const screenLabels: Record<Screen, string> = {
  onboarding: 'Start',
  dashboard: 'Dash',
  request: 'Request',
  route: 'Route',
  checklist: 'Ready',
  live: 'Live',
  earnings: 'Earn',
  schedule: 'Books',
  ratings: 'Rating',
};

function GuideApp() {
  const { user, token, busy: authBusy } = useAuth();
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [online, setOnline] = useState(true);
  const [checklistReady, setChecklistReady] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const guideName = user?.name?.trim() || 'Guide';
  const session = useSession({
    enabled: Boolean(user),
    authReady: !authBusy,
    authKey: token,
    online,
    screenFocusKey: screen,
  });
  const pendingRequests = session.pendingRequests;
  const activeRequest = session.activeRequest;
  const messages = session.messages;
  const apiOnline = session.apiOnline;
  const apiNote = session.apiNote;
  const busy = session.busy;
  const walkEnded = session.walkEnded;
  const screenContent = getGuideScreenContent(screen, session.selectedRequestState);
  const travelerCancelled = screenContent.travelerCancelled;

  const currentIndex = screenOrder.indexOf(screen);
  const isFirstScreen = currentIndex === 0;
  const isLastScreen = currentIndex === screenOrder.length - 1;

  const navigateTo = (nextScreen: Screen) => {
    if (travelerCancelled && isGuideWorkflowScreen(nextScreen)) return;
    setScreen(nextScreen);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  };

  useEffect(() => {
    if (walkEnded && screen === 'live') {
      setScreen('earnings');
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
    }
  }, [screen, walkEnded]);

  const goPrevious = () => {
    if (!isFirstScreen) navigateTo(screenOrder[currentIndex - 1]);
  };
  const goNext = () => {
    if (screen === 'checklist') {
      if (!checklistReady) return;
      startLive();
      return;
    }
    navigateTo(isLastScreen ? 'dashboard' : screenOrder[currentIndex + 1]);
  };
  const nextDisabled = screen === 'checklist' && !checklistReady;
  const nextLabel = screen === 'checklist' && !checklistReady ? 'Complete checks' : (isLastScreen ? 'Dashboard' : 'Next');
  const nextIcon = screen === 'checklist' && !checklistReady ? 'lock-closed' : (isLastScreen ? 'speedometer' : 'chevron-forward');

  const viewRequest = () => {
    const selected = session.selectRequest(pendingRequests[0]);
    if (selected) navigateTo('request');
  };

  const acceptActiveRequest = async () => {
    if (travelerCancelled) return;
    const accepted = await session.acceptActiveRequest();
    if (accepted) {
      setChecklistReady(false);
      navigateTo('route');
    }
  };

  const declineActiveRequest = async () => {
    if (travelerCancelled) return;
    const declined = await session.declineActiveRequest();
    if (declined) navigateTo('dashboard');
  };

  const startLive = async () => {
    if (travelerCancelled) return;
    const started = await session.startLive();
    if (started) navigateTo('live');
  };

  const sendGuideMessage = async (text: string) => {
    if (travelerCancelled) return;
    await session.sendMessage(text);
  };

  const endLive = async () => {
    if (travelerCancelled) return false;
    const ended = await session.endLive();
    if (ended) navigateTo('earnings');
    return ended;
  };

  useEffect(() => {
    if (user && screen === 'onboarding') setScreen('dashboard');
  }, [user, screen]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <View style={styles.appShell}>
          <View style={styles.appHeader}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go to Start page" hitSlop={10} onPress={() => navigateTo('onboarding')} style={({ pressed }) => [styles.logoMini, pressed && styles.pressed]}>
              <Ionicons name="walk" size={17} color={colors.white} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>LiveWalk Guide MVP</Text>
              <Text style={styles.headerSub}>Shared backend booking cycle</Text>
            </View>
            <View style={[styles.statusPill, apiOnline ? styles.statusPillOnline : styles.statusPillOffline]}>
              <View style={[styles.statusDot, apiOnline && styles.statusDotOnline]} />
              <Text style={styles.statusText}>{apiOnline ? 'Live' : 'Sync'}</Text>
            </View>
          </View>
          <Text style={styles.backendLine} numberOfLines={1}>{user ? `${user.name} • ${apiNote}` : apiNote} • {pendingRequests.length} pending • {API_BASE.replace('https://', '')}</Text>
          {user ? <QaBuildBadge /> : null}
          {user ? <View style={styles.stepper}>
            {screenOrder.map((item, index) => {
              const active = item === screen;
              const disabled = travelerCancelled && isGuideWorkflowScreen(item);
              return (
                <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: active, disabled }} accessibilityLabel={`Open ${screenLabels[item]} step`} hitSlop={6} disabled={disabled} onPress={() => navigateTo(item)} style={({ pressed }) => [styles.stepItem, disabled && styles.stepItemDisabled, pressed && styles.stepItemPressed]}>
                  <View style={[styles.stepDot, index <= currentIndex && styles.stepDotActive]} />
                  <Text style={[styles.stepLabel, active && styles.stepLabelActive]} numberOfLines={1}>{screenLabels[item]}</Text>
                </Pressable>
              );
            })}
          </View> : null}
          <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" nestedScrollEnabled showsVerticalScrollIndicator>
            {authBusy ? (
              <View style={styles.authGate}>
                <Text style={styles.authGateKicker}>Account</Text>
                <Text style={styles.authGateTitle}>Restoring your session…</Text>
                <Text style={styles.authGateText}>Checking saved login before showing the app.</Text>
              </View>
            ) : !user ? (
              <AuthScreen />
            ) : (
              screenContent.kind === 'cancelled' ? <CancelledWalkState /> : (
                <>
                  {screen === 'onboarding' ? <OnboardingScreen onStart={() => navigateTo('dashboard')} /> : null}
                  {screen === 'dashboard' ? <DashboardScreen online={online} pendingCount={pendingRequests.length} newestRequest={pendingRequests[0]} guideName={guideName} guideCity={user?.city} onToggleOnline={() => setOnline((value) => !value)} onViewRequest={viewRequest} /> : null}
                  {screenContent.mountsIncomingRequest ? <IncomingRequestScreen request={activeRequest} busy={busy} onAccept={acceptActiveRequest} onDecline={declineActiveRequest} /> : null}
                  {screenContent.mountsRouteDetails ? <RouteDetailsScreen request={activeRequest} onContinue={() => navigateTo('checklist')} /> : null}
                  {screenContent.mountsChecklist ? <ChecklistScreen request={activeRequest} onReadyChange={setChecklistReady} onStartStream={startLive} /> : null}
                  {screenContent.mountsLiveBroadcast ? <LiveBroadcastScreen request={activeRequest} guideName={guideName} messages={messages} locationNote={session.locationNote} onSendMessage={sendGuideMessage} onEnd={endLive} /> : null}
                  {screen === 'earnings' ? <EarningsScreen onSchedule={() => navigateTo('schedule')} /> : null}
                  {screen === 'schedule' ? <ScheduleScreen onRatings={() => navigateTo('ratings')} /> : null}
                  {screen === 'ratings' ? <RatingsProfileScreen onRestart={() => navigateTo('dashboard')} /> : null}
                </>
              )
            )}
          </ScrollView>
          {user && screenContent.mountsBottomNavigation ? <SafeAreaView style={styles.bottomSafeArea} edges={['bottom']}>
            <View style={styles.bottomNav}>
              <Button label="Previous" icon="chevron-back" variant="secondary" onPress={goPrevious} disabled={isFirstScreen} style={styles.navButton} />
              <Button label={nextLabel} icon={nextIcon} onPress={goNext} disabled={nextDisabled} style={styles.navButton} />
            </View>
          </SafeAreaView> : null}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  appShell: { flex: 1, backgroundColor: colors.cream },
  authGate: { backgroundColor: colors.white, borderRadius: 28, borderWidth: 1, borderColor: colors.line, padding: 24, gap: 8 },
  authGateKicker: { color: colors.gold, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  authGateTitle: { color: colors.ink, fontSize: 26, fontWeight: '900', letterSpacing: -0.7 },
  authGateText: { color: colors.muted, fontWeight: '700', lineHeight: 20 },
  appHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 6 },
  logoMini: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.68 },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { color: colors.ink, fontWeight: '900', fontSize: 16 },
  headerSub: { color: colors.muted, fontWeight: '700', fontSize: 12, marginTop: 1 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1 },
  statusPillOnline: { backgroundColor: '#EAF7F2', borderColor: '#BDE8DC' },
  statusPillOffline: { backgroundColor: '#FFF8EA', borderColor: '#F2DCA8' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold },
  statusDotOnline: { backgroundColor: colors.green },
  statusText: { color: colors.ink, fontWeight: '900', fontSize: 11 },
  backendLine: { color: colors.muted, fontSize: 11, fontWeight: '700', paddingHorizontal: 18, paddingBottom: 7 },
  stepper: { flexDirection: 'row', paddingHorizontal: 8, paddingBottom: 8, gap: 2 },
  stepItem: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 11 },
  stepItemDisabled: { opacity: 0.42 },
  stepItemPressed: { backgroundColor: 'rgba(6,24,38,0.06)' },
  stepDot: { width: '78%', height: 4, borderRadius: 999, backgroundColor: '#E4DCCD' },
  stepDotActive: { backgroundColor: colors.ink },
  stepLabel: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  stepLabelActive: { color: colors.ink },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 28 },
  bottomSafeArea: { backgroundColor: colors.cream },
  bottomNav: { flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10, borderTopWidth: 1, borderTopColor: 'rgba(6,24,38,0.08)', backgroundColor: 'rgba(251,247,239,0.98)' },
  navButton: { flex: 1 },
});

export default function App() {
  return (
    <AuthProvider>
      <GuideApp />
    </AuthProvider>
  );
}
