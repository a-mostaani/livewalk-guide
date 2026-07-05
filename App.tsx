import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE, acceptRequest, AuthPayload, AuthUser, declineRequest, getSessionStatus, health, listPendingRequests, loginAccount, MarketplaceRequest, registerAccount, sendSessionMessage, SessionMessage, setAuthToken, startSession } from './src/api';
import { Button, colors } from './src/components/Primitives';
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

export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [online, setOnline] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);
  const [apiNote, setApiNote] = useState('Checking backend…');
  const [pendingRequests, setPendingRequests] = useState<MarketplaceRequest[]>([]);
  const [activeRequest, setActiveRequest] = useState<MarketplaceRequest | undefined>();
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authUser, setAuthUser] = useState<AuthUser | undefined>();
  const scrollRef = useRef<ScrollView>(null);
  const guideName = authUser?.name?.trim() || 'Guide';

  const currentIndex = screenOrder.indexOf(screen);
  const isFirstScreen = currentIndex === 0;
  const isLastScreen = currentIndex === screenOrder.length - 1;

  const navigateTo = (nextScreen: Screen) => {
    setScreen(nextScreen);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  };

  useEffect(() => {
    if (!authUser) {
      setApiOnline(false);
      setApiNote('Log in to connect backend');
      return;
    }
    let active = true;
    const poll = async () => {
      try {
        await health();
        if (!active) return;
        setApiOnline(true);
        setApiNote('Backend connected');
        if (online) {
          const data = await listPendingRequests();
          if (!active) return;
          setPendingRequests(data.requests);
        }
        if (activeRequest?.sessionId) {
          try {
            const session = await getSessionStatus(activeRequest.sessionId);
            if (active) setMessages(session.messages);
          } catch {}
        }
      } catch {
        if (!active) return;
        setApiOnline(false);
        setApiNote('Backend reconnecting');
      }
    };
    poll();
    const timer = setInterval(poll, 2000);
    return () => { active = false; clearInterval(timer); };
  }, [authUser, online, activeRequest?.sessionId]);

  const goPrevious = () => { if (!isFirstScreen) navigateTo(screenOrder[currentIndex - 1]); };
  const goNext = () => { navigateTo(isLastScreen ? 'dashboard' : screenOrder[currentIndex + 1]); };

  const viewRequest = () => {
    const newestRequest = pendingRequests[0];
    if (!newestRequest) return;
    setActiveRequest(newestRequest);
    navigateTo('request');
  };

  const acceptActiveRequest = async () => {
    if (!activeRequest) return;
    setBusy(true);
    try {
      const data = await acceptRequest(activeRequest.id);
      setActiveRequest(data.request);
      setMessages([]);
      navigateTo('route');
    } finally {
      setBusy(false);
    }
  };

  const declineActiveRequest = async () => {
    if (!activeRequest) return;
    setBusy(true);
    try {
      await declineRequest(activeRequest.id);
      setActiveRequest(undefined);
      navigateTo('dashboard');
    } finally {
      setBusy(false);
    }
  };

  const startLive = async () => {
    if (activeRequest?.sessionId) {
      try {
        const data = await startSession(activeRequest.sessionId);
        setMessages(data.messages);
        setActiveRequest({ ...activeRequest, status: 'live' });
      } catch {}
    }
    navigateTo('live');
  };

  const sendGuideMessage = async (text: string) => {
    if (!activeRequest?.sessionId) return;
    await sendSessionMessage(activeRequest.sessionId, text);
    const data = await getSessionStatus(activeRequest.sessionId);
    setMessages(data.messages);
  };

  const handleAuth = async (mode: 'register' | 'login', payload: AuthPayload) => {
    setAuthBusy(true);
    setAuthError('');
    try {
      const data = mode === 'register' ? await registerAccount(payload) : await loginAccount(payload);
      setAuthToken(data.token);
      setAuthUser(data.user);
      setScreen('dashboard');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setAuthBusy(false);
    }
  };

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
          <Text style={styles.backendLine} numberOfLines={1}>{authUser ? `${authUser.name} • ${apiNote}` : apiNote} • {pendingRequests.length} pending • {API_BASE.replace('https://', '')}</Text>
          {authUser ? <View style={styles.stepper}>
            {screenOrder.map((item, index) => {
              const active = item === screen;
              return (
                <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={`Open ${screenLabels[item]} step`} hitSlop={6} onPress={() => navigateTo(item)} style={({ pressed }) => [styles.stepItem, pressed && styles.stepItemPressed]}>
                  <View style={[styles.stepDot, index <= currentIndex && styles.stepDotActive]} />
                  <Text style={[styles.stepLabel, active && styles.stepLabelActive]} numberOfLines={1}>{screenLabels[item]}</Text>
                </Pressable>
              );
            })}
          </View> : null}
          <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" nestedScrollEnabled showsVerticalScrollIndicator>
            {!authUser ? (
              <AuthScreen busy={authBusy} error={authError} onSubmit={handleAuth} />
            ) : (
              <>
                {screen === 'onboarding' ? <OnboardingScreen onStart={() => navigateTo('dashboard')} /> : null}
                {screen === 'dashboard' ? <DashboardScreen online={online} pendingCount={pendingRequests.length} newestRequest={pendingRequests[0]} guideName={guideName} onToggleOnline={() => setOnline((value) => !value)} onViewRequest={viewRequest} /> : null}
                {screen === 'request' ? <IncomingRequestScreen request={activeRequest} busy={busy} onAccept={acceptActiveRequest} onDecline={declineActiveRequest} /> : null}
                {screen === 'route' ? <RouteDetailsScreen request={activeRequest} onContinue={() => navigateTo('checklist')} /> : null}
                {screen === 'checklist' ? <ChecklistScreen request={activeRequest} onStartStream={startLive} /> : null}
                {screen === 'live' ? <LiveBroadcastScreen request={activeRequest} guideName={guideName} messages={messages} onSendMessage={sendGuideMessage} onEnd={() => navigateTo('earnings')} /> : null}
                {screen === 'earnings' ? <EarningsScreen onSchedule={() => navigateTo('schedule')} /> : null}
                {screen === 'schedule' ? <ScheduleScreen onRatings={() => navigateTo('ratings')} /> : null}
                {screen === 'ratings' ? <RatingsProfileScreen onRestart={() => navigateTo('dashboard')} /> : null}
              </>
            )}
          </ScrollView>
          {authUser ? <SafeAreaView style={styles.bottomSafeArea} edges={['bottom']}>
            <View style={styles.bottomNav}>
              <Button label="Previous" icon="chevron-back" variant="secondary" onPress={goPrevious} disabled={isFirstScreen} style={styles.navButton} />
              <Button label={isLastScreen ? 'Dashboard' : 'Next'} icon={isLastScreen ? 'speedometer' : 'chevron-forward'} onPress={goNext} style={styles.navButton} />
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
