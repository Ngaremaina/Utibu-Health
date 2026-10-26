import type { OrderStatus, PaymentMethod } from '@/api/types';

const kes = new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 });

export function formatKES(amount: number): string {
  return `KES ${kes.format(amount)}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Awaiting payment',
  confirmed: 'Confirmed',
  paid: 'Paid',
  payment_failed: 'Payment failed',
  cancelled: 'Cancelled',
  delivered: 'Delivered',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash_on_delivery: 'Cash on delivery',
  mpesa: 'M-Pesa',
};
