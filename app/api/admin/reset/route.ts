export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { subDays } from 'date-fns'
import { formatIST } from '@/lib/formatDate'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Order from '@/models/Order'
import Settings from '@/models/Settings'
import { generateResetReportPDF } from '@/lib/pdf-report'


export async function POST() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await connectDB()

    // Gather analytics before reset
    const settings = await Settings.findOne().lean()
    const periodFrom = settings?.lastResetAt ?? null
    const periodTo   = new Date()

    // Only gather and archive the current active (non-archived) verified orders.
    // Previously archived orders from past resets are intentionally excluded.
    const [orders] = await Promise.all([
      Order.find({ isVerified: true, archivedAt: { $exists: false } })
        .populate('userId', 'name email')
        .lean(),
    ])

    const totalOrders = orders.length

    // Revenue-bearing orders: exclude Cancelled (same rule as the dashboard).
    const revenueOrders = orders.filter((o) => o.status !== 'Cancelled')
    const totalRevenue  = revenueOrders.reduce((s, o) => s + o.totalAmount, 0)

    // Status breakdown (all orders — shows how many were cancelled vs delivered etc.)
    const statusMap: Record<string, number> = {}
    for (const o of orders) {
      statusMap[o.status] = (statusMap[o.status] ?? 0) + 1
    }
    const statusBreakdown = Object.entries(statusMap).map(([status, count]) => ({ status, count }))

    // Top products by revenue — cancelled orders excluded
    const productMap: Record<string, { name: string; qty: number; revenue: number }> = {}
    for (const o of revenueOrders) {
      for (const item of o.items) {
        const key = item.name
        if (!productMap[key]) productMap[key] = { name: item.name, qty: 0, revenue: 0 }
        productMap[key].qty     += item.qty
        productMap[key].revenue += item.price * item.qty
      }
    }
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Daily summary for last 14 days — revenue from non-cancelled orders only
    const dailyMap: Record<string, { orders: number; revenue: number }> = {}
    for (let d = 13; d >= 0; d--) {
      dailyMap[formatIST(subDays(periodTo, d), 'dd MMM', true)] = { orders: 0, revenue: 0 }
    }
    for (const o of revenueOrders) {
      const day = formatIST(o.createdAt, 'dd MMM', true)
      if (dailyMap[day]) {
        dailyMap[day].orders  += 1
        dailyMap[day].revenue += o.totalAmount
      }
    }
    const dailySummary = Object.entries(dailyMap).map(([date, d]) => ({ date, ...d }))

    // Generate PDF
    const pdfBuffer = generateResetReportPDF({
      generatedAt:     new Date(),
      periodFrom,
      periodTo,
      totalOrders,
      totalRevenue,
      topProducts,
      statusBreakdown,
      dailySummary,
    })

    // Archive active verified orders instead of deleting them.
    // Users will still see these orders in My Orders; they are hidden from
    // admin stats, the orders list, and future exports.
    const archiveTimestamp = new Date()
    await Promise.all([
      Order.updateMany(
        { isVerified: true, archivedAt: { $exists: false } },
        { $set: { archivedAt: archiveTimestamp } },
      ),
      Settings.findOneAndUpdate(
        {},
        { lastResetAt: archiveTimestamp },
        { upsert: true, returnDocument: 'after' }
      ),
    ])

    const filename = `hmp-reset-report-${formatIST(new Date(), 'yyyy-MM-dd', true)}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Reset-Complete':    '1',
      },
    })
  } catch (err) {
    console.error('Reset failed:', err)
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 })
  }
}
