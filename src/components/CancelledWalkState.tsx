import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CANCELLED_WALK_DESCRIPTION, CANCELLED_WALK_TITLE } from '../session/requestLifecycle';
import { Card, colors } from './Primitives';

export function CancelledWalkState() {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Ionicons name="ban" size={24} color={colors.danger} />
        <View style={styles.copy}>
          <Text style={styles.title}>{CANCELLED_WALK_TITLE}</Text>
          <Text style={styles.body}>{CANCELLED_WALK_DESCRIPTION}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF1F1', borderColor: '#F1B8B8' },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  copy: { flex: 1 },
  title: { color: colors.danger, fontSize: 17, fontWeight: '900', marginBottom: 4 },
  body: { color: colors.ink, fontWeight: '700', lineHeight: 20 },
});
