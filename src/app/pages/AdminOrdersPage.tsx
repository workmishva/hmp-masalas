import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Package, RefreshCw, Truck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { resolveCatalogImage, useProductCatalog } from '../context/ProductCatalogContext';
import { useAuth } from '../context/AuthContext';
import {
  AdminOrder,
  AdminPaymentStatus,
  AdminOrderStatus,
  fetchAdminOrders,
  markWhatsAppOrderPaymentCompleted,
  updateAdminOrderStatus,
} from '../services/adminOrdersApi';

const STATUS_STYLES: Record<
  AdminOrderStatus,
  { label: string; className: string; icon: React.ComponentType<{ size?: number }> }
> = {
  pending_payment: {
    label: 'Pending Approval',
    className: 'bg-amber-500/10 text-amber-700',
    icon: Clock,
  },
  confirmed: {
    label: 'Approved',
    className: 'bg-blue-500/10 text-blue-700',
    icon: CheckCircle2,
  },
  processing: {
    label: 'Processing',
    className: 'bg-indigo-500/10 text-indigo-700',
    icon: RefreshCw,
  },
  shipped: {
    label: 'Shipped',
    className: 'bg-purple-500/10 text-purple-700',
    icon: Truck,
  },
  delivered: {
    label: 'Completed',
    className: 'bg-green-500/10 text-green-700',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-500/10 text-red-700',
    icon: XCircle,
  },
};

function getLineItemTotal(item: AdminOrder['items'][number]) {
  const unitPriceWithTax = item.weightPrice + item.weightPrice * ((item.taxPercent || 0) / 100);
  return unitPriceWithTax * item.quantity;
}

function resolvePaymentStatus(order: AdminOrder): AdminPaymentStatus {
  if (order.paymentStatus === 'pending' || order.paymentStatus === 'completed') {
    return order.paymentStatus;
  }
  return order.paymentMethod === 'upi' ? 'completed' : 'pending';
}

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const { products } = useProductCatalog();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  const productImageById = useMemo(
    () => new Map(products.map((product) => [product.id, product.image])),
    [products]
  );

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const backendOrders = await fetchAdminOrders(user);
      setOrders(backendOrders);
    } catch (error: any) {
      showErrorToast('Load Failed', 'Failed to load orders. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const setOrderStatus = async (
    orderId: string,
    status: Extract<AdminOrderStatus, 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>
  ) => {
    setActiveOrderId(orderId);
    try {
      const updatedOrder = await updateAdminOrderStatus(user, orderId, status);
      setOrders((currentOrders) =>
        currentOrders.map((order) => (order.orderId === updatedOrder.orderId ? updatedOrder : order))
      );
      showSuccessToast('Order Updated', `Order ${orderId} status changed successfully.`);
    } catch (error: any) {
      showErrorToast('Update Failed', 'Failed to update order. Please try again.');
    } finally {
      setActiveOrderId(null);
    }
  };

  const markPaymentCompleted = async (orderId: string) => {
    setActiveOrderId(orderId);
    try {
      const updatedOrder = await markWhatsAppOrderPaymentCompleted(user, orderId);
      setOrders((currentOrders) =>
        currentOrders.map((order) => (order.orderId === updatedOrder.orderId ? updatedOrder : order))
      );
      showSuccessToast('Payment Completed', `Payment marked completed for ${orderId}`);
    } catch (error: any) {
      showErrorToast('Payment Error', 'Failed to mark payment completed. Please try again.');
    } finally {
      setActiveOrderId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">All Orders</h1>
          <p className="mt-2 text-muted-foreground">
            View every order and mark payment complete for WhatsApp orders after confirmation.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          className="inline-flex items-center gap-2 self-start rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:border-secondary hover:text-secondary"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {!isLoading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-border border-dashed py-24 text-center">
            <Package size={48} className="mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-bold text-foreground">No orders yet</h3>
            <p className="text-sm text-muted-foreground">
              Orders from checkout will appear here.
            </p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-[2rem] border border-border bg-card p-10 text-center text-muted-foreground">
            Loading orders...
          </div>
        ) : null}

        {!isLoading
          ? orders.map((order) => {
              const statusStyle = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending_payment;
              const StatusIcon = statusStyle.icon;
              const paymentStatus = resolvePaymentStatus(order);
              const canApprove = order.status === 'pending_payment';
              const canComplete = !['delivered', 'cancelled'].includes(order.status);
              const canCancel = !['delivered', 'cancelled'].includes(order.status);
              const canMarkPaymentCompleted =
                order.paymentMethod === 'whatsapp' && paymentStatus !== 'completed';
              const isUpdating = activeOrderId === order.orderId;

              return (
                <div key={order.orderId} className="rounded-[1.5rem] border border-border bg-card p-6 shadow-sm">
                  <div className="mb-6 flex flex-col justify-between gap-4 border-b border-border pb-4 md:flex-row md:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-bold text-foreground">Order {order.orderId}</span>
                        <span
                          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${statusStyle.className}`}
                        >
                          <StatusIcon size={12} />
                          {statusStyle.label}
                        </span>
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold uppercase text-stone-700">
                          {order.paymentMethod}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            paymentStatus === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-700'
                              : 'bg-amber-500/10 text-amber-700'
                          }`}
                        >
                          Payment: {paymentStatus === 'completed' ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => markPaymentCompleted(order.orderId)}
                        className="rounded-lg bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!canMarkPaymentCompleted || isUpdating}
                      >
                        Mark Payment Completed
                      </button>
                      <button
                        onClick={() => setOrderStatus(order.orderId, 'confirmed')}
                        className="rounded-lg bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!canApprove || isUpdating}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setOrderStatus(order.orderId, 'delivered')}
                        className="rounded-lg bg-green-50 px-4 py-2 text-xs font-bold text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!canComplete || isUpdating}
                      >
                        Mark Completed
                      </button>
                      <button
                        onClick={() => setOrderStatus(order.orderId, 'cancelled')}
                        className="rounded-lg bg-red-50 px-4 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!canCancel || isUpdating}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {order.items.map((item, index) => {
                      const itemImage = productImageById.get(item.productId) || '';

                      return (
                        <div key={`${order.orderId}-${item.productId}-${index}`} className="flex items-center gap-4">
                          <div className="h-12 w-12 overflow-hidden rounded-lg bg-muted">
                            <ImageWithFallback
                              src={resolveCatalogImage(itemImage)}
                              alt={item.productName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-foreground">{item.productName}</p>
                            <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
                              {item.weightId}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">Qty: {item.quantity}</p>
                            <p className="text-sm font-black text-primary">
                              Rs {getLineItemTotal(item).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex justify-end border-t border-border pt-4">
                    <span className="text-lg font-bold text-foreground">
                      Total:
                      <span className="ml-2 font-black text-primary">Rs {order.totalAmount.toFixed(2)}</span>
                    </span>
                  </div>
                </div>
              );
            })
          : null}
      </div>
    </div>
  );
}
