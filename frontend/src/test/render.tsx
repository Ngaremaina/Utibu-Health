import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { render } from '@testing-library/react-native';
import React from 'react';

import type { Cart, Order, Product } from '@/api/types';

const Stack = createNativeStackNavigator();

/**
 * Renders a screen inside a real navigator so hooks like useFocusEffect work.
 * Extra screens are registered as empty placeholders so navigate() calls succeed.
 */
export async function renderScreen(
  Screen: React.ComponentType<any>,
  { name = 'Screen', otherScreens = [] as string[] } = {},
) {
  const Placeholder = () => null;
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name={name} component={Screen} />
        {otherScreens.map((other) => (
          <Stack.Screen key={other} name={other} component={Placeholder} />
        ))}
      </Stack.Navigator>
    </NavigationContainer>,
  );
}

export const productFixture = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  name: 'Paracetamol',
  description: 'Pain reliever',
  manufacturer: 'Various',
  price: 100,
  stock: 10,
  expiration_date: '2027-12-31',
  usage_instructions: 'Take 1-2 tablets',
  warnings: 'Do not exceed dose',
  image_url: null,
  is_active: true,
  ...overrides,
});

export const cartFixture = (overrides: Partial<Cart> = {}): Cart => ({
  items: [
    {
      id: 10,
      quantity: 2,
      line_total: 200,
      product: {
        id: 1,
        name: 'Paracetamol',
        description: 'Pain',
        price: 100,
        image_url: null,
        stock: 5,
      },
    },
  ],
  subtotal: 200,
  count: 2,
  delivery_fee: 250,
  ...overrides,
});

export const orderFixture = (overrides: Partial<Order> = {}): Order => ({
  id: 7,
  status: 'confirmed',
  payment_method: 'cash_on_delivery',
  subtotal: 200,
  delivery_fee: 250,
  total: 450,
  mpesa_receipt_number: null,
  shipping_address: {
    id: 3,
    region: 'Nairobi',
    address: 'Moi Ave',
    city: 'Nairobi',
    created_at: '2026-01-01T00:00:00Z',
  },
  items: [
    {
      id: 1,
      product_id: 1,
      name: 'Paracetamol',
      image_url: null,
      unit_price: 100,
      quantity: 2,
      line_total: 200,
    },
  ],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});
