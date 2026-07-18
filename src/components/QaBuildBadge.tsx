import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { QA_BUILD_LABEL } from '../buildIdentity';

export function QaBuildBadge() {
  if (!QA_BUILD_LABEL) return null;

  return (
    <View testID="qa-build-badge" accessibilityRole="text" accessibilityLabel={QA_BUILD_LABEL} style={styles.badge}>
      <Text testID="qa-build-badge-label" style={styles.label}>{QA_BUILD_LABEL}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', backgroundColor: '#FFF0E0', borderColor: '#D8A856', borderRadius: 999, borderWidth: 1, marginBottom: 10, paddingHorizontal: 10, paddingVertical: 6 },
  label: { color: '#895A12', fontSize: 10, fontWeight: '900', letterSpacing: 0.3 },
});
