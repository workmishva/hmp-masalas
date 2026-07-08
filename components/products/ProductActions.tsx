'use client'

import { useState } from 'react'
import { Check, Minus, Plus, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/context/CartContext'
import type { IProductWeight } from '@/types'

interface ProductActionsProps {
  productId:   string
  productName: string
  maxStock:    number
  weights?:    IProductWeight[]
}

export function ProductActions({
  productId, productName, maxStock, weights = [],
}: ProductActionsProps) {
  const { refresh } = useCart()

  // Only show weights that are explicitly active (undefined → treated as active for back-compat)
  const activeWeights = weights.filter(w => w.isActive !== false)

  // Default: weight with isDefault flag → else first active → else null
  const defaultWeight = activeWeights.find(w => w.isDefault) ?? activeWeights[0] ?? null

  const [selectedWeight, setSelectedWeight] = useState<IProductWeight | null>(defaultWeight)
  const [qty, setQty]         = useState(1)
  const [loading, setLoading] = useState(false)

  const displayPrice = selectedWeight ? selectedWeight.price : 0
  const selectedTaxPercent = selectedWeight ? (selectedWeight.tax ?? 0) : 0
  const selectedTaxAmount = displayPrice * (selectedTaxPercent / 100)
  const selectedDelivery = selectedWeight ? (selectedWeight.deliveryCharge ?? 0) : 0
  const productTotal = displayPrice + selectedTaxAmount

  const handleAddToCart = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cart/add', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          qty,
          ...(selectedWeight
            ? { weight: selectedWeight.weight, weightPrice: selectedWeight.price }
            : {}),
        }),
      })
      if (res.status === 401) { toast.error('Please log in to add items to your cart'); return }
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to add to cart')
      }
      const label = selectedWeight ? ` (${selectedWeight.weight})` : ''
      toast.success(`${productName}${label} added to cart!`)
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add to cart')
    } finally {
      setLoading(false)
    }
  }

  // ── Out of stock ────────────────────────────────────────────────────────────
  if (maxStock === 0) {
    return (
      <div className="mt-2">
        <button disabled className="w-full h-12 bg-masala-100 text-masala-500 rounded-2xl text-sm font-semibold cursor-not-allowed tracking-wide">
          Out of Stock
        </button>
      </div>
    )
  }

  // ── Price display ───────────────────────────────────────────────────────────
  const priceDisplay = (
    <div className="flex flex-col gap-1 mb-6">
      <div className="flex items-baseline gap-2.5">
        <span className="text-4xl font-black text-chili-600 tabular-nums">
          ₹{productTotal.toLocaleString('en-IN')}
        </span>
        {selectedWeight && (
          <span className="text-sm text-masala-400 font-medium">for {selectedWeight.weight}</span>
        )}
      </div>
      {(selectedTaxAmount > 0 || selectedDelivery > 0) && (
        <div className="flex flex-wrap gap-x-3 text-xs text-masala-500 font-medium">
          {selectedTaxAmount > 0 && (
            <span>(₹{displayPrice.toLocaleString('en-IN')} + ₹{selectedTaxAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Tax)</span>
          )}
          {selectedDelivery > 0 ? (
            <span>+ ₹{selectedDelivery.toLocaleString('en-IN')} Delivery</span>
          ) : (
            <span className="text-cardamom-600 font-semibold">Free Delivery</span>
          )}
        </div>
      )}
    </div>
  )

  // ── Weight UI ───────────────────────────────────────────────────────────────
  let weightUI: React.ReactNode = null

  if (activeWeights.length === 1) {
    // Single option — display as a static info pill, no selection needed
    const w = activeWeights[0]
    const optTaxAmount = w.price * ((w.tax ?? 0) / 100)
    const optTotal = w.price + optTaxAmount
    weightUI = (
      <div className="mb-6">
        <p className="text-[11px] font-bold text-masala-400 uppercase tracking-widest mb-2.5">Weight</p>
        <div className="inline-flex items-center gap-3 bg-chili-100 border-2 border-chili-600/30 rounded-2xl px-4 py-3">
          <div className="w-5 h-5 rounded-full bg-chili-600 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
          <div>
            <p className="text-sm font-black text-chili-600 leading-tight">{w.weight}</p>
            {w.subtitle && (
              <p className="text-xs text-masala-400 leading-tight mt-0.5">{w.subtitle}</p>
            )}
          </div>
          <span className="ml-1 text-sm font-bold text-chili-600">
            ₹{optTotal.toLocaleString('en-IN')}
            {optTaxAmount > 0 && <span className="text-[10px] text-masala-400 block font-normal">(Includes ₹{optTaxAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Tax)</span>}
          </span>
        </div>
      </div>
    )
  } else if (activeWeights.length > 1) {
    // Multiple options — interactive card grid
    const gridClass =
      activeWeights.length === 2 ? 'grid-cols-2' :
      activeWeights.length === 3 ? 'grid-cols-2 sm:grid-cols-3' :
      activeWeights.length === 4 ? 'grid-cols-2 sm:grid-cols-4' :
                                   'grid-cols-2 sm:grid-cols-3'

    weightUI = (
      <div className="mb-6">
        <p className="text-[11px] font-bold text-masala-400 uppercase tracking-widest mb-3">Select Weight</p>
        <div className={`grid gap-2.5 ${gridClass}`}>
          {activeWeights.map(opt => {
            const isSelected = selectedWeight?.weight === opt.weight
            const optTaxAmount = opt.price * ((opt.tax ?? 0) / 100)
            const optTotal = opt.price + optTaxAmount
            return (
              <button
                key={opt.weight}
                type="button"
                onClick={() => setSelectedWeight(opt)}
                aria-pressed={isSelected}
                className={`relative flex flex-col gap-1.5 rounded-2xl border-2 p-3.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chili-600 active:scale-[0.98] ${
                  isSelected
                    ? 'border-chili-600 bg-gradient-to-br from-chili-100 to-chili-100/40 shadow-lg shadow-chili-600/20'
                    : 'border-masala-200 bg-white hover:border-chili-600/30 hover:bg-chili-100/20 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                {/* Selection indicator */}
                <div className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150 ${
                  isSelected ? 'bg-chili-600 scale-100' : 'border-2 border-masala-200 bg-white scale-100'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>

                {/* Weight label */}
                <span className={`text-[15px] font-black leading-none pr-7 transition-colors ${
                  isSelected ? 'text-chili-600' : 'text-masala-900'
                }`}>
                  {opt.weight}
                </span>

                {/* Subtitle */}
                {opt.subtitle && (
                  <span className={`text-[11px] leading-snug transition-colors ${
                    isSelected ? 'text-chili-600/70' : 'text-masala-400'
                  }`}>
                    {opt.subtitle}
                  </span>
                )}

                {/* Price */}
                <span className={`text-sm font-bold mt-0.5 transition-colors ${
                  isSelected ? 'text-chili-600' : 'text-masala-600'
                }`}>
                  ₹{optTotal.toLocaleString('en-IN')}
                  {optTaxAmount > 0 && <span className="text-[9px] text-masala-400 block font-normal">(Includes ₹{optTaxAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Tax)</span>}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Quantity stepper ────────────────────────────────────────────────────────
  const qtyControls = (compact = false) => (
    <div className="flex items-center bg-masala-50 border-2 border-masala-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}
        className={`${compact ? 'w-10 h-12' : 'w-11 h-12'} flex items-center justify-center text-masala-600 hover:bg-masala-100 disabled:opacity-30 transition-colors`}
        aria-label="Decrease quantity"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span
        className={`${compact ? 'w-10' : 'w-12'} text-center text-sm font-black text-masala-900 select-none tabular-nums`}
        aria-label={`Quantity: ${qty}`}
      >
        {qty}
      </span>
      <button
        onClick={() => setQty(q => Math.min(maxStock, q + 1))} disabled={qty >= maxStock}
        className={`${compact ? 'w-10 h-12' : 'w-11 h-12'} flex items-center justify-center text-masala-600 hover:bg-masala-100 disabled:opacity-30 transition-colors`}
        aria-label="Increase quantity"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Desktop inline */}
      <div className="hidden sm:block">
        {priceDisplay}
        {weightUI}
        <div className="flex gap-3 items-center">
          {qtyControls()}
          <Button onClick={handleAddToCart} loading={loading} size="lg" className="flex-1 gap-2 rounded-2xl h-12">
            <ShoppingCart className="w-5 h-5" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Mobile: price + weight only (sticky bar handles qty + add) */}
      <div className="sm:hidden">
        {priceDisplay}
        {weightUI}
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-masala-200 px-4 pt-3 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.10)]">
        <div className="flex items-center gap-3">
          {qtyControls(true)}
          <Button onClick={handleAddToCart} loading={loading} size="lg" className="flex-1 gap-2 rounded-2xl">
            <ShoppingCart className="w-4 h-4" />
            Add — ₹{((productTotal + selectedDelivery) * qty).toLocaleString('en-IN')}
          </Button>
        </div>
      </div>
    </>
  )
}
