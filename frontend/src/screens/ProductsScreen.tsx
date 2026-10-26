import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, TextInput, View } from 'react-native';

import { api, toApiError, type Product } from '@/api';
import { EmptyState, ErrorMessage, LoadingView } from '@/components/Feedback';
import { ProductCard } from '@/components/ProductCard';
import { useApiQuery } from '@/hooks/useApiQuery';
import type { DrawerTabProps } from '@/navigation/types';
import { colors, radius, spacing } from '@/theme';

export function ProductsScreen(_props: DrawerTabProps<'Products'>) {
  const [search, setSearch] = useState('');
  const [addingId, setAddingId] = useState<number | null>(null);
  const fetchProducts = useCallback(
    () => api.products.list({ q: search.trim() || undefined, per_page: 50 }),
    [search],
  );
  const { data, error, loading, refreshing, refresh } = useApiQuery(fetchProducts);

  const handleAdd = async (product: Product) => {
    setAddingId(product.id);
    try {
      await api.cart.add(product.id);
      Alert.alert('Added to cart', `${product.name} was added to your cart.`);
    } catch (err) {
      Alert.alert('Could not add to cart', toApiError(err).message);
    } finally {
      setAddingId(null);
    }
  };

  if (loading) return <LoadingView />;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search medication"
        placeholderTextColor={colors.muted}
        accessibilityLabel="Search medication"
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={() => void refresh()}
        returnKeyType="search"
        autoCapitalize="none"
      />
      {error ? <ErrorMessage message={error.message} onRetry={() => void refresh()} /> : null}
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ProductCard product={item} onAddToCart={handleAdd} adding={addingId === item.id} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          error ? undefined : (
            <EmptyState title="No medication found" message="Try another search." />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  search: {
    margin: spacing.lg,
    marginBottom: 0,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  list: { paddingBottom: spacing.xl, flexGrow: 1 },
});
