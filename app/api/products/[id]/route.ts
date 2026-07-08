import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Product from '@/models/Product'

const updateSchema = z.object({
  name:        z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  stock:       z.number().min(0).optional(),
  category:    z.string().min(2).optional(),
  images:      z.array(z.string()).optional(),
  isActive:    z.boolean().optional(),
  isFeatured:  z.boolean().optional(),
  weights: z.array(z.object({
    weight:    z.string().min(1),
    price:     z.number().min(0),
    subtitle:  z.string().optional().default(''),
    isDefault: z.boolean().optional().default(false),
    isActive:  z.boolean().optional().default(true),
    deliveryCharge: z.number().min(0).optional().default(0),
    tax:         z.number().min(0).max(100).optional().default(0),
    description: z.string().optional().default(''),
  })).optional(),
})

// GET /api/products/:id — public
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectDB()
    const product = await Product.findById(id).lean()
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    return NextResponse.json({ data: JSON.parse(JSON.stringify(product)) })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

// PUT /api/products/:id — admin only
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body   = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }

    await connectDB()
    const product = await Product.findByIdAndUpdate(id, { $set: parsed.data }, { returnDocument: 'after' }).lean()
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    return NextResponse.json({ data: JSON.parse(JSON.stringify(product)) })
  } catch {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// DELETE /api/products/:id — admin only
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    await connectDB()
    const product = await Product.findByIdAndDelete(id)
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    return NextResponse.json({ data: { message: 'Product deleted' } })
  } catch {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
