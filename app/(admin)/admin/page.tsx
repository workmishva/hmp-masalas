'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  Package, ShoppingBag, Users, TrendingUp, Clock, RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ChartPoint  { date: string; revenue: number; orders: number }
interface RecentOrder {
  _id: string
  verificationCode: string
  totalAmount: number
  status: string
  isVerified: boolean
  createdAt: string
  userId: { name: string; email: string } | null
}

interface Stats {
  totalProducts: number
  totalOrders:   number
  totalUsers:    number
  totalRevenue:  number
  pendingOrders: number
  chartData:     ChartPoint[]
  recentOrders:  RecentOrder[]
}

const statusColors: Record<string, string> = {
  Pending:   'bg-yellow-100 text-yellow-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  Packed:    'bg-purple-100 text-purple-700',
  Shipped:   'bg-indigo-100 text-indigo-700',
  Delivered: 'bg-cardamom-100 text-cardamom-700',
  Cancelled: 'bg-chili-100 text-chili-700',
}

function StatCard({
  label, value, icon: Icon, color, sub,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  sub?: string
}) {
  return (
    <div className="bg-white dark:bg-masala-100 border border-masala-200 rounded-2xl p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-masala-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-masala-900">{value}</p>
          {sub && <p className="text-xs text-masala-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats]     = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadStats = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true)
    else setLoading(true)
    try {
      const r = await fetch('/api/admin/stats')
      const { data } = await r.json()
      if (data) setStats(data)
      if (showRefreshIndicator) toast.success('Dashboard refreshed')
    } catch {
      toast.error('Failed to load stats')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-masala-900">Dashboard</h1>
          <p className="text-sm text-masala-500">Welcome back — here&apos;s what&apos;s happening.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-masala-200 bg-white dark:bg-masala-100 text-sm font-medium text-masala-700 hover:bg-masala-50 dark:hover:bg-masala-200 transition-colors"
          >
            ← Back to Store
          </Link>
          <button
            onClick={() => loadStats(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-masala-200 bg-white dark:bg-masala-100 text-sm font-medium text-masala-700 hover:bg-masala-50 transition-colors disabled:opacity-50"
            aria-label="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Products"
          value={stats.totalProducts}
          icon={Package}
          color="bg-chili-100 text-chili-600"
        />
        <StatCard
          label="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingBag}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="Customers"
          value={stats.totalUsers}
          icon={Users}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          label="Revenue"
          value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
          icon={TrendingUp}
          color="bg-cardamom-100 text-cardamom-600"
          sub="From verified orders"
        />
        <StatCard
          label="Pending"
          value={stats.pendingOrders}
          icon={Clock}
          color="bg-yellow-100 text-yellow-600"
          sub="Need attention"
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-masala-100 border border-masala-200 rounded-2xl p-5 shadow-card">
        <h2 className="font-heading font-semibold text-masala-900 mb-4">Revenue — Last 7 Days</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={stats.chartData} margin={{ top: 0, right: 0, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#78716C' }} />
            <YAxis tick={{ fontSize: 12, fill: '#78716C' }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #E7E5E4', fontSize: 13 }}
              formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
            />
            <Bar dataKey="revenue" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-masala-100 border border-masala-200 rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-masala-100">
          <h2 className="font-heading font-semibold text-masala-900">Recent Orders</h2>
        </div>
        <div className="divide-y divide-masala-100">
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-masala-500 text-center py-8">No verified orders yet</p>
          ) : (
            stats.recentOrders.map((order) => (
              <div key={order._id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-mono font-semibold text-masala-900">{order.verificationCode}</p>
                  <p className="text-xs text-masala-500">
                    {order.userId?.name ?? 'Guest'} · {format(new Date(order.createdAt), 'dd MMM, HH:mm')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-chili-600">
                    ₹{order.totalAmount.toLocaleString('en-IN')}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[order.status] ?? 'bg-masala-100 text-masala-600'}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
