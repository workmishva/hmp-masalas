'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { IOrder, OrderStatus } from '@/types'

type OrderWithUser = Omit<IOrder, 'userId'> & {
  userId: { name: string; email: string; phone: string } | string
}

const ALL_STATUSES: OrderStatus[] = ['Payment Pending', 'Payment Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled']

const statusColors: Record<string, string> = {
  'Payment Pending':   'bg-yellow-100 text-yellow-700',
  'Payment Confirmed': 'bg-blue-100 text-blue-700',
  'Packed':            'bg-purple-100 text-purple-700',
  'Shipped':           'bg-indigo-100 text-indigo-700',
  'Delivered':         'bg-cardamom-100 text-cardamom-700',
  'Cancelled':         'bg-chili-100 text-chili-700',
  // Legacy values for existing DB documents
  'Pending':           'bg-yellow-100 text-yellow-700',
  'Confirmed':         'bg-blue-100 text-blue-700',
}

export default function AdminOrdersPage() {
  const [orders, setOrders]       = useState<OrderWithUser[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState<string>('all')
  const [search, setSearch]       = useState('')
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [updating, setUpdating]   = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/orders/all')
      .then((r) => r.json())
      .then(({ data }) => { if (data) setOrders(data) })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setUpdating(orderId)
    try {
      const res  = await fetch('/api/orders/status', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderId, status }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to update'); return }
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status } : o))
      toast.success(`Status updated to ${status}`)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdating(null)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((o) => {
      if (filter !== 'all' && o.status !== filter) return false
      if (!q) return true
      const user = typeof o.userId === 'object' ? o.userId : null
      return (
        o.verificationCode.toLowerCase().includes(q) ||
        (user?.name.toLowerCase().includes(q) ?? false) ||
        (user?.email.toLowerCase().includes(q) ?? false) ||
        o._id.toLowerCase().includes(q)
      )
    })
  }, [orders, filter, search])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-9 w-48 skeleton rounded-xl" />
        {[1,2,3,4].map(i => <div key={i} className="h-16 skeleton rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-masala-900">Orders</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-masala-200 bg-white dark:bg-masala-100 text-sm font-medium text-masala-700 hover:bg-masala-50 dark:hover:bg-masala-200 transition-colors"
          >
            ← Back to Store
          </Link>
          <span className="text-sm text-masala-500">{filtered.length} of {orders.length}</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-masala-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order code, customer name or email…"
          className="w-full h-10 pl-10 pr-10 border border-masala-200 rounded-xl bg-white text-sm text-masala-900 placeholder:text-masala-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40 focus:border-saffron-500 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-masala-400 hover:text-masala-700 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', ...ALL_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-chili-600 text-white'
                : 'bg-white border border-masala-200 text-masala-600 hover:bg-masala-50'
            }`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-masala-500">No orders in this category</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const user    = typeof order.userId === 'object' ? order.userId : null
            const isOpen  = expanded === order._id
            const isBusy  = updating === order._id

            return (
              <div
                key={order._id}
                className="bg-white border border-masala-200 rounded-2xl shadow-card overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : order._id)}
                  className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-masala-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="font-mono font-bold text-masala-900 text-sm">{order.verificationCode}</span>
                    <span className="text-sm text-masala-600">{user?.name ?? '—'}</span>
                    <span className="text-sm font-bold text-chili-600">
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </span>
                    {order.cancelledByUser ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-900/10 text-red-800 border border-red-800/20">
                        User Cancelled
                      </span>
                    ) : (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[order.status] ?? 'bg-masala-100 text-masala-600'}`}>
                        {order.status}
                      </span>
                    )}
                    {!order.isVerified && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">
                        Unverified
                      </span>
                    )}
                    <span className="text-xs text-masala-400">
                      {format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')}
                    </span>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-masala-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-masala-400 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 border-t border-masala-100 pt-4 space-y-4">
                    {/* Customer info */}
                    {user && (
                      <div className="text-sm text-masala-600 space-y-0.5">
                        <p><strong>Customer:</strong> {user.name}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Phone:</strong> {user.phone}</p>
                      </div>
                    )}

                    {/* Items */}
                    <div className="space-y-1.5">
                      {order.items.map((item, i) => {
                        const unitPrice = item.price
                        const unitTax = item.tax ?? 0
                        const productUnitTotal = unitPrice + unitTax
                        const productLineTotal = productUnitTotal * item.qty
                        return (
                          <div key={i} className="flex justify-between text-sm gap-3">
                            <span className="text-masala-700">
                              {item.name}
                              {item.weight && (
                                <span className="ml-1.5 text-xs font-medium text-saffron-600 bg-saffron-50 border border-saffron-200 rounded-full px-1.5 py-0.5">
                                  {item.weight}
                                </span>
                              )}
                              {' '}× {item.qty}
                              {unitTax > 0 && (
                                <span className="ml-1.5 text-[10px] text-masala-400 font-normal">
                                  (Includes ₹{(unitTax * item.qty).toLocaleString('en-IN')} Tax)
                                </span>
                              )}
                            </span>
                            <span className="text-masala-900 font-medium shrink-0">₹{productLineTotal.toLocaleString('en-IN')}</span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Order Totals Breakout */}
                    <div className="text-xs text-masala-600 space-y-1 bg-masala-50 p-3 rounded-xl max-w-sm">
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

                    <div className="text-sm text-masala-600">
                      <p className="font-medium text-masala-900 mb-1">Delivery Address</p>
                      <p className="whitespace-pre-wrap">{order.deliveryAddress}</p>
                    </div>

                    {/* Status update */}
                    <div>
                      <label className="block text-xs font-semibold text-masala-500 uppercase tracking-wider mb-2">
                        Update Status
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {ALL_STATUSES.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(order._id, s)}
                            disabled={isBusy || order.status === s}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-40 ${
                              order.status === s
                                ? 'bg-masala-900 text-white cursor-default'
                                : 'border border-masala-200 text-masala-700 hover:bg-masala-100'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
