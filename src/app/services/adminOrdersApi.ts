import type { User } from 'firebase/auth';

export type AdminOrderStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type AdminPaymentStatus = 'pending' | 'completed';

export interface AdminOrderItem {
  productId: string;
  productName: string;
  weightId: string;
  quantity: number;
  weightPrice: number;
  taxPercent: number;
}

export interface AdminOrder {
  orderId: string;
  userId: string;
  items: AdminOrderItem[];
  paymentMethod: 'upi' | 'whatsapp';
  paymentStatus?: AdminPaymentStatus;
  shippingMethod: 'standard' | 'express';
  subtotal: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  status: AdminOrderStatus;
  createdAt: string;
  updatedAt: string;
}

interface AdminOrdersResponse {
  orders: AdminOrder[];
}

interface AdminOrderUpdateResponse {
  order: AdminOrder;
  message: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const DEFAULT_ADMIN_USERNAME = import.meta.env.VITE_ADMIN_ID;

const DEFAULT_ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

async function buildAdminAuthorization(user: User | null) {
  if (user) {
    const token = await user.getIdToken();
    return `Bearer ${token}`;
  }

  const username = import.meta.env.VITE_ADMIN_USERNAME ?? DEFAULT_ADMIN_USERNAME;
  const password = import.meta.env.VITE_ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
  return `Basic ${btoa(`${username}:${password}`)}`;
}

async function buildAdminHeaders(
  user: User | null,
  extraHeaders: Record<string, string> = {}
) {
  return {
    Authorization: await buildAdminAuthorization(user),
    ...extraHeaders,
  };
}

async function parseApiError(response: Response, fallbackMessage: string) {
  try {
    const body = await response.json();
    return body.error || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export async function fetchAdminOrders(
  user: User | null,
  filters: { paymentMethod?: 'upi' | 'whatsapp'; status?: AdminOrderStatus } = {}
) {
  const params = new URLSearchParams();
  if (filters.paymentMethod) {
    params.set('paymentMethod', filters.paymentMethod);
  }
  if (filters.status) {
    params.set('status', filters.status);
  }

  const response = await fetch(`${BACKEND_URL}/api/orders/admin/all?${params.toString()}`, {
    headers: await buildAdminHeaders(user),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to fetch admin orders'));
  }

  const data = (await response.json()) as AdminOrdersResponse;
  return data.orders || [];
}

export async function updateAdminOrderStatus(
  user: User | null,
  orderId: string,
  status: Extract<AdminOrderStatus, 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>
) {
  const response = await fetch(`${BACKEND_URL}/api/orders/admin/${orderId}/status`, {
    method: 'PATCH',
    headers: await buildAdminHeaders(user, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to update order status'));
  }

  const data = (await response.json()) as AdminOrderUpdateResponse;
  return data.order;
}

export async function markWhatsAppOrderPaymentCompleted(user: User | null, orderId: string) {
  const response = await fetch(`${BACKEND_URL}/api/orders/admin/${orderId}/payment-completed`, {
    method: 'PATCH',
    headers: await buildAdminHeaders(user),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to mark payment as completed'));
  }

  const data = (await response.json()) as AdminOrderUpdateResponse;
  return data.order;
}
