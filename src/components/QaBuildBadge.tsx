import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ACTIVE_BUILD_METADATA, renderQaBuildIdentity } from '../buildIdentity';
import { colors } from './Primitives';

export function QaBuildBadge() {
  const identity = renderQaBuildIdentity(ACTIVE_BUILD_METADATA);
  if (!identity) return null;

  return (
    <View testID={identity.testID} accessibilityRole="text" accessibilityLabel={identity.accessibilityLabel} style={styles.badge}>
      <Text testID={identity.labelTestID} style={styles.label}>{identity.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'stretch',
    backgroundColor: colors.qaBuildBadgeBackground,
    borderColor: colors.qaBuildBadgeBorder,
    borderRadius: 12,
    borderWidth: 2,
    marginHorizontal: 18,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  label: {
    color: colors.qaBuildBadgeText,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.15,
    lineHeight: 20,
  },
});
