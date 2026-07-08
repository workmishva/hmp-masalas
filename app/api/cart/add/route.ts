import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Cart from '@/models/Cart'
import Product from '@/models/Product'

const schema = z.object({
  productId:   z.string().min(1),
  qty:         z.number().int().min(1).max(100),
  weight:      z.string().optional(),
  weightPrice: z.number().positive().optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body   = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
  }

  const { productId, qty, weight, weightPrice } = parsed.data

  try {
    await connectDB()

    const product = await Product.findById(productId)
    if (!product || !product.isActive) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    let cart = await Cart.findOne({ userId: session.user.id })
    if (!cart) {
      cart = new Cart({ userId: session.user.id, items: [] })
    }

    let resolvedWeight = weight
    let itemPrice = 0
    let itemDeliveryCharge = 0
    let itemTaxPercent = 0

    // Find the variant
    let variant = weight ? product.weights?.find(w => w.weight === weight) : null
    if (!variant) {
      // Fallback to default active variant
      variant = product.weights?.find(w => w.isDefault && w.isActive !== false) ?? product.weights?.find(w => w.isActive !== false)
      if (variant) {
        resolvedWeight = variant.weight
      }
    }

    if (variant) {
      itemPrice = variant.price
      itemDeliveryCharge = variant.deliveryCharge ?? 0
      itemTaxPercent = variant.tax ?? 0
    }

    const calculatedTaxAmount = itemPrice * (itemTaxPercent / 100)

    // Same product in a different weight = separate cart line
    const existing = cart.items.find(
      (i) =>
        i.productId.toString() === productId &&
        (i.weight ?? undefined) === (resolvedWeight ?? undefined)
    )

    if (existing) {
      const newQty = existing.qty + qty
      if (newQty > product.stock) {
        return NextResponse.json({ error: `Only ${product.stock} in stock` }, { status: 400 })
      }
      existing.qty = newQty
      // Keep price, deliveryCharge, and tax updated just in case
      existing.weightPrice = itemPrice
      existing.deliveryCharge = itemDeliveryCharge
      existing.tax = calculatedTaxAmount
    } else {
      if (qty > product.stock) {
        return NextResponse.json({ error: `Only ${product.stock} in stock` }, { status: 400 })
      }
      cart.items.push({
        productId: product._id,
        qty,
        weight: resolvedWeight,
        weightPrice: itemPrice,
        deliveryCharge: itemDeliveryCharge,
        tax: calculatedTaxAmount,
      } as never)
    }

    await cart.save()
    const totalItems = cart.items.reduce((sum, i) => sum + i.qty, 0)
    return NextResponse.json({ data: { totalItems } })
  } catch {
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 })
  }
}
