import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { Button } from './Button';

export function LoadingView() {
  return (
    <View style={styles.center} testID="loading">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.errorBox} accessibilityRole="alert">
      <Text style={styles.errorText}>{message}</Text>
      {onRetry ? (
        <Button title="Try again" variant="secondary" onPress={onRetry} style={styles.retry} />
      ) : null}
    </View>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  errorBox: {
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#FDECEA',
  },
  errorText: { color: colors.danger },
  retry: { marginTop: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center' },
  emptyMessage: { marginTop: spacing.sm, color: colors.muted, textAlign: 'center' },
});
