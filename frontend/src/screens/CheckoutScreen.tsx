import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { api, toApiError, type PaymentMethod } from '@/api';
import { Button } from '@/components/Button';
import { ErrorMessage, LoadingView } from '@/components/Feedback';
import { TextField } from '@/components/TextField';
import { useApiQuery } from '@/hooks/useApiQuery';
import type { AppScreenProps } from '@/navigation/types';
import { colors, radius, spacing } from '@/theme';
import { formatKES, PAYMENT_METHOD_LABELS } from '@/utils/format';
import { isKenyanPhone } from '@/utils/validation';

const PAYMENT_METHODS: PaymentMethod[] = ['mpesa', 'cash_on_delivery'];

export function CheckoutScreen({ navigation }: AppScreenProps<'Checkout'>) {
  const fetchData = useCallback(async () => {
    const [cart, addresses] = await Promise.all([api.cart.get(), api.addresses.list()]);
    return { cart, addresses };
  }, []);
  const { data, error, loading, refresh, setData } = useApiQuery(fetchData);

  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [newAddress, setNewAddress] = useState({ address: '', city: '', region: '' });
  const [savingAddress, setSavingAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [includeDelivery, setIncludeDelivery] = useState(true);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (loading) return <LoadingView />;
  if (!data)
    return (
      <ErrorMessage message={error?.message ?? 'Unable to load checkout.'} onRetry={refresh} />
    );

  const addressId = selectedAddress ?? data.addresses[0]?.id ?? null;
  // Display only; the server computes the authoritative total.
  const { subtotal, delivery_fee: deliveryFee } = data.cart;
  const total = subtotal + (includeDelivery ? deliveryFee : 0);

  const saveAddress = async () => {
    const { address, city, region } = newAddress;
    if (!address.trim() || !city.trim() || !region.trim()) {
      Alert.alert('Incomplete address', 'Enter the address, city and region.');
      return;
    }
    setSavingAddress(true);
    try {
      const created = await api.addresses.create({ address, city, region });
      setData({ ...data, addresses: [...data.addresses, created] });
      setSelectedAddress(created.id);
      setNewAddress({ address: '', city: '', region: '' });
    } catch (err) {
      Alert.alert('Address not saved', toApiError(err).message);
    } finally {
      setSavingAddress(false);
    }
  };

  const placeOrder = async () => {
    setSubmitError(null);
    if (addressId === null) {
      setSubmitError('Add a delivery address first.');
      return;
    }
    if (paymentMethod === 'mpesa' && !isKenyanPhone(phone)) {
      setPhoneError('Enter a valid Safaricom number, e.g. 0712345678.');
      return;
    }
    setPhoneError(undefined);
    setSubmitting(true);
    try {
      await api.orders.checkout({
        shipping_address_id: addressId,
        payment_method: paymentMethod,
        include_delivery: includeDelivery,
        ...(paymentMethod === 'mpesa' ? { phone_number: phone.replace(/\s+/g, '') } : {}),
      });
      Alert.alert(
        'Order placed',
        paymentMethod === 'mpesa'
          ? 'Check your phone and enter your M-Pesa PIN to complete payment.'
          : 'Your order is confirmed. Pay on delivery.',
      );
      navigation.navigate('Main', { screen: 'Orders' });
    } catch (err) {
      const apiError = toApiError(err);
      if (apiError.code === 'payment_initiation_failed') {
        // The order exists but the STK push failed; it can be retried from Orders.
        Alert.alert('Payment not started', `${apiError.message} You can retry from your orders.`);
        navigation.navigate('Main', { screen: 'Orders' });
        return;
      }
      setSubmitError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Delivery address</Text>
      {data.addresses.map((address) => (
        <Pressable
          key={address.id}
          accessibilityRole="radio"
          accessibilityState={{ checked: address.id === addressId }}
          onPress={() => setSelectedAddress(address.id)}
          style={[styles.option, address.id === addressId && styles.optionSelected]}
        >
          <Text style={styles.optionText}>
            {address.address}, {address.city} ({address.region})
          </Text>
        </Pressable>
      ))}
      <View style={styles.card}>
        <TextField
          label="Street address"
          value={newAddress.address}
          onChangeText={(address) => setNewAddress((a) => ({ ...a, address }))}
        />
        <TextField
          label="City"
          value={newAddress.city}
          onChangeText={(city) => setNewAddress((a) => ({ ...a, city }))}
        />
        <TextField
          label="Region"
          value={newAddress.region}
          onChangeText={(region) => setNewAddress((a) => ({ ...a, region }))}
        />
        <Button
          title="Save address"
          variant="secondary"
          onPress={saveAddress}
          loading={savingAddress}
        />
      </View>

      <Text style={styles.heading}>Payment method</Text>
      {PAYMENT_METHODS.map((method) => (
        <Pressable
          key={method}
          accessibilityRole="radio"
          accessibilityState={{ checked: method === paymentMethod }}
          onPress={() => setPaymentMethod(method)}
          style={[styles.option, method === paymentMethod && styles.optionSelected]}
        >
          <Text style={styles.optionText}>{PAYMENT_METHOD_LABELS[method]}</Text>
        </Pressable>
      ))}
      {paymentMethod === 'mpesa' ? (
        <TextField
          label="M-Pesa phone number"
          value={phone}
          onChangeText={setPhone}
          error={phoneError}
          keyboardType="phone-pad"
          placeholder="0712345678"
        />
      ) : null}

      <View style={styles.deliveryRow}>
        <Text style={styles.optionText}>Home delivery ({formatKES(deliveryFee)})</Text>
        <Switch
          accessibilityLabel="Include delivery"
          value={includeDelivery}
          onValueChange={setIncludeDelivery}
        />
      </View>

      <View style={styles.summary}>
        <View style={styles.row}>
          <Text>Subtotal</Text>
          <Text>{formatKES(subtotal)}</Text>
        </View>
        {includeDelivery ? (
          <View style={styles.row}>
            <Text>Delivery</Text>
            <Text>{formatKES(deliveryFee)}</Text>
          </View>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.total}>Total</Text>
          <Text style={styles.total} testID="checkout-total">
            {formatKES(total)}
          </Text>
        </View>
      </View>

      {submitError ? <ErrorMessage message={submitError} /> : null}
      <Button
        title={paymentMethod === 'mpesa' ? 'Pay with M-Pesa' : 'Place order'}
        onPress={placeOrder}
        loading={submitting}
        disabled={data.cart.items.length === 0}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  option: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  optionSelected: { borderColor: colors.primary, borderWidth: 2 },
  optionText: { color: colors.text, fontSize: 15 },
  card: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  summary: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: spacing.xs },
  total: { fontWeight: '700', fontSize: 16 },
});
