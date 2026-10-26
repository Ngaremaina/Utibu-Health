import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { api, toApiError, type Cart, type CartItem } from '@/api';
import { Button } from '@/components/Button';
import { EmptyState, ErrorMessage, LoadingView } from '@/components/Feedback';
import { useApiQuery } from '@/hooks/useApiQuery';
import type { DrawerTabProps } from '@/navigation/types';
import { colors, radius, spacing } from '@/theme';
import { formatKES } from '@/utils/format';

export function CartScreen({ navigation }: DrawerTabProps<'Cart'>) {
  const fetchCart = useCallback(() => api.cart.get(), []);
  const { data: cart, error, loading, refreshing, refresh, setData } = useApiQuery(fetchCart);
  const [busyItem, setBusyItem] = useState<number | null>(null);

  const mutate = async (itemId: number, action: () => Promise<Cart>) => {
    setBusyItem(itemId);
    try {
      setData(await action());
    } catch (err) {
      Alert.alert('Cart not updated', toApiError(err).message);
    } finally {
      setBusyItem(null);
    }
  };

  const changeQuantity = (item: CartItem, delta: number) => {
    const quantity = item.quantity + delta;
    if (quantity < 1) return;
    void mutate(item.id, () => api.cart.update(item.id, quantity));
  };

  if (loading) return <LoadingView />;

  const items = cart?.items ?? [];

  return (
    <View style={styles.container}>
      {error ? <ErrorMessage message={error.message} onRetry={() => void refresh()} /> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          error ? undefined : (
            <EmptyState title="Your cart is empty" message="Browse products to add medication." />
          )
        }
        renderItem={({ item }) => (
          <View style={styles.item} testID={`cart-item-${item.id}`}>
            {item.product.image_url ? (
              <Image
                source={{ uri: item.product.image_url }}
                style={styles.image}
                resizeMode="contain"
              />
            ) : null}
            <View style={styles.details}>
              <Text style={styles.name}>{item.product.name}</Text>
              <Text style={styles.muted}>{formatKES(item.product.price)} each</Text>
              <Text style={styles.lineTotal}>{formatKES(item.line_total)}</Text>
              <View style={styles.controls}>
                <Button
                  title="−"
                  accessibilityLabel={`Decrease ${item.product.name} quantity`}
                  variant="secondary"
                  onPress={() => changeQuantity(item, -1)}
                  disabled={item.quantity <= 1 || busyItem === item.id}
                  style={styles.stepper}
                />
                <Text style={styles.quantity} accessibilityLabel={`Quantity ${item.quantity}`}>
                  {item.quantity}
                </Text>
                <Button
                  title="+"
                  accessibilityLabel={`Increase ${item.product.name} quantity`}
                  variant="secondary"
                  onPress={() => changeQuantity(item, 1)}
                  disabled={item.quantity >= item.product.stock || busyItem === item.id}
                  style={styles.stepper}
                />
                <Button
                  title="Remove"
                  accessibilityLabel={`Remove ${item.product.name}`}
                  variant="danger"
                  onPress={() => void mutate(item.id, () => api.cart.remove(item.id))}
                  disabled={busyItem === item.id}
                  style={styles.remove}
                />
              </View>
            </View>
          </View>
        )}
      />
      {items.length > 0 ? (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalLabel} testID="cart-subtotal">
              {formatKES(cart?.subtotal ?? 0)}
            </Text>
          </View>
          <Button title="Proceed to checkout" onPress={() => navigation.navigate('Checkout')} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { flexGrow: 1, paddingBottom: spacing.lg },
  item: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: 80, height: 80, marginRight: spacing.md },
  details: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, fontSize: 13 },
  lineTotal: { fontWeight: '600', color: colors.primary, marginTop: spacing.xs },
  controls: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
  stepper: { minHeight: 36, width: 40, paddingHorizontal: 0 },
  quantity: { minWidth: 24, textAlign: 'center', fontSize: 16, fontWeight: '600' },
  remove: { minHeight: 36, marginLeft: 'auto' },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  totalLabel: { fontSize: 18, fontWeight: '700', color: colors.text },
});
