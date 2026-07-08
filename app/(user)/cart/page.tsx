'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/context/CartContext'

interface CartProduct {
  _id: string
  name: string
  images: string[]
  stock: number
  category: string
  weights?: any[]
}

interface CartItem {
  productId:   CartProduct
  qty:         number
  weight?:     string
  weightPrice?: number
  deliveryCharge?: number
  tax?: number
}

interface CartData {
  items: CartItem[]
}

export default function CartPage() {
  const { refresh }                     = useCart()
  const [cart, setCart]                 = useState<CartData | null>(null)
  const [loading, setLoading]           = useState(true)
  const [updating, setUpdating]         = useState<string | null>(null)

  const itemKey = (item: CartItem) => `${item.productId._id}-${item.weight ?? ''}`

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cart')
      if (res.ok) {
        const { data } = await res.json()
        setCart(data)
      }
    } catch {
      toast.error('Failed to load cart')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCart() }, [fetchCart])

  const updateQty = async (productId: string, qty: number, weight?: string) => {
    const key = `${productId}-${weight ?? ''}`
    setUpdating(key)
    try {
      const res = await fetch('/api/cart/update', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ productId, qty, weight }),
      })
      if (res.ok) {
        await fetchCart()
        await refresh()
      } else {
        const data = await res.json()
        toast.error(data.error ?? 'Failed to update')
      }
    } catch {
      toast.error('Failed to update')
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (productId: string, weight?: string) => {
    const key = `${productId}-${weight ?? ''}`
    setUpdating(key)
    try {
      const res = await fetch('/api/cart/remove', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ productId, weight }),
      })
      if (res.ok) {
        await fetchCart()
        await refresh()
        toast.success('Item removed')
      }
    } catch {
      toast.error('Failed to remove item')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="h-9 w-40 skeleton rounded-xl mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
          </div>
          <div className="h-64 skeleton rounded-2xl" />
        </div>
      </div>
    )
  }

  const items = cart?.items ?? []
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0)

  let productsPriceTotal = 0
  let deliveryTotal = 0
  let taxTotal = 0

  items.forEach((item) => {
    const variant = item.productId.weights?.find(w => w.weight === item.weight) ?? item.productId.weights?.find(w => w.isDefault && w.isActive !== false) ?? item.productId.weights?.find(w => w.isActive !== false)
    const unitPrice = variant ? variant.price : (item.weightPrice ?? 0)
    const unitDelivery = variant ? (variant.deliveryCharge ?? 0) : (item.deliveryCharge ?? 0)
    const taxPercent = variant ? (variant.tax ?? 0) : 0
    const unitTax = unitPrice * (taxPercent / 100)

    productsPriceTotal += unitPrice * item.qty
    deliveryTotal += unitDelivery * item.qty
    taxTotal += unitTax * item.qty
  })

  const finalTotal = productsPriceTotal + deliveryTotal + taxTotal

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-masala-300 mx-auto mb-4" />
        <h1 className="font-heading text-2xl font-bold text-masala-900 mb-2">Your cart is empty</h1>
        <p className="text-masala-500 mb-6">Add some masalas and come back!</p>
        <Link href="/products">
          <Button>Browse Products</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="font-heading text-3xl font-bold text-masala-900 mb-8">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const p          = item.productId
            const key        = itemKey(item)
            const isUpdating = updating === key
            const variant = p.weights?.find(w => w.weight === item.weight) ?? p.weights?.find(w => w.isDefault && w.isActive !== false) ?? p.weights?.find(w => w.isActive !== false)
            const unitPrice = variant ? variant.price : (item.weightPrice ?? 0)
            const unitDelivery = variant ? (variant.deliveryCharge ?? 0) : (item.deliveryCharge ?? 0)
            const taxPercent = variant ? (variant.tax ?? 0) : 0
            const unitTax = unitPrice * (taxPercent / 100)
            const productUnitTotal = unitPrice + unitTax
            const productLineTotal = productUnitTotal * item.qty

            return (
              <div
                key={key}
                className={`bg-white border border-masala-200 rounded-2xl p-4 flex gap-4 shadow-card transition-opacity ${isUpdating ? 'opacity-50' : ''}`}
              >
                {/* Image */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-masala-100 shrink-0">
                  {p.images[0] ? (
                    <Image
                      src={p.images[0]}
                      alt={p.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🌶️</div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <p className="text-[11px] text-saffron-600 font-semibold uppercase tracking-wider">{p.category}</p>
                        {item.weight && (
                          <span className="text-[10px] font-bold bg-saffron-100 text-saffron-700 px-1.5 py-0.5 rounded-full">
                            {item.weight}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/products/${p._id}`}
                        className="font-semibold text-masala-900 hover:text-saffron-600 transition-colors leading-snug"
                      >
                        {p.name}
                      </Link>
                      <div className="text-xs text-masala-500 mt-0.5">
                        <span>₹{productUnitTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each</span>
                        {unitTax > 0 && (
                          <span className="text-[10px] text-masala-400 block font-normal">
                            (Base: ₹{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} + Tax: ₹{unitTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="font-bold text-chili-600 text-lg shrink-0">
                      ₹{productLineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center border border-masala-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => updateQty(p._id, item.qty - 1, item.weight)}
                        disabled={isUpdating || item.qty <= 1}
                        className="w-8 h-8 flex items-center justify-center text-masala-600 hover:bg-masala-100 disabled:opacity-40 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold text-masala-900">{item.qty}</span>
                      <button
                        onClick={() => updateQty(p._id, item.qty + 1, item.weight)}
                        disabled={isUpdating || item.qty >= p.stock}
                        className="w-8 h-8 flex items-center justify-center text-masala-600 hover:bg-masala-100 disabled:opacity-40 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(p._id, item.weight)}
                      disabled={isUpdating}
                      className="flex items-center gap-1.5 text-sm text-chili-600 hover:text-chili-700 disabled:opacity-40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Order summary */}
        <div>
          <div className="bg-white border border-masala-200 rounded-2xl p-6 shadow-card sticky top-24">
            <h2 className="font-heading font-bold text-masala-900 text-lg mb-4">Order Summary</h2>

            <div className="space-y-2.5 mb-5">
              <div className="flex justify-between text-sm text-masala-600">
                <span>Products Price Total ({totalQty} {totalQty === 1 ? 'item' : 'items'})</span>
                <span>₹{productsPriceTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm text-masala-600">
                <span>Tax Total</span>
                <span>₹{taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm text-masala-600">
                <span>Delivery Total</span>
                <span className={deliveryTotal > 0 ? 'text-masala-600' : 'text-cardamom-600 font-medium'}>
                  {deliveryTotal > 0 ? `₹${deliveryTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Free'}
                </span>
              </div>
              <hr className="border-masala-200" />
              <div className="flex justify-between font-bold text-masala-900">
                <span>Grand Total</span>
                <span className="text-chili-600 text-xl">₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <Link href="/checkout" className="block">
              <Button size="lg" className="w-full gap-2">
                Proceed to Checkout
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>

            <Link
              href="/products"
              className="block text-center text-sm text-masala-500 hover:text-saffron-600 transition-colors mt-3"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
