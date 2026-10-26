import { screen, userEvent, within } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { api, ApiError } from '@/api';
import { cartFixture, productFixture, renderScreen } from '@/test/render';

import { CartScreen } from '../CartScreen';
import { ProductsScreen } from '../ProductsScreen';

jest.mock('@/api', () => ({
  ...jest.requireActual('@/api'),
  api: {
    products: { list: jest.fn() },
    cart: { get: jest.fn(), add: jest.fn(), update: jest.fn(), remove: jest.fn() },
  },
}));

const page = (items = [productFixture()]) => ({
  items,
  page: 1,
  per_page: 50,
  total: items.length,
  pages: 1,
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('ProductsScreen', () => {
  it('lists products and adds one to the cart', async () => {
    const user = userEvent.setup();
    jest.mocked(api.products.list).mockResolvedValue(page());
    jest.mocked(api.cart.add).mockResolvedValue(cartFixture());
    await renderScreen(ProductsScreen, { name: 'Products' });

    expect(await screen.findByText('Paracetamol')).toBeOnTheScreen();
    expect(screen.getByText('KES 100')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Add Paracetamol to cart' }));

    expect(api.cart.add).toHaveBeenCalledWith(1);
    expect(Alert.alert).toHaveBeenCalledWith('Added to cart', expect.any(String));
  });

  it('disables out-of-stock products', async () => {
    jest.mocked(api.products.list).mockResolvedValue(page([productFixture({ stock: 0 })]));
    await renderScreen(ProductsScreen, { name: 'Products' });
    expect(await screen.findByRole('button', { name: 'Add Paracetamol to cart' })).toBeDisabled();
  });

  it('searches on submit', async () => {
    const user = userEvent.setup();
    jest.mocked(api.products.list).mockResolvedValue(page([]));
    await renderScreen(ProductsScreen, { name: 'Products' });
    expect(await screen.findByText('No medication found')).toBeOnTheScreen();

    await user.type(screen.getByLabelText('Search medication'), 'brufen', { submitEditing: true });

    expect(api.products.list).toHaveBeenLastCalledWith({ q: 'brufen', per_page: 50 });
  });

  it('shows load errors', async () => {
    jest
      .mocked(api.products.list)
      .mockRejectedValue(new ApiError('Unable to reach the server.', null, 'network_error'));
    await renderScreen(ProductsScreen, { name: 'Products' });
    expect(await screen.findByText('Unable to reach the server.')).toBeOnTheScreen();
  });
});

describe('CartScreen', () => {
  it('shows items and subtotal and updates quantity', async () => {
    const user = userEvent.setup();
    jest.mocked(api.cart.get).mockResolvedValue(cartFixture());
    jest.mocked(api.cart.update).mockResolvedValue(
      cartFixture({
        subtotal: 300,
        items: [{ ...cartFixture().items[0]!, quantity: 3, line_total: 300 }],
      }),
    );
    await renderScreen(CartScreen, { name: 'Cart', otherScreens: ['Checkout'] });

    expect(await screen.findByTestId('cart-subtotal')).toHaveTextContent('KES 200');

    await user.press(screen.getByRole('button', { name: 'Increase Paracetamol quantity' }));

    expect(api.cart.update).toHaveBeenCalledWith(10, 3);
    expect(await screen.findByTestId('cart-subtotal')).toHaveTextContent('KES 300');
  });

  it('removes items', async () => {
    const user = userEvent.setup();
    jest.mocked(api.cart.get).mockResolvedValue(cartFixture());
    jest
      .mocked(api.cart.remove)
      .mockResolvedValue(cartFixture({ items: [], subtotal: 0, count: 0 }));
    await renderScreen(CartScreen, { name: 'Cart', otherScreens: ['Checkout'] });

    const item = await screen.findByTestId('cart-item-10');
    await user.press(within(item).getByRole('button', { name: 'Remove Paracetamol' }));

    expect(await screen.findByText('Your cart is empty')).toBeOnTheScreen();
  });

  it('prevents decreasing below one', async () => {
    jest
      .mocked(api.cart.get)
      .mockResolvedValue(
        cartFixture({ items: [{ ...cartFixture().items[0]!, quantity: 1, line_total: 100 }] }),
      );
    await renderScreen(CartScreen, { name: 'Cart', otherScreens: ['Checkout'] });
    expect(
      await screen.findByRole('button', { name: 'Decrease Paracetamol quantity' }),
    ).toBeDisabled();
  });
});
