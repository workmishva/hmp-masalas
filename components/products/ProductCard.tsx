'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Package } from 'lucide-react'
import { motion } from 'framer-motion'
import type { IProduct } from '@/types'
import { CATEGORY_META } from '@/lib/categories'

interface ProductCardProps {
  product:  IProduct
  priority?: boolean
  index?:    number
}

export function ProductCard({ product, priority = false, index = 0 }: ProductCardProps) {
  const hasImage = product.images.length > 0
  const meta     = CATEGORY_META[product.category]
  const CatIcon  = meta?.icon ?? Package
  const isOOS    = product.stock === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.06 }}
    >
      <Link
        href={`/products/${product._id}`}
        className={`group block bg-white dark:bg-masala-100 rounded-3xl border border-masala-200 shadow-card hover:shadow-card-hover hover:-translate-y-2 transition-all duration-300 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chili-600 ${
          isOOS ? 'opacity-80' : ''
        }`}
      >
        {/* Image */}
        <div className="relative aspect-square bg-masala-50 dark:bg-masala-200 overflow-hidden">
          {hasImage ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              priority={priority}
              className={`object-cover transition-transform duration-700 group-hover:scale-110 ${
                isOOS ? 'grayscale' : ''
              }`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CatIcon size={64} className="text-masala-200" strokeWidth={1} />
            </div>
          )}

          {/* Category badge — top left */}
          <span className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 dark:bg-masala-100/90 backdrop-blur-sm text-masala-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
            <CatIcon size={11} strokeWidth={2.5} />
            {product.category}
          </span>

          {/* OOS overlay */}
          {isOOS && (
            <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
              <span className="bg-masala-900/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full tracking-wide">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-5 flex flex-col gap-3">
          <div>
            <h3 className="font-heading font-bold text-masala-900 line-clamp-2 leading-snug text-base">
              {product.name}
            </h3>
            <p className="text-sm text-masala-500 mt-1.5 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-masala-100 pt-3">
            <div className="flex flex-col">
              {(() => {
                const defaultWeight = product.weights?.find(w => w.isDefault && w.isActive !== false) ?? product.weights?.find(w => w.isActive !== false)
                const displayPrice = defaultWeight ? defaultWeight.price : 0
                const displayTaxPercent = defaultWeight ? (defaultWeight.tax ?? 0) : 0
                const displayTaxAmount = displayPrice * (displayTaxPercent / 100)
                const displayTotal = displayPrice + displayTaxAmount
                return (
                  <>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-masala-400">
                      Price
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-chili-600">
                        ₹{displayTotal.toLocaleString('en-IN')}
                      </span>
                      {defaultWeight && (
                        <span className="text-xs text-masala-400 font-medium">
                          {defaultWeight.weight}
                        </span>
                      )}
                    </div>
                    {displayTaxAmount > 0 && (
                      <span className="text-[9px] text-masala-400 block font-normal">(Includes ₹{displayTaxAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Tax)</span>
                    )}
                  </>
                )
              })()}
            </div>
            {product.stock > 10 ? (
              <span className="flex items-center gap-1.5 text-xs text-cardamom-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-cardamom-600" />
                In Stock
              </span>
            ) : product.stock > 0 ? (
              <span className="flex items-center gap-1.5 text-xs text-saffron-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-saffron-500" />
                Few Left
              </span>
            ) : (
              <span className="text-xs text-masala-400 font-medium">Unavailable</span>
            )}
          </div>

          {/* CTA bar */}
          <div className="w-full py-2.5 rounded-xl bg-masala-100 dark:bg-masala-200 text-masala-700 text-sm font-semibold text-center group-hover:bg-chili-600 group-hover:text-white transition-all duration-200">
            View Product →
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
