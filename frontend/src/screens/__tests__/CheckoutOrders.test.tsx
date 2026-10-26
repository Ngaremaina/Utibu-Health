import { fireEvent, screen, userEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { api, ApiError } from '@/api';
import { cartFixture, orderFixture, renderScreen } from '@/test/render';

import { CheckoutScreen } from '../CheckoutScreen';
import { OrdersScreen } from '../OrdersScreen';

jest.mock('@/api', () => ({
  ...jest.requireActual('@/api'),
  api: {
    cart: { get: jest.fn() },
    addresses: { list: jest.fn(), create: jest.fn() },
    orders: { checkout: jest.fn(), list: jest.fn(), cancel: jest.fn(), pay: jest.fn() },
  },
}));

const address = {
  id: 3,
  region: 'Nairobi',
  address: 'Moi Ave',
  city: 'Nairobi',
  created_at: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.mocked(api.cart.get).mockResolvedValue(cartFixture());
  jest.mocked(api.addresses.list).mockResolvedValue([address]);
});

const renderCheckout = () =>
  renderScreen(CheckoutScreen, { name: 'Checkout', otherScreens: ['Main'] });

describe('CheckoutScreen', () => {
  it('shows the total including delivery and lets the user drop it', async () => {
    await renderCheckout();
    expect(await screen.findByTestId('checkout-total')).toHaveTextContent('KES 450');

    // userEvent can't toggle a Switch; fire its value change directly.
    await fireEvent(screen.getByRole('switch', { name: 'Include delivery' }), 'valueChange', false);

    expect(screen.getByTestId('checkout-total')).toHaveTextContent('KES 200');
  });

  it('requires a valid phone number for M-Pesa', async () => {
    const user = userEvent.setup();
    await renderCheckout();
    await user.press(await screen.findByRole('button', { name: 'Pay with M-Pesa' }));

    expect(screen.getByText('Enter a valid Safaricom number, e.g. 0712345678.')).toBeOnTheScreen();
    expect(api.orders.checkout).not.toHaveBeenCalled();
  });

  it('places an M-Pesa order', async () => {
    const user = userEvent.setup();
    jest.mocked(api.orders.checkout).mockResolvedValue(orderFixture({ status: 'pending_payment' }));
    await renderCheckout();

    await user.type(await screen.findByLabelText('M-Pesa phone number'), '0712345678');
    await user.press(screen.getByRole('button', { name: 'Pay with M-Pesa' }));

    expect(api.orders.checkout).toHaveBeenCalledWith({
      shipping_address_id: 3,
      payment_method: 'mpesa',
      include_delivery: true,
      phone_number: '0712345678',
    });
    expect(Alert.alert).toHaveBeenCalledWith('Order placed', expect.stringContaining('M-Pesa PIN'));
  });

  it('places a cash on delivery order', async () => {
    const user = userEvent.setup();
    jest.mocked(api.orders.checkout).mockResolvedValue(orderFixture());
    await renderCheckout();

    await user.press(await screen.findByRole('radio', { name: 'Cash on delivery' }));
    await user.press(screen.getByRole('button', { name: 'Place order' }));

    expect(api.orders.checkout).toHaveBeenCalledWith({
      shipping_address_id: 3,
      payment_method: 'cash_on_delivery',
      include_delivery: true,
    });
  });

  it('asks for an address when none exists', async () => {
    const user = userEvent.setup();
    jest.mocked(api.addresses.list).mockResolvedValue([]);
    await renderCheckout();

    await user.press(await screen.findByRole('radio', { name: 'Cash on delivery' }));
    await user.press(screen.getByRole('button', { name: 'Place order' }));

    expect(await screen.findByText('Add a delivery address first.')).toBeOnTheScreen();
  });

  it('saves a new address and selects it', async () => {
    const user = userEvent.setup();
    jest.mocked(api.addresses.list).mockResolvedValue([]);
    jest
      .mocked(api.addresses.create)
      .mockResolvedValue({ ...address, id: 9, address: 'Kenyatta Ave' });
    await renderCheckout();

    await user.type(await screen.findByLabelText('Street address'), 'Kenyatta Ave');
    await user.type(screen.getByLabelText('City'), 'Nairobi');
    await user.type(screen.getByLabelText('Region'), 'Nairobi');
    await user.press(screen.getByRole('button', { name: 'Save address' }));

    expect(await screen.findByRole('radio', { name: /Kenyatta Ave/ })).toBeChecked();
  });

  it('surfaces checkout errors', async () => {
    const user = userEvent.setup();
    jest
      .mocked(api.orders.checkout)
      .mockRejectedValue(new ApiError('Only 1 unit(s) in stock.', 409, 'insufficient_stock'));
    await renderCheckout();

    await user.press(await screen.findByRole('radio', { name: 'Cash on delivery' }));
    await user.press(screen.getByRole('button', { name: 'Place order' }));

    expect(await screen.findByText('Only 1 unit(s) in stock.')).toBeOnTheScreen();
  });
});

describe('OrdersScreen', () => {
  it('lists orders with status and totals', async () => {
    jest.mocked(api.orders.list).mockResolvedValue([orderFixture()]);
    await renderScreen(OrdersScreen, { name: 'Orders' });

    expect(await screen.findByText('Order #7')).toBeOnTheScreen();
    expect(screen.getByText('Confirmed')).toBeOnTheScreen();
    expect(screen.getByText('KES 450')).toBeOnTheScreen();
  });

  it('retries a failed M-Pesa payment', async () => {
    const user = userEvent.setup();
    jest
      .mocked(api.orders.list)
      .mockResolvedValue([orderFixture({ status: 'payment_failed', payment_method: 'mpesa' })]);
    jest
      .mocked(api.orders.pay)
      .mockResolvedValue(orderFixture({ status: 'pending_payment', payment_method: 'mpesa' }));
    await renderScreen(OrdersScreen, { name: 'Orders' });

    await user.press(await screen.findByRole('button', { name: 'Retry M-Pesa payment' }));
    await user.type(screen.getByLabelText('M-Pesa phone number'), '0712345678');
    await user.press(screen.getByRole('button', { name: 'Send payment request' }));

    expect(api.orders.pay).toHaveBeenCalledWith(7, '0712345678');
    expect(await screen.findByText('Awaiting payment')).toBeOnTheScreen();
  });

  it('shows an empty state', async () => {
    jest.mocked(api.orders.list).mockResolvedValue([]);
    await renderScreen(OrdersScreen, { name: 'Orders' });
    expect(await screen.findByText('No orders yet')).toBeOnTheScreen();
  });
});
