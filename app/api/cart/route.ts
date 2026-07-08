import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Cart from '@/models/Cart'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()

    // Lazily expire pending checkout data older than 48 h
    await Cart.updateOne(
      { userId: session.user.id, pendingExpiry: { $lt: new Date() } },
      { $unset: { pendingCode: '', pendingAddress: '', pendingExpiry: '', pendingTotal: '', pendingProductsPriceTotal: '', pendingDeliveryTotal: '', pendingTaxTotal: '' } },
    )

    const cart = await Cart.findOne({ userId: session.user.id })
      .populate('items.productId', 'name images stock isActive category weights')
      .lean()

    return NextResponse.json({ data: cart ?? { items: [] } })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
  }
}
