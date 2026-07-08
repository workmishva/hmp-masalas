export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { formatIST } from '@/lib/formatDate'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Order from '@/models/Order'
import { generateOrdersExcelBuffer } from '@/lib/excel'


export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await connectDB()

    // Export only active (non-archived) verified orders.
    // Archived orders were cleared by a previous admin reset and are excluded.
    const orders = await Order.find({ isVerified: true, archivedAt: { $exists: false } })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .lean()

    const rows = orders.map((o) => {
      const user = o.userId as unknown as { name?: string; email?: string } | null
      return {
        orderId:          `HMP-${o._id.toString().slice(-8).toUpperCase()}`,
        verificationCode: o.verificationCode,
        customerName:     user?.name ?? 'Unknown',
        customerEmail:    user?.email ?? 'Unknown',
        items:            o.items.map((i) => `${i.name} x${i.qty}`).join(', '),
        totalAmount:      o.totalAmount,
        deliveryAddress:  o.deliveryAddress,
        status:           o.status,
        placedAt:         formatIST(o.createdAt, 'dd MMM yyyy HH:mm'),
      }
    })

    const buffer = generateOrdersExcelBuffer(rows)
    const filename = `hmp-orders-${formatIST(new Date(), 'yyyy-MM-dd', true)}.xlsx`

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 })
  }
}
