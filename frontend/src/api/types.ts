// Shapes returned by the Flask API (/api/v1).

export interface User {
  id: number;
  email: string;
  username: string;
  is_admin: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface Profile {
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
}

export interface ProfileResponse {
  user: User;
  profile: Profile | null;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  manufacturer: string;
  price: number;
  stock: number;
  expiration_date: string | null;
  usage_instructions: string | null;
  warnings: string | null;
  image_url: string | null;
  is_active: boolean;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  per_page: number;
  total: number;
  pages: number;
}

export interface CartItem {
  id: number;
  quantity: number;
  line_total: number;
  product: Pick<Product, 'id' | 'name' | 'description' | 'price' | 'image_url' | 'stock'>;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  count: number;
  delivery_fee: number;
}

export interface ShippingAddress {
  id: number;
  region: string;
  address: string;
  city: string;
  created_at: string;
}

export type NewShippingAddress = Pick<ShippingAddress, 'region' | 'address' | 'city'>;

export type PaymentMethod = 'cash_on_delivery' | 'mpesa';

export type OrderStatus =
  'pending_payment' | 'confirmed' | 'paid' | 'payment_failed' | 'cancelled' | 'delivered';

export interface OrderItem {
  id: number;
  product_id: number | null;
  name: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Order {
  id: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  subtotal: number;
  delivery_fee: number;
  total: number;
  mpesa_receipt_number: string | null;
  shipping_address: ShippingAddress | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CheckoutRequest {
  shipping_address_id: number;
  payment_method: PaymentMethod;
  include_delivery: boolean;
  phone_number?: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
