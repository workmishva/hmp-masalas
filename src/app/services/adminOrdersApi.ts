import type { User } from 'firebase/auth';

export type AdminOrderStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type AdminPaymentStatus = 'pending' | 'completed' | 'cancelled';

export interface AdminOrderItem {
  productId: string;
  productName: string;
  weightId: string;
  quantity: number;
  weightPrice: number;
  taxPercent: number;
}

export interface AdminShippingAddress {
  fullName: string;
  house: string;
  street: string;
  nearby?: string;
  cityVillage: string;
  district: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
}

export interface AdminOrder {
  orderId: string;
  userId: string;
  items: AdminOrderItem[];
  shippingAddress: AdminShippingAddress;
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

async function buildAdminAuthorization(user: User | null) {
  // If we have a Firebase user token, try that first
  if (user) {
    try {
      const token = await user.getIdToken();
      return `Bearer ${token}`;
    } catch (e) {
      console.warn("Failed to get Firebase token", e);
    }
  }

  // Fallback to our custom admin JWT from sessionStorage
  if (typeof window !== 'undefined') {
    const customToken = window.sessionStorage.getItem('hmp-admin-jwt');
    if (customToken) {
      return `Bearer ${customToken}`;
    }
  }

  return '';
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

export interface DailySalesData {
  date: string;
  day: string;
  orders: number;
  revenue: number;
}

export interface AdminDashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  dailySales: DailySalesData[];
  statusBreakdown: Record<string, number>;
}

export async function fetchAdminDashboardStats(user: User | null) {
  let url = `${BACKEND_URL}/api/orders/admin/stats`;
  const resetTimestamp = localStorage.getItem('adminDashboardResetAt');
  if (resetTimestamp) {
    url += `?since=${encodeURIComponent(resetTimestamp)}`;
  }

  const response = await fetch(url, {
    headers: await buildAdminHeaders(user),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to fetch admin stats'));
  }

  const data = (await response.json()) as AdminDashboardStats;
  return data;
}
