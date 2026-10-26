import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import type { Product } from '@/api/types';
import { colors, radius, spacing } from '@/theme';
import { formatDate, formatKES } from '@/utils/format';

import { Button } from './Button';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  adding?: boolean;
}

export function ProductCard({ product, onAddToCart, adding = false }: ProductCardProps) {
  const outOfStock = product.stock <= 0;
  return (
    <View style={styles.card} testID={`product-${product.id}`}>
      {product.image_url ? (
        <Image
          source={{ uri: product.image_url }}
          style={styles.image}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      ) : null}
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.price}>{formatKES(product.price)}</Text>
      <Text style={styles.description}>{product.description}</Text>
      {product.expiration_date ? (
        <Text style={styles.meta}>Best before: {formatDate(product.expiration_date)}</Text>
      ) : null}
      {product.usage_instructions ? (
        <Text style={styles.meta}>Instructions: {product.usage_instructions}</Text>
      ) : null}
      {product.warnings ? <Text style={styles.warning}>Note: {product.warnings}</Text> : null}
      <Button
        title={outOfStock ? 'Out of stock' : 'Add to cart'}
        accessibilityLabel={`Add ${product.name} to cart`}
        onPress={() => onAddToCart(product)}
        disabled={outOfStock}
        loading={adding}
        style={styles.button}
      />
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
  image: { width: '100%', height: 200, marginBottom: spacing.md },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  price: { fontSize: 16, fontWeight: '600', color: colors.primary, marginVertical: spacing.xs },
  description: { color: colors.text, marginBottom: spacing.sm },
  meta: { color: colors.muted, fontSize: 13, marginBottom: spacing.xs },
  warning: { color: colors.warning, fontSize: 13, marginBottom: spacing.xs },
  button: { marginTop: spacing.md },
});
