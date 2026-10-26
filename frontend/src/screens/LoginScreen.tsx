import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { toApiError } from '@/api';
import { Button } from '@/components/Button';
import { ErrorMessage } from '@/components/Feedback';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import type { AuthScreenProps } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { hasErrors, validateLogin, type Errors } from '@/utils/validation';

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors<'email' | 'password'>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const validation = validateLogin(email, password);
    setErrors(validation);
    setFormError(null);
    if (hasErrors(validation)) return;

    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setFormError(toApiError(err).message);
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <Text style={styles.title}>Utibu Health</Text>
        <Text style={styles.subtitle}>Sign in to order your medication</Text>
        {formError ? <ErrorMessage message={formError} /> : null}
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder="you@example.com"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          placeholder="Your password"
        />
        <Button title="Sign in" onPress={handleSubmit} loading={submitting} />
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account?</Text>
          <Pressable accessibilityRole="link" onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}> Register</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const authStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', color: colors.primary },
  subtitle: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  footerText: { color: colors.muted },
  link: { color: colors.accent, fontWeight: '700' },
});

const styles = authStyles;
