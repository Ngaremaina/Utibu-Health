import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { api, toApiError, type Order } from '@/api';
import { Button } from '@/components/Button';
import { EmptyState, ErrorMessage, LoadingView } from '@/components/Feedback';
import { OrderCard } from '@/components/OrderCard';
import { TextField } from '@/components/TextField';
import { useApiQuery } from '@/hooks/useApiQuery';
import type { DrawerTabProps } from '@/navigation/types';
import { colors, radius, spacing } from '@/theme';
import { isKenyanPhone } from '@/utils/validation';

export const PAYMENT_POLL_INTERVAL_MS = 5_000;

export function OrdersScreen(_props: DrawerTabProps<'Orders'>) {
  const fetchOrders = useCallback(() => api.orders.list(), []);
  const { data: orders, error, loading, refreshing, refresh, setData } = useApiQuery(fetchOrders);
  const [retryOrder, setRetryOrder] = useState<Order | null>(null);
  const [phone, setPhone] = useState('');
  const [paying, setPaying] = useState(false);

  // Poll while an M-Pesa payment is awaiting the Daraja callback.
  const awaitingPayment = orders?.some((order) => order.status === 'pending_payment') ?? false;
  useEffect(() => {
    if (!awaitingPayment) return;
    const timer = setInterval(() => void refresh(), PAYMENT_POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [awaitingPayment, refresh]);

  const replaceOrder = (updated: Order) =>
    setData((orders ?? []).map((order) => (order.id === updated.id ? updated : order)));

  const cancel = (order: Order) => {
    Alert.alert('Cancel order?', `Order #${order.id} will be cancelled.`, [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: async () => {
          try {
            replaceOrder(await api.orders.cancel(order.id));
          } catch (err) {
            Alert.alert('Could not cancel', toApiError(err).message);
          }
        },
      },
    ]);
  };

  const pay = async () => {
    if (!retryOrder) return;
    if (!isKenyanPhone(phone)) {
      Alert.alert('Invalid phone number', 'Enter a valid Safaricom number, e.g. 0712345678.');
      return;
    }
    setPaying(true);
    try {
      replaceOrder(await api.orders.pay(retryOrder.id, phone.replace(/\s+/g, '')));
      setRetryOrder(null);
      Alert.alert('Check your phone', 'Enter your M-Pesa PIN to complete payment.');
    } catch (err) {
      Alert.alert('Payment not started', toApiError(err).message);
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <LoadingView />;

  return (
    <View style={styles.container}>
      {error ? <ErrorMessage message={error.message} onRetry={() => void refresh()} /> : null}
      {retryOrder ? (
        <View style={styles.retryPanel}>
          <Text style={styles.retryTitle}>Pay for order #{retryOrder.id}</Text>
          <TextField
            label="M-Pesa phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="0712345678"
          />
          <View style={styles.retryActions}>
            <Button
              title="Send payment request"
              onPress={pay}
              loading={paying}
              style={styles.flex}
            />
            <Button
              title="Close"
              variant="secondary"
              onPress={() => setRetryOrder(null)}
              style={styles.flex}
            />
          </View>
        </View>
      ) : null}
      <FlatList
        data={orders ?? []}
        keyExtractor={(order) => String(order.id)}
        renderItem={({ item }) => (
          <OrderCard order={item} onCancel={cancel} onRetryPayment={setRetryOrder} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          error ? undefined : (
            <EmptyState title="No orders yet" message="Your orders will appear here." />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { flexGrow: 1, paddingBottom: spacing.xl },
  retryPanel: {
    margin: spacing.lg,
    marginBottom: 0,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  retryTitle: { fontWeight: '700', fontSize: 16, marginBottom: spacing.md, color: colors.text },
  retryActions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
