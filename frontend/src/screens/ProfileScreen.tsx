import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { api, toApiError, type Profile, type ProfileResponse, type User } from '@/api';
import { Button } from '@/components/Button';
import { ErrorMessage, LoadingView } from '@/components/Feedback';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import type { DrawerTabProps } from '@/navigation/types';
import { colors, radius, spacing } from '@/theme';
import { confirmAction, notify } from '@/utils/confirm';
import { hasErrors, validateAccount, validatePasswordChange } from '@/utils/validation';

type EditableProfile = Record<keyof Profile, string>;

const FIELDS: { key: keyof Profile; label: string }[] = [
  { key: 'first_name', label: 'First name' },
  { key: 'last_name', label: 'Last name' },
  { key: 'phone_number', label: 'Phone number' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'country', label: 'Country' },
];

function toForm(profile: Profile | null): EditableProfile {
  return Object.fromEntries(
    FIELDS.map(({ key }) => [key, profile?.[key] ?? '']),
  ) as EditableProfile;
}

export function ProfileScreen(_props: DrawerTabProps<'Profile'>) {
  const fetchProfile = useCallback(() => api.profile.get(), []);
  const { data, error, loading, refresh, setData } = useApiQuery(fetchProfile);

  if (loading) return <LoadingView />;
  if (!data) {
    return <ErrorMessage message={error?.message ?? 'Unable to load profile.'} onRetry={refresh} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{data.user.username.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{data.user.username}</Text>
        <Text style={styles.email}>{data.user.email}</Text>
      </View>

      <Section title="Personal details">
        {/* Re-mount the form whenever fresh profile data arrives so it starts from server state. */}
        <ProfileForm
          key={data.profile ? JSON.stringify(data.profile) : 'empty'}
          data={data}
          onSaved={setData}
        />
      </Section>

      <Section title="Manage account">
        <AccountForm
          key={`${data.user.username}|${data.user.email}`}
          user={data.user}
          onSaved={(user) => setData({ ...data, user })}
        />
      </Section>

      <Section title="Change password">
        <PasswordForm />
      </Section>

      <LogoutButton />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function ProfileForm({
  data,
  onSaved,
}: {
  data: ProfileResponse;
  onSaved: (data: ProfileResponse) => void;
}) {
  const [form, setForm] = useState<EditableProfile>(() => toForm(data.profile));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    setFieldErrors({});
    try {
      // Send empty strings as null so optional fields can be cleared.
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, value.trim() || null]),
      ) as Partial<Profile>;
      onSaved(await api.profile.update(payload));
      notify('Profile saved');
    } catch (err) {
      const apiError = toApiError(err);
      setFieldErrors(apiError.fieldErrors);
      notify('Profile not saved', apiError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {FIELDS.map(({ key, label }) => (
        <TextField
          key={key}
          label={label}
          value={form[key]}
          error={fieldErrors[key]}
          onChangeText={(value) => setForm((f) => ({ ...f, [key]: value }))}
          keyboardType={key === 'phone_number' ? 'phone-pad' : 'default'}
        />
      ))}
      <Button title="Save profile" onPress={save} loading={saving} />
    </>
  );
}

function AccountForm({ user, onSaved }: { user: User; onSaved: (user: User) => void }) {
  const { updateUser } = useAuth();
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);

  const changes: { username?: string; email?: string } = {};
  if (username.trim() !== user.username) changes.username = username.trim();
  if (email.trim().toLowerCase() !== user.email) changes.email = email.trim();
  const dirty = Object.keys(changes).length > 0;

  const save = async () => {
    const validation = validateAccount(username, email);
    setErrors(validation);
    if (hasErrors(validation)) return;

    setSaving(true);
    try {
      const updated = await api.auth.updateAccount(changes);
      await updateUser(updated);
      onSaved(updated);
      notify('Account updated');
    } catch (err) {
      const apiError = toApiError(err);
      setErrors(apiError.status === 409 ? { email: apiError.message } : apiError.fieldErrors);
      notify('Account not updated', apiError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TextField
        label="Username"
        value={username}
        error={errors.username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextField
        label="Email"
        value={email}
        error={errors.email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <Button title="Update account" onPress={save} loading={saving} disabled={!dirty} />
    </>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const validation = validatePasswordChange(current, next, confirm);
    setErrors(validation);
    if (hasErrors(validation)) return;

    setSaving(true);
    try {
      await api.auth.changePassword(current, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      notify('Password changed');
    } catch (err) {
      const apiError = toApiError(err);
      const { current_password, new_password } = apiError.fieldErrors;
      setErrors({ current: current_password, next: new_password });
      notify('Password not changed', apiError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TextField
        label="Current password"
        value={current}
        error={errors.current}
        onChangeText={setCurrent}
        secureTextEntry
        autoComplete="current-password"
      />
      <TextField
        label="New password"
        value={next}
        error={errors.next}
        onChangeText={setNext}
        secureTextEntry
        autoComplete="new-password"
      />
      <TextField
        label="Confirm new password"
        value={confirm}
        error={errors.confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoComplete="new-password"
      />
      <Button title="Change password" onPress={save} loading={saving} />
    </>
  );
}

function LogoutButton() {
  const { signOut } = useAuth();

  const logout = async () => {
    if (await confirmAction('Log out', 'Are you sure you want to log out?', 'Log out')) {
      await signOut();
    }
  };

  return (
    <Button title="Log out" variant="danger" onPress={() => void logout()} style={styles.logout} />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { color: colors.surface, fontSize: 30, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  email: { color: colors.muted },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  logout: { marginTop: spacing.sm },
});
