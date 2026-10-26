import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { toApiError } from '@/api';
import { Button } from '@/components/Button';
import { ErrorMessage } from '@/components/Feedback';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import type { AuthScreenProps } from '@/navigation/types';
import { hasErrors, validateRegistration, type Errors } from '@/utils/validation';

import { authStyles as styles } from './LoginScreen';

type Field = 'username' | 'email' | 'password';

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const { signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const validation = validateRegistration(username, email, password);
    setErrors(validation);
    setFormError(null);
    if (hasErrors(validation)) return;

    setSubmitting(true);
    try {
      await signUp(username, email, password);
    } catch (err) {
      const apiError = toApiError(err);
      setErrors(apiError.fieldErrors);
      setFormError(apiError.message);
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Order medication and track deliveries</Text>
          {formError ? <ErrorMessage message={formError} /> : null}
          <TextField
            label="Username"
            value={username}
            onChangeText={setUsername}
            error={errors.username}
            autoCapitalize="none"
            autoComplete="username"
          />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            placeholder="At least 8 characters"
          />
          <Button title="Create account" onPress={handleSubmit} loading={submitting} />
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already registered?</Text>
            <Pressable accessibilityRole="link" onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}> Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
