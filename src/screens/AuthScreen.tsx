import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Field, Header, colors } from '../components/Primitives';
import { AuthPayload } from '../api';

type Mode = 'register' | 'login';

export function AuthScreen({ busy, error, onSubmit }: { busy: boolean; error?: string; onSubmit: (mode: Mode, payload: AuthPayload) => Promise<void> }) {
  const [mode, setMode] = useState<Mode>('register');
  const [name, setName] = useState('Yuki Tanaka');
  const [email, setEmail] = useState('guide@livewalk.test');
  const [password, setPassword] = useState('secret123');
  const isRegister = mode === 'register';

  const submit = () => onSubmit(mode, { name, email, password });

  return (
    <View>
      <Header
        kicker="Account"
        title={isRegister ? 'Create your Guide account.' : 'Log back in.'}
        body="Registration now gates the booking cycle so sessions can be tied to the right role."
      />
      <Card style={styles.card}>
        {isRegister ? <Field label="Name" value={name} onChangeText={setName} autoCapitalize="words" /> : null}
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label={busy ? 'Working…' : isRegister ? 'Create account' : 'Log in'} icon={isRegister ? 'person-add' : 'log-in'} onPress={submit} disabled={busy} style={styles.primary} />
        <Button
          label={isRegister ? 'I already have an account' : 'Create a new account'}
          variant="ghost"
          onPress={() => setMode(isRegister ? 'login' : 'register')}
          style={styles.secondary}
        />
      </Card>
      <Text style={styles.note}>MVP note: login stays active while this app session is open. Persisted device login comes next.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 2 },
  primary: { marginTop: 8 },
  secondary: { marginTop: 8 },
  error: { color: colors.danger, fontWeight: '800', marginVertical: 8 },
  note: { color: colors.muted, fontWeight: '700', lineHeight: 20, marginTop: 14 },
});
