import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Order, OrderStatus } from '@/api/types';
import { colors, radius, spacing } from '@/theme';
import { formatDate, formatKES, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/utils/format';

import { Button } from './Button';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending_payment: colors.warning,
  confirmed: colors.primary,
  paid: colors.success,
  payment_failed: colors.danger,
  cancelled: colors.muted,
  delivered: colors.success,
};

interface OrderCardProps {
  order: Order;
  onCancel?: (order: Order) => void;
  onRetryPayment?: (order: Order) => void;
}

export function OrderCard({ order, onCancel, onRetryPayment }: OrderCardProps) {
  const canCancel = ['pending_payment', 'payment_failed', 'confirmed'].includes(order.status);
  const canRetry = order.payment_method === 'mpesa' && order.status === 'payment_failed';

  return (
    <View style={styles.card} testID={`order-${order.id}`}>
      <View style={styles.header}>
        <Text style={styles.title}>Order #{order.id}</Text>
        <Text style={[styles.status, { color: STATUS_COLORS[order.status] }]}>
          {ORDER_STATUS_LABELS[order.status]}
        </Text>
      </View>
      <Text style={styles.meta}>
        {formatDate(order.created_at)} · {PAYMENT_METHOD_LABELS[order.payment_method]}
      </Text>
      {order.items.map((item) => (
        <View key={item.id} style={styles.row}>
          <Text style={styles.itemName}>
            {item.quantity} × {item.name}
          </Text>
          <Text>{formatKES(item.line_total)}</Text>
        </View>
      ))}
      {order.delivery_fee > 0 ? (
        <View style={styles.row}>
          <Text style={styles.itemName}>Delivery</Text>
          <Text>{formatKES(order.delivery_fee)}</Text>
        </View>
      ) : null}
      <View style={[styles.row, styles.totalRow]}>
        <Text style={styles.total}>Total</Text>
        <Text style={styles.total}>{formatKES(order.total)}</Text>
      </View>
      {order.mpesa_receipt_number ? (
        <Text style={styles.meta}>M-Pesa receipt: {order.mpesa_receipt_number}</Text>
      ) : null}
      {order.shipping_address ? (
        <Text style={styles.meta}>
          Deliver to: {order.shipping_address.address}, {order.shipping_address.city}
        </Text>
      ) : null}
      {canRetry && onRetryPayment ? (
        <Button
          title="Retry M-Pesa payment"
          onPress={() => onRetryPayment(order)}
          style={styles.action}
        />
      ) : null}
      {canCancel && onCancel ? (
        <Button
          title="Cancel order"
          variant="secondary"
          onPress={() => onCancel(order)}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  status: { fontWeight: '600' },
  meta: { color: colors.muted, fontSize: 13, marginTop: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  itemName: { flex: 1, color: colors.text, marginRight: spacing.sm },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  total: { fontWeight: '700', color: colors.text },
  action: { marginTop: spacing.md },
});
