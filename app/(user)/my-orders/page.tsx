'use client'

import { Fragment, useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Package, ChevronDown, ChevronUp, XCircle,
  AlertTriangle, Loader2, Check, ShoppingBag, CreditCard, Box, Truck, MapPin,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { IOrder } from '@/types'

// ── Status configuration ──────────────────────────────────────────────────────

const FLOW_STEPS = [
  { key: 'Payment Pending',   label: 'Order Placed',      icon: ShoppingBag },
  { key: 'Payment Confirmed', label: 'Payment Confirmed', icon: CreditCard  },
  { key: 'Packed',            label: 'Packed',            icon: Box         },
  { key: 'Shipped',           label: 'Shipped',           icon: Truck       },
  { key: 'Delivered',         label: 'Delivered',         icon: MapPin      },
] as const

// Map DB values → 0-based index in FLOW_STEPS (includes legacy values)
const FLOW_INDEX: Record<string, number> = {
  'Payment Pending':   0,
  'Payment Confirmed': 1,
  'Packed':            2,
  'Shipped':           3,
  'Delivered':         4,
  'Pending':           0, // legacy
  'Confirmed':         1, // legacy
}

// User-friendly labels for the order status badge
const STATUS_LABEL: Record<string, string> = {
  'Payment Pending':   'Order Placed',
  'Payment Confirmed': 'Confirmed',
  'Packed':            'Being Packed',
  'Shipped':           'Shipped',
  'Delivered':         'Delivered',
  'Cancelled':         'Cancelled',
  'Pending':           'Order Placed',
  'Confirmed':         'Confirmed',
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  'Payment Pending':   'bg-yellow-100 text-yellow-700',
  'Payment Confirmed': 'bg-blue-100 text-blue-700',
  'Packed':            'bg-purple-100 text-purple-700',
  'Shipped':           'bg-indigo-100 text-indigo-700',
  'Delivered':         'bg-cardamom-100 text-cardamom-700',
  'Cancelled':         'bg-chili-100 text-chili-700',
  'Pending':           'bg-yellow-100 text-yellow-700',
  'Confirmed':         'bg-blue-100 text-blue-700',
}

function paymentBadge(status: string): { label: string; cls: string } {
  if (status === 'Payment Pending' || status === 'Pending') {
    return { label: 'Awaiting Payment', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
  }
  if (status === 'Cancelled') {
    return { label: 'Cancelled', cls: 'bg-chili-100 text-chili-700 border-chili-200' }
  }
  return { label: 'Payment Received', cls: 'bg-cardamom-100 text-cardamom-700 border-cardamom-200' }
}

// ── Progress tracker ──────────────────────────────────────────────────────────
function OrderProgressBar({ status }: { status: string }) {
  if (status === 'Cancelled') {
    return (
      <div className="px-5 pb-4 pt-3">
        <div className="flex items-center gap-2 text-xs text-chili-600 font-medium">
          <XCircle className="w-4 h-4 shrink-0" />
          This order was cancelled.
        </div>
      </div>
    )
  }

  const currentIdx = FLOW_INDEX[status] ?? 0

  return (
    <div className="px-5 pb-4 pt-2">
      <div className="flex items-start">
        {FLOW_STEPS.map((step, idx) => {
          const done    = idx < currentIdx
          const current = idx === currentIdx

          return (
            <Fragment key={step.key}>
              {/* Step node */}
              <div className="flex flex-col items-center gap-1.5 shrink-0" style={{ width: '20%' }}>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    done
                      ? 'bg-cardamom-500 text-white'
                      : current
                        ? 'bg-saffron-500 text-white ring-[3px] ring-saffron-300'
                        : 'bg-masala-100 text-masala-400 border border-masala-200'
                  }`}
                  aria-label={step.label}
                >
                  {done ? (
                    <Check size={14} strokeWidth={2.5} />
                  ) : (
                    <step.icon size={13} />
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium text-center leading-tight px-0.5 ${
                    done || current ? 'text-masala-800' : 'text-masala-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {idx < FLOW_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mt-[13px] mx-1 rounded-full transition-colors ${
                    idx < currentIdx ? 'bg-cardamom-400' : 'bg-masala-200'
                  }`}
                />
              )}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

// ── Cancellable statuses ──────────────────────────────────────────────────────
const CANCELLABLE = new Set(['Payment Pending', 'Payment Confirmed', 'Pending', 'Confirmed'])

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MyOrdersPage() {
  const [orders, setOrders]               = useState<IOrder[]>([])
  const [loading, setLoading]             = useState(true)
  const [expanded, setExpanded]           = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)
  const [cancelling, setCancelling]       = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/orders/my')
      .then((r) => r.json())
      .then(({ data }) => { if (data) setOrders(data) })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false))
  }, [])

  const handleCancel = async (orderId: string) => {
    setCancelling(orderId)
    try {
      const res  = await fetch('/api/orders/cancel', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to cancel order'); return }
      setOrders((prev) => prev.map((o) =>
        o._id === orderId ? { ...o, status: 'Cancelled', cancelledByUser: true } : o,
      ))
      toast.success('Order cancelled.')
    } catch {
      toast.error('Failed to cancel order')
    } finally {
      setCancelling(null)
      setConfirmCancel(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="h-9 w-48 skeleton rounded-xl mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-36 skeleton rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <Package className="w-16 h-16 text-masala-300 mx-auto mb-4" />
        <h1 className="font-heading text-2xl font-bold text-masala-900 mb-2">No orders yet</h1>
        <p className="text-masala-500 mb-6">Start shopping to see your orders here.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-chili-600 text-white rounded-xl font-medium hover:bg-chili-700 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-heading text-3xl font-bold text-masala-900 mb-8">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => {
          const isOpen             = expanded === order._id
          const canCancel          = CANCELLABLE.has(order.status)
          const isConfirmingCancel = confirmCancel === order._id
          const payBadge           = paymentBadge(order.status)
          const statusLabel        = STATUS_LABEL[order.status] ?? order.status
          const statusBadgeCls     = STATUS_BADGE_CLASS[order.status] ?? 'bg-masala-100 text-masala-600'

          return (
            <div
              key={order._id}
              className={`bg-white dark:bg-masala-100 border rounded-2xl shadow-card overflow-hidden transition-colors ${
                order.status === 'Cancelled' ? 'border-chili-200 opacity-80' : 'border-masala-200'
              }`}
            >
              {/* ── Clickable header ── */}
              <button
                onClick={() => setExpanded(isOpen ? null : order._id)}
                className="w-full px-5 py-4 flex items-start justify-between text-left hover:bg-masala-50 dark:hover:bg-masala-200/40 transition-colors"
                aria-expanded={isOpen}
              >
                <div className="flex-1 min-w-0">
                  {/* Row 1: code / date / amount */}
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <div>
                      <p className="text-[10px] text-masala-400 uppercase tracking-wider font-medium">Order</p>
                      <p className="font-mono font-bold text-masala-900 text-sm">{order.verificationCode}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-masala-400 uppercase tracking-wider font-medium">Date</p>
                      <p className="text-sm font-medium text-masala-700">
                        {format(new Date(order.createdAt), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-masala-400 uppercase tracking-wider font-medium">Total</p>
                      <p className="text-sm font-bold text-chili-600">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Row 2: status badges — single badge when cancelled */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {order.status === 'Cancelled' ? (
                      <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border bg-chili-100 text-chili-700 border-chili-200">
                        {order.cancelledByUser ? 'Cancelled by you' : 'Cancelled'}
                      </span>
                    ) : (
                      <>
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${payBadge.cls}`}>
                          {payBadge.label}
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadgeCls}`}>
                          {statusLabel}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Chevron */}
                <div className="ml-3 mt-1 shrink-0 text-masala-400">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* ── Progress bar — always visible ── */}
              <div className="border-t border-masala-100">
                <OrderProgressBar status={order.status} />
              </div>

              {/* ── Expanded details ── */}
              {isOpen && (
                <div className="px-5 pb-5 border-t border-masala-100">

                  {/* Items */}
                  <div className="pt-4 space-y-2">
                    {order.items.map((item, i) => {
                      const unitPrice = item.price
                      const unitTax = item.tax ?? 0
                      const unitDelivery = item.deliveryCharge ?? 0
                      const productUnitTotal = unitPrice + unitTax
                      const productLineTotal = productUnitTotal * item.qty

                      return (
                        <div key={i} className="flex items-center justify-between text-sm gap-3">
                          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            <span className="text-masala-700 truncate">{item.name}</span>
                            {item.weight && (
                              <span className="text-xs font-medium text-saffron-600 bg-saffron-50 border border-saffron-200 rounded-full px-1.5 py-0.5 shrink-0">
                                {item.weight}
                              </span>
                            )}
                            <span className="text-masala-500 shrink-0">× {item.qty}</span>
                            {unitTax > 0 && (
                              <span className="text-[10px] text-masala-400 font-normal">
                                (Includes ₹{(unitTax * item.qty).toLocaleString('en-IN')} Tax)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-masala-900 font-medium">₹{productLineTotal.toLocaleString('en-IN')}</span>
                            {order.status === 'Delivered' && (
                              <Link
                                href={`/products/${item.productId}#reviews`}
                                className="text-xs text-saffron-600 hover:text-saffron-700 font-semibold underline-offset-2 hover:underline transition-colors"
                              >
                                Review
                              </Link>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <hr className="my-3 border-masala-100" />

                  {/* Order Totals Breakout */}
                  <div className="text-xs text-masala-600 space-y-1 mb-4 bg-masala-50 dark:bg-masala-200/40 p-3.5 rounded-xl">
                    <div className="flex justify-between">
                      <span>Products Price Total:</span>
                      <span className="font-semibold text-masala-900">₹{(order.productsPriceTotal ?? order.totalAmount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax Total:</span>
                      <span className="font-semibold text-masala-900">₹{(order.taxTotal ?? 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Total:</span>
                      <span className="font-semibold text-masala-900">
                        {(order.deliveryTotal ?? 0) > 0 ? `₹${(order.deliveryTotal ?? 0).toLocaleString('en-IN')}` : 'Free'}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-masala-200 pt-1.5 font-bold text-sm text-masala-950">
                      <span>Final Total:</span>
                      <span className="text-chili-600">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Delivery address */}
                  <div className="text-sm text-masala-600 mb-4">
                    <p className="font-medium text-masala-900 mb-1">Delivery Address</p>
                    <p className="leading-relaxed whitespace-pre-wrap">{order.deliveryAddress}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    {canCancel && !isConfirmingCancel && (
                      <button
                        onClick={() => setConfirmCancel(order._id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-chili-200 text-chili-600 hover:bg-chili-50 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel Order
                      </button>
                    )}

                    {isConfirmingCancel && (
                      <div className="flex items-center gap-2 bg-chili-50 border border-chili-200 rounded-xl px-4 py-2">
                        <AlertTriangle className="w-4 h-4 text-chili-600 shrink-0" />
                        <span className="text-sm text-chili-700 font-medium">Cancel this order?</span>
                        <button
                          onClick={() => handleCancel(order._id)}
                          disabled={cancelling === order._id}
                          className="ml-1 px-3 py-1 bg-chili-600 text-white text-xs font-bold rounded-lg hover:bg-chili-700 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                        >
                          {cancelling === order._id && <Loader2 className="w-3 h-3 animate-spin" />}
                          Yes, Cancel
                        </button>
                        <button
                          onClick={() => setConfirmCancel(null)}
                          className="px-3 py-1 text-xs font-semibold text-masala-600 hover:text-masala-900 transition-colors"
                        >
                          Keep Order
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
