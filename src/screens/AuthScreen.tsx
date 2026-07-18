import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Field, Header, colors } from '../components/Primitives';
import { QaBuildBadge } from '../components/QaBuildBadge';
import { useAuth } from '../auth/AuthContext';

type Mode = 'register' | 'login';

export function AuthScreen() {
  const { busy, error, login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('register');
  const [name, setName] = useState('');
  const [city, setCity] = useState('Other');
  const [email, setEmail] = useState('guide@livewalk.test');
  const [password, setPassword] = useState('secret123');
  const isRegister = mode === 'register';
  const [localError, setLocalError] = useState('');
  const shownError = localError || error;

  const useDemoGuide = () => {
    setMode('login');
    setName('Yuki Tanaka');
    setCity('Other');
    setEmail('demo.guide@livewalk.test');
    setPassword('LiveWalkDemo1!');
    setLocalError('');
  };

  const submit = () => {
    const displayName = name.trim();
    const dispatchCity = city.trim();
    if (!displayName) {
      setLocalError('Enter the display name that should appear in the live walk.');
      return;
    }
    if (!dispatchCity) {
      setLocalError('Enter the dispatch city used for traveler-request matching.');
      return;
    }
    setLocalError('');
    return mode === 'register' ? register({ name: displayName, city: dispatchCity, email, password }) : login({ name: displayName, city: dispatchCity, email, password });
  };

  return (
    <View>
      <Header
        kicker="Account"
        title={isRegister ? 'Create your Guide account.' : 'Log back in.'}
        body="Use the display name that should appear in requests, dashboards, and live sessions."
      />
      <QaBuildBadge />
      <Card style={styles.card}>
        <Field label={isRegister ? 'Name' : 'Display name'} value={name} onChangeText={setName} autoCapitalize="words" placeholder="Your guide name" />
        <Field label="Dispatch city" value={city} onChangeText={setCity} autoCapitalize="words" placeholder="London, Toronto, or Other" />
        <Text style={styles.cityNote}>Use London or Toronto for those matching regions. Other keeps the current demo-region behavior.</Text>
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        {shownError ? <Text style={styles.error}>{shownError}</Text> : null}
        <Button label="Use Demo Guide" icon="sparkles" variant="secondary" onPress={useDemoGuide} disabled={busy} style={styles.demo} />
        <Button label={busy ? 'Working…' : isRegister ? 'Create account' : 'Log in'} icon={isRegister ? 'person-add' : 'log-in'} onPress={submit} disabled={busy} style={styles.primary} />
        <Button
          label={isRegister ? 'I already have an account' : 'Create a new account'}
          variant="ghost"
          onPress={() => setMode(isRegister ? 'login' : 'register')}
          style={styles.secondary}
        />
      </Card>
      <Text style={styles.note}>MVP note: login stays active after closing and reopening the app. The display name is refreshed on login for this prototype.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 2 },
  demo: { marginTop: 2 },
  primary: { marginTop: 8 },
  secondary: { marginTop: 8 },
  error: { color: colors.danger, fontWeight: '800', marginVertical: 8 },
  cityNote: { color: colors.muted, fontWeight: '700', lineHeight: 18, marginTop: 4 },
  note: { color: colors.muted, fontWeight: '700', lineHeight: 20, marginTop: 14 },
});
