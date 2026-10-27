import { Ionicons } from '@expo/vector-icons';
import {
  DrawerContentScrollView,
  DrawerItemList,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme';
import { confirmAction } from '@/utils/confirm';

export function DrawerContent(props: DrawerContentComponentProps) {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const initial = user?.username.charAt(0).toUpperCase() ?? '?';

  const logout = async () => {
    if (await confirmAction('Log out', 'Are you sure you want to log out?', 'Log out')) {
      await signOut();
    }
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      <Pressable
        accessibilityRole="button"
        onPress={() => void logout()}
        style={[styles.signOut, { paddingBottom: spacing.lg + insets.bottom }]}
      >
        <Ionicons name="exit-outline" size={22} color={colors.text} />
        <Text style={styles.signOutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: spacing.lg, marginBottom: spacing.sm },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { color: colors.surface, fontSize: 28, fontWeight: '700' },
  username: { fontSize: 20, fontWeight: '700', color: colors.text },
  email: { color: colors.muted },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  signOutText: { fontSize: 15, color: colors.text },
});
