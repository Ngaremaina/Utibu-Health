import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';

import { api, toApiError, type Profile, type ProfileResponse } from '@/api';
import { Button } from '@/components/Button';
import { ErrorMessage, LoadingView } from '@/components/Feedback';
import { TextField } from '@/components/TextField';
import { useApiQuery } from '@/hooks/useApiQuery';
import type { DrawerTabProps } from '@/navigation/types';
import { colors, spacing } from '@/theme';

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
  // Re-mount the form whenever fresh profile data arrives so it starts from server state.
  return (
    <ProfileForm
      key={data.profile ? JSON.stringify(data.profile) : 'empty'}
      data={data}
      onSaved={setData}
    />
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
      Alert.alert('Profile saved');
    } catch (err) {
      const apiError = toApiError(err);
      setFieldErrors(apiError.fieldErrors);
      Alert.alert('Profile not saved', apiError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{data.user.username}</Text>
      <Text style={styles.email}>{data.user.email}</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  email: { color: colors.muted, marginBottom: spacing.lg },
});
