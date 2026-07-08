import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Cart from '@/models/Cart'
import Product from '@/models/Product'
import Settings from '@/models/Settings'
import { generateOrderCode, buildWhatsAppUrl } from '@/lib/whatsapp'

const schema = z.object({
  deliveryAddress: z.string().min(10, 'Address must be at least 10 characters'),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
  }

  const { deliveryAddress } = parsed.data

  try {
    await connectDB()

    const cart = await Cart.findOne({ userId: session.user.id })
      .populate('items.productId', 'name stock isActive weights')

    if (!cart || !cart.items.length) {
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 })
    }

    // Validate stock without decrementing (decrement happens at confirm)
    let productsPriceTotal = 0
    let deliveryTotal = 0
    let taxTotal = 0

    for (const item of cart.items) {
      const product = item.productId as unknown as {
        _id: { toString(): string }; name: string; stock: number; isActive: boolean; weights?: any[]
      }
      const cartItem       = item as unknown as { weightPrice?: number; weight?: string; deliveryCharge?: number; tax?: number }
      
      let effectivePrice = 0
      let itemDeliveryCharge = 0
      let itemTaxPercent = 0

      // Match current product model state from DB
      let variant = cartItem.weight ? product.weights?.find(w => w.weight === cartItem.weight) : null
      if (!variant) {
        // Fallback to default variant
        variant = product.weights?.find(w => w.isDefault && w.isActive !== false) ?? product.weights?.find(w => w.isActive !== false)
      }

      if (variant) {
        effectivePrice = variant.price
        itemDeliveryCharge = variant.deliveryCharge ?? 0
        itemTaxPercent = variant.tax ?? 0
      }

      if (!product?.isActive) {
        return NextResponse.json({ error: 'A product in your cart is no longer available' }, { status: 400 })
      }
      if (product.stock < item.qty) {
        return NextResponse.json(
          { error: `${product.name} only has ${product.stock} in stock` },
          { status: 400 },
        )
      }

      const calculatedTaxAmount = effectivePrice * (itemTaxPercent / 100)

      productsPriceTotal += effectivePrice * item.qty
      deliveryTotal += itemDeliveryCharge * item.qty
      taxTotal += calculatedTaxAmount * item.qty
    }

    const totalAmount = productsPriceTotal + deliveryTotal + taxTotal

    // Generate friendly order code and set 48-hour expiry
    const verificationCode = generateOrderCode()
    const pendingExpiry    = new Date(Date.now() + 48 * 60 * 60 * 1000)

    // Store pending checkout data in cart — order is NOT created yet
    await Cart.updateOne(
      { userId: session.user.id },
      {
        $set: {
          pendingCode:    verificationCode,
          pendingAddress: deliveryAddress,
          pendingExpiry,
          pendingTotal:   totalAmount,
          pendingProductsPriceTotal: productsPriceTotal,
          pendingDeliveryTotal:      deliveryTotal,
          pendingTaxTotal:           taxTotal,
        },
      },
    )

    // Build WhatsApp URL
    const settings    = await Settings.findOne().lean()
    const whatsappNum = settings?.whatsappNumber ?? process.env.WHATSAPP_NUMBER ?? ''
    const whatsappUrl = buildWhatsAppUrl(whatsappNum, verificationCode, {
      productsPriceTotal,
      taxTotal,
      deliveryTotal,
      grandTotal: totalAmount,
    })

    return NextResponse.json({
      data: { verificationCode, whatsappUrl, totalAmount, productsPriceTotal, deliveryTotal, taxTotal },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 })
  }
}
