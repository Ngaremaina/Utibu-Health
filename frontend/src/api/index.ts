import type { AxiosInstance } from 'axios';

import { http } from './client';
import type {
  AuthResponse,
  Cart,
  CheckoutRequest,
  NewShippingAddress,
  Order,
  Paginated,
  Product,
  Profile,
  ProfileResponse,
  ShippingAddress,
} from './types';

export function createApi(client: AxiosInstance) {
  const get = async <T>(url: string, params?: object) =>
    (await client.get<T>(url, { params })).data;
  const post = async <T>(url: string, body?: unknown) => (await client.post<T>(url, body)).data;
  const patch = async <T>(url: string, body?: unknown) => (await client.patch<T>(url, body)).data;
  const put = async <T>(url: string, body?: unknown) => (await client.put<T>(url, body)).data;
  const del = async <T>(url: string) => (await client.delete<T>(url)).data;

  return {
    auth: {
      login: (email: string, password: string) =>
        post<AuthResponse>('/auth/login', { email, password }),
      register: (username: string, email: string, password: string) =>
        post<AuthResponse>('/auth/register', { username, email, password }),
    },
    products: {
      list: (params: { q?: string; page?: number; per_page?: number } = {}) =>
        get<Paginated<Product>>('/products', params),
      get: (id: number) => get<Product>(`/products/${id}`),
    },
    cart: {
      get: () => get<Cart>('/cart'),
      add: (productId: number, quantity = 1) =>
        post<Cart>('/cart/items', { product_id: productId, quantity }),
      update: (itemId: number, quantity: number) =>
        patch<Cart>(`/cart/items/${itemId}`, { quantity }),
      remove: (itemId: number) => del<Cart>(`/cart/items/${itemId}`),
      clear: () => del<Cart>('/cart'),
    },
    addresses: {
      list: () => get<ShippingAddress[]>('/addresses'),
      create: (address: NewShippingAddress) => post<ShippingAddress>('/addresses', address),
      remove: (id: number) => del<void>(`/addresses/${id}`),
    },
    orders: {
      list: () => get<Order[]>('/orders'),
      get: (id: number) => get<Order>(`/orders/${id}`),
      checkout: (request: CheckoutRequest) => post<Order>('/orders', request),
      pay: (id: number, phoneNumber: string) =>
        post<Order>(`/orders/${id}/pay`, { phone_number: phoneNumber }),
      cancel: (id: number) => post<Order>(`/orders/${id}/cancel`),
    },
    profile: {
      get: () => get<ProfileResponse>('/profile'),
      update: (profile: Partial<Profile>) => put<ProfileResponse>('/profile', profile),
    },
  };
}

export type Api = ReturnType<typeof createApi>;

export const api = createApi(http);

export { ApiError, toApiError } from './client';
export type * from './types';
