import type { AxiosInstance } from 'axios';

import { createApi } from '../index';

function fakeClient() {
  const respond = jest.fn(async () => ({ data: { ok: true } }));
  const client = {
    get: respond,
    post: respond,
    patch: respond,
    put: respond,
    delete: respond,
  } as unknown as AxiosInstance;
  return { client, calls: () => respond.mock.calls as unknown[][] };
}

it('maps endpoints to the REST API', async () => {
  const { client, calls } = fakeClient();
  const api = createApi(client);

  await api.auth.login('a@b.co', 'pw');
  await api.auth.register('a', 'a@b.co', 'pw');
  await api.products.list({ q: 'para' });
  await api.products.get(1);
  await api.cart.get();
  await api.cart.add(2, 3);
  await api.cart.update(4, 5);
  await api.cart.remove(4);
  await api.cart.clear();
  await api.addresses.list();
  await api.addresses.create({ region: 'r', address: 'a', city: 'c' });
  await api.addresses.remove(6);
  await api.orders.list();
  await api.orders.get(7);
  await api.orders.checkout({
    shipping_address_id: 1,
    payment_method: 'cash_on_delivery',
    include_delivery: true,
  });
  await api.orders.pay(7, '0712345678');
  await api.orders.cancel(7);
  await api.profile.get();
  const result = await api.profile.update({ city: 'Nairobi' });

  expect(result).toEqual({ ok: true });
  expect(calls().map((call) => call[0])).toEqual([
    '/auth/login',
    '/auth/register',
    '/products',
    '/products/1',
    '/cart',
    '/cart/items',
    '/cart/items/4',
    '/cart/items/4',
    '/cart',
    '/addresses',
    '/addresses',
    '/addresses/6',
    '/orders',
    '/orders/7',
    '/orders',
    '/orders/7/pay',
    '/orders/7/cancel',
    '/profile',
    '/profile',
  ]);
  expect(calls()[5]?.[1]).toEqual({ product_id: 2, quantity: 3 });
  expect(calls()[2]?.[1]).toEqual({ params: { q: 'para' } });
});
