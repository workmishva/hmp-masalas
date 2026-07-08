import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Product from '@/models/Product'
import Order from '@/models/Order'
import User from '@/models/User'
import { subDays, startOfDay, format } from 'date-fns'
import { formatIST } from '@/lib/formatDate'

// Active orders = verified + not archived by a previous admin reset.
// Archived orders are still owned by their users (visible in My Orders)
// but excluded from all admin dashboard figures.
const ACTIVE = { isVerified: true, archivedAt: { $exists: false } } as const

// Revenue-bearing orders: active orders whose status is not Cancelled.
// Cancelled orders are real transactions (verified, stock decremented) but
// the customer did not receive goods, so they must never appear in revenue totals.
const REVENUE = { ...ACTIVE, status: { $ne: 'Cancelled' } } as const

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await connectDB()

    const [totalProducts, totalOrders, totalUsers, pendingOrders, revenueResult] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(ACTIVE),
      User.countDocuments({ role: 'enduser' }),
      Order.countDocuments({ ...ACTIVE, status: 'Pending' }),
      Order.aggregate([
        { $match: REVENUE },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ])

    const totalRevenue = revenueResult[0]?.total ?? 0

    // Last 7 days daily revenue (active orders only)
    const sevenDaysAgo = startOfDay(subDays(new Date(), 6))
    const dailyOrders  = await Order.aggregate([
      {
        $match: {
          ...REVENUE,
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id:     { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          count:   { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    const dailyMap: Record<string, { revenue: number; count: number }> = {}
    dailyOrders.forEach((d) => { dailyMap[d._id] = { revenue: d.revenue, count: d.count } })

    const chartData = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i)
      const key  = format(date, 'yyyy-MM-dd')
      return {
        date:    formatIST(date, 'MMM d', true),
        revenue: dailyMap[key]?.revenue ?? 0,
        orders:  dailyMap[key]?.count   ?? 0,
      }
    })

    // Recent 5 active orders
    const recentOrders = await Order.find(ACTIVE)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name email')
      .lean()

    return NextResponse.json({
      data: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue,
        pendingOrders,
        chartData,
        recentOrders: JSON.parse(JSON.stringify(recentOrders)),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
