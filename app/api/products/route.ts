import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Product from '@/models/Product'

const createSchema = z.object({
  name:        z.string().min(2),
  description: z.string().min(10),
  stock:       z.number().min(0),
  category:    z.string().min(2),
  images:      z.array(z.string()).optional().default([]),
  isActive:    z.boolean().optional().default(true),
  isFeatured:  z.boolean().optional().default(false),
  weights: z.array(z.object({
    weight:    z.string().min(1),
    price:     z.number().min(0),
    subtitle:  z.string().optional().default(''),
    isDefault: z.boolean().optional().default(false),
    isActive:  z.boolean().optional().default(true),
    deliveryCharge: z.number().min(0).optional().default(0),
    tax:         z.number().min(0).max(100).optional().default(0),
    description: z.string().optional().default(''),
  })).min(1, 'At least one weight variant is required'),
})

// GET /api/products — public, supports ?q=&category=&sort=&page=&limit=&isActive=
export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = req.nextUrl
    const q        = searchParams.get('q') ?? ''
    const category = searchParams.get('category') ?? ''
    const sort     = searchParams.get('sort') ?? 'createdAt_desc'
    const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit    = Math.min(24, parseInt(searchParams.get('limit') ?? '12'))
    const isAdminReq = searchParams.get('all') === '1'

    // Only admin can see inactive products
    const session = isAdminReq ? await auth() : null
    const showAll = isAdminReq && session?.user?.role === 'admin'

    const filter: Record<string, unknown> = {}
    if (!showAll) filter.isActive = true
    if (category) filter.category = category
    if (q) filter.$text = { $search: q }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      createdAt_desc: { createdAt: -1 },
      createdAt_asc:  { createdAt:  1 },
    }
    const sortObj = sortMap[sort] ?? { createdAt: -1 }

    let products
    let total

    if (sort === 'price_asc' || sort === 'price_desc') {
      const aggResult = await Promise.all([
        Product.aggregate([
          { $match: filter },
          {
            $addFields: {
              defaultWeight: {
                $filter: {
                  input: '$weights',
                  as: 'w',
                  cond: { $and: [ { $eq: ['$$w.isDefault', true] }, { $ne: ['$$w.isActive', false] } ] }
                }
              }
            }
          },
          {
            $addFields: {
              defaultWeight: {
                $cond: {
                  if: { $gt: [{ $size: '$defaultWeight' }, 0] },
                  then: { $arrayElemAt: ['$defaultWeight', 0] },
                  else: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$weights',
                          as: 'w',
                          cond: { $ne: ['$$w.isActive', false] }
                        }
                      },
                      0
                    ]
                  }
                }
              }
            }
          },
          {
            $addFields: {
              sortPrice: { $ifNull: ['$defaultWeight.price', 0] }
            }
          },
          { $sort: { sortPrice: sort === 'price_asc' ? 1 : -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit }
        ]),
        Product.countDocuments(filter)
      ])
      products = aggResult[0]
      total = aggResult[1]
    } else {
      const findResult = await Promise.all([
        Product.find(filter).sort(sortObj).skip((page - 1) * limit).limit(limit).lean(),
        Product.countDocuments(filter),
      ])
      products = findResult[0]
      total = findResult[1]
    }

    return NextResponse.json({
      data: JSON.parse(JSON.stringify(products)),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST /api/products — admin only
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body   = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }

    await connectDB()
    const product = await Product.create(parsed.data)
    return NextResponse.json({ data: JSON.parse(JSON.stringify(product)) }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
