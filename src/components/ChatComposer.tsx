import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './Primitives';
import { MAX_MESSAGE_LENGTH, NOT_LIVE_MESSAGE, canSendDraft, submitDraft } from '../chat/composer';

// TICKET-4: lets the user type and send a message during a live walk.
export function ChatComposer({ sessionReady, placeholder, onSend }: {
  sessionReady: boolean;
  placeholder: string;
  onSend: (text: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const sendable = canSendDraft(draft, { sessionReady, sending });

  const submit = async () => {
    if (!sendable) return;
    setSending(true);
    const result = await submitDraft(draft, { sessionReady, sending: false }, onSend);
    setDraft(result.draft);
    setError(result.error);
    setSending(false);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <TextInput
          accessibilityLabel="Message"
          value={draft}
          onChangeText={(text) => { setDraft(text); if (error) setError(''); }}
          placeholder={sessionReady ? placeholder : NOT_LIVE_MESSAGE}
          placeholderTextColor={colors.muted}
          editable={sessionReady && !sending}
          maxLength={MAX_MESSAGE_LENGTH}
          multiline
          returnKeyType="send"
          blurOnSubmit
          onSubmitEditing={() => void submit()}
          style={[styles.input, !sessionReady && styles.inputDisabled]}
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: !sendable }}
          activeOpacity={0.82}
          disabled={!sendable}
          onPress={() => void submit()}
          style={[styles.send, !sendable && styles.sendDisabled]}
        >
          {sending ? <ActivityIndicator color={colors.white} /> : <Ionicons name="send" size={16} color={colors.white} />}
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, minHeight: 48, maxHeight: 120, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, color: colors.ink, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: '600' },
  inputDisabled: { opacity: 0.6 },
  send: { minHeight: 48, paddingHorizontal: 16, borderRadius: 16, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  error: { color: colors.danger, fontWeight: '700', marginTop: 8, lineHeight: 19 },
});
