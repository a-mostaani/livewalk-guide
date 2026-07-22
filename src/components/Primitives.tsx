import React from 'react';
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const colors = {
  ink: '#061826',
  muted: '#6C7A86',
  line: '#DCE5EB',
  sand: '#F5EFE5',
  cream: '#FBF7EF',
  blue: '#0D4D66',
  blueSoft: '#E4F2F5',
  gold: '#C8963E',
  green: '#1F8A70',
  white: '#FFFFFF',
  danger: '#B54747',
  coral: '#E76F51',
  lavender: '#ECE8FF',
  qaBuildBadgeBackground: '#4A1D00',
  qaBuildBadgeBorder: '#FFB547',
  qaBuildBadgeText: '#FFFFFF',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  style,
  disabled = false,
}: {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'ghost' && styles.buttonGhost,
        variant === 'danger' && styles.buttonDanger,
        variant === 'success' && styles.buttonSuccess,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={variant === 'primary' || variant === 'danger' || variant === 'success' ? colors.white : colors.ink}
        />
      ) : null}
      <Text
        style={[
          styles.buttonText,
          (variant === 'primary' || variant === 'danger' || variant === 'success') && styles.buttonTextPrimary,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#93A0AA" style={styles.input} {...props} />
    </View>
  );
}

export function Pill({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.pill, selected && styles.pillSelected]}
      disabled={!onPress}
    >
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Header({ kicker, title, body }: { kicker?: string; title: string; body?: string }) {
  return (
    <View style={styles.header}>
      {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

export function Stat({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'dark' }) {
  return (
    <View style={[styles.stat, tone === 'dark' && styles.statDark]}>
      <Text style={[styles.statValue, tone === 'dark' && styles.statValueDark]}>{value}</Text>
      <Text style={[styles.statLabel, tone === 'dark' && styles.statLabelDark]}>{label}</Text>
    </View>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 18,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonPrimary: { backgroundColor: colors.ink },
  buttonSecondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  buttonGhost: { backgroundColor: 'transparent' },
  buttonDanger: { backgroundColor: colors.danger },
  buttonSuccess: { backgroundColor: colors.green },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: colors.ink, fontWeight: '800', fontSize: 15 },
  buttonTextPrimary: { color: colors.white },
  fieldWrap: { gap: 8, marginBottom: 14 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.ink,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    marginRight: 8,
    marginBottom: 8,
  },
  pillSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  pillText: { color: colors.ink, fontWeight: '700' },
  pillTextSelected: { color: colors.white },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(6,24,38,0.08)',
    shadowColor: '#082133',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  header: { marginBottom: 18 },
  kicker: { color: colors.gold, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  title: { color: colors.ink, fontSize: 33, lineHeight: 39, fontWeight: '900', letterSpacing: -1 },
  body: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 10 },
  stat: { flex: 1, backgroundColor: colors.cream, borderRadius: 20, padding: 14, gap: 4 },
  statDark: { backgroundColor: 'rgba(255,255,255,0.12)' },
  statValue: { color: colors.ink, fontWeight: '900', fontSize: 18 },
  statValueDark: { color: colors.white },
  statLabel: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  statLabelDark: { color: 'rgba(255,255,255,0.68)' },
  sectionHeading: { marginBottom: 12 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  sectionSubtitle: { color: colors.muted, fontWeight: '700', marginTop: 3, lineHeight: 19 },
});
