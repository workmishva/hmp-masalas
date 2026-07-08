'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import {
  Star, Eye, EyeOff, Trash2, X, AlertTriangle, MessageSquare,
  ChevronLeft, ChevronRight, Search, ArrowLeft, ShieldCheck, Package,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { IAdminReview } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProductStat {
  productId:       string
  productName:     string
  productImage:    string | null
  productCategory: string
  total:           number
  hidden:          number
  visible:         number
  avgRating:       number
  lastActivity:    string | null
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function StarRow({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size}
          className={n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-masala-200'} />
      ))}
    </div>
  )
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

// ── Detail modal ──────────────────────────────────────────────────────────────
function DetailModal({ review, onClose }: { review: IAdminReview; onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-masala-100 rounded-3xl border border-masala-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-masala-100">
          <h2 className="font-heading font-bold text-masala-900 text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-masala-400" />
            Review Details
          </h2>
          <button onClick={onClose}
            className="p-2 rounded-xl text-masala-400 hover:bg-masala-100 hover:text-masala-700 transition-colors"
            aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Reviewer */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-saffron-100 text-saffron-700 font-bold text-sm flex items-center justify-center shrink-0">
              {initials(review.userName ?? '')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-masala-900 text-sm">{review.userName ?? 'Customer'}</p>
              {review.userEmail && <p className="text-xs text-masala-500">{review.userEmail}</p>}
              {review.userPhone && <p className="text-xs text-masala-400">+91 {review.userPhone}</p>}
            </div>
            {review.isHidden && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-masala-100 text-masala-600 text-xs font-medium shrink-0">
                <EyeOff className="w-3 h-3" /> Hidden
              </span>
            )}
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-masala-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-masala-400 uppercase tracking-wider mb-0.5">Submitted</p>
              <p className="text-masala-900 font-medium">{format(new Date(review.createdAt), 'dd MMM yyyy')}</p>
              <p className="text-xs text-masala-400">{format(new Date(review.createdAt), 'HH:mm')}</p>
            </div>
            <div className="bg-masala-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-masala-400 uppercase tracking-wider mb-1">Rating</p>
              <StarRow rating={review.rating} size={15} />
            </div>
            <div className="bg-masala-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-masala-400 uppercase tracking-wider mb-0.5">Order ID</p>
              <p className="text-masala-700 font-mono text-xs break-all">HMP-{review.orderId.slice(0, 8)}</p>
            </div>
            <div className="bg-masala-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-masala-400 uppercase tracking-wider mb-1">Purchase</p>
              {review.orderVerified ? (
                <span className="inline-flex items-center gap-1 text-xs text-cardamom-600 font-medium">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="text-xs text-masala-400">Unverified</span>
              )}
            </div>
          </div>

          {/* Review content */}
          {review.title && (
            <div>
              <p className="text-xs font-semibold text-masala-400 uppercase tracking-wider mb-1">Title</p>
              <p className="text-masala-900 font-semibold text-sm">{review.title}</p>
            </div>
          )}
          {review.comment ? (
            <div>
              <p className="text-xs font-semibold text-masala-400 uppercase tracking-wider mb-1">Review</p>
              <p className="text-masala-700 text-sm leading-relaxed">{review.comment}</p>
            </div>
          ) : (
            <p className="text-masala-400 text-sm italic">No written comment — rating only.</p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-masala-100">
          <button onClick={onClose}
            className="w-full h-10 rounded-xl border border-masala-200 text-masala-700 text-sm font-medium hover:bg-masala-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Delete confirmation modal ─────────────────────────────────────────────────
function DeleteModal({
  message, deleting, onConfirm, onCancel,
}: {
  message: string; deleting: boolean; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onCancel}>
      <div className="w-full max-w-sm bg-white dark:bg-masala-100 rounded-3xl border border-masala-200 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-2xl bg-chili-100 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-chili-600" />
        </div>
        <h2 className="font-heading font-bold text-masala-900 text-lg mb-1">Delete Review?</h2>
        <p className="text-sm text-masala-600 mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={deleting}
            className="flex-1 h-10 border border-masala-200 rounded-xl text-sm font-medium text-masala-700 hover:bg-masala-50 disabled:opacity-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 h-10 bg-chili-600 hover:bg-chili-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            {deleting
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting…</>
              : <><Trash2 className="w-4 h-4" />Delete</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Products grid view ────────────────────────────────────────────────────────
function ProductsGridView() {
  const router                = useRouter()
  const [products, setProducts] = useState<ProductStat[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const qs  = new URLSearchParams({ search: debouncedSearch })
      const res = await fetch(`/api/admin/reviews?${qs}`)
      const { data } = await res.json()
      if (data?.mode === 'products') setProducts(data.products)
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-masala-900">Review Moderation</h1>
          <p className="text-sm text-masala-500 mt-0.5">
            {loading ? '…' : `${products.length} product${products.length !== 1 ? 's' : ''} with reviews`}
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-masala-200 bg-white dark:bg-masala-100 text-sm font-medium text-masala-700 hover:bg-masala-50 dark:hover:bg-masala-200 transition-colors"
        >
          ← Back to Store
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-masala-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-full h-10 pl-10 pr-4 border border-masala-200 rounded-xl text-sm bg-white dark:bg-masala-100 text-masala-900 placeholder:text-masala-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/50 focus:border-saffron-500"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 skeleton rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-masala-400">
          <MessageSquare className="w-12 h-12 mb-3 text-masala-200" />
          <p className="text-sm font-medium">No reviews found</p>
          {debouncedSearch && (
            <button onClick={() => setSearch('')}
              className="mt-2 text-xs text-chili-600 hover:underline">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <button
              key={p.productId}
              onClick={() => router.push(`/admin/reviews?productId=${p.productId}`)}
              className="group text-left bg-white dark:bg-masala-100 border border-masala-200 rounded-2xl shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400"
            >
              {/* Product header */}
              <div className="flex items-center gap-3 mb-3">
                {p.productImage ? (
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-masala-100">
                    <Image src={p.productImage} alt={p.productName} fill className="object-cover" sizes="40px" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-masala-100 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-masala-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-masala-900 text-sm truncate group-hover:text-saffron-600 transition-colors">
                    {p.productName}
                  </p>
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-saffron-100 text-saffron-700 font-medium truncate max-w-full">
                    {p.productCategory || 'Uncategorised'}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-masala-500 mb-2">
                <span className="font-semibold text-masala-900 text-sm">{p.total} review{p.total !== 1 ? 's' : ''}</span>
                <div className="flex items-center gap-1">
                  <Star size={11} className="text-yellow-400 fill-yellow-400" />
                  <span className="font-medium text-masala-700">{p.avgRating.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="flex items-center gap-1 text-cardamom-600">
                  <Eye size={11} /> {p.visible} visible
                </span>
                {p.hidden > 0 && (
                  <span className="flex items-center gap-1 text-masala-500">
                    <EyeOff size={11} /> {p.hidden} hidden
                  </span>
                )}
              </div>

              {/* Last activity */}
              {p.lastActivity && (
                <p className="mt-2.5 text-xs text-masala-400 border-t border-masala-100 pt-2.5">
                  Last review: {format(new Date(p.lastActivity), 'dd MMM yyyy')}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Product detail view ───────────────────────────────────────────────────────
type FilterTab = 'all' | 'visible' | 'hidden'

interface ProductHeader {
  _id:      string
  name:     string
  image:    string | null
  category: string
}

function ProductDetailView({ productId }: { productId: string }) {
  const router = useRouter()

  const [reviews,       setReviews]       = useState<IAdminReview[]>([])
  const [product,       setProduct]       = useState<ProductHeader | null>(null)
  const [total,         setTotal]         = useState(0)
  const [pages,         setPages]         = useState(1)
  const [page,          setPage]          = useState(1)
  const [loading,       setLoading]       = useState(true)
  const [filter,        setFilter]        = useState<FilterTab>('all')
  const [ratingFilter,  setRatingFilter]  = useState<string>('all')
  const [search,        setSearch]        = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [detail,        setDetail]        = useState<IAdminReview | null>(null)
  const [pendingDelete, setPendingDelete] = useState<IAdminReview | null>(null)
  const [deleting,      setDeleting]      = useState(false)
  const [togglingId,    setTogglingId]    = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [filter, ratingFilter, debouncedSearch])

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ productId, filter, search: debouncedSearch, page: String(page) })
      if (ratingFilter !== 'all') qs.set('rating', ratingFilter)
      const res = await fetch(`/api/admin/reviews?${qs}`)
      const { data } = await res.json()
      if (data?.mode === 'product') {
        setReviews(data.reviews)
        setProduct(data.product)
        setTotal(data.total)
        setPages(data.pages)
      }
    } catch {
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [productId, filter, ratingFilter, debouncedSearch, page])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  const handleToggleHide = async (review: IAdminReview) => {
    setTogglingId(review._id)
    try {
      const res  = await fetch(`/api/admin/reviews/${review._id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ isHidden: !review.isHidden }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Failed to update'); return }
      setReviews((prev) =>
        prev.map((r) => r._id === review._id ? { ...r, isHidden: !r.isHidden } : r),
      )
      toast.success(review.isHidden ? 'Review is now visible' : 'Review hidden from customers')
    } catch {
      toast.error('Failed to update review')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const res  = await fetch(`/api/admin/reviews/${pendingDelete._id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Failed to delete'); return }
      setReviews((prev) => prev.filter((r) => r._id !== pendingDelete._id))
      setTotal((t) => t - 1)
      toast.success('Review deleted permanently')
      setPendingDelete(null)
    } catch {
      toast.error('Failed to delete review')
    } finally {
      setDeleting(false)
    }
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all',     label: 'All'     },
    { key: 'visible', label: 'Visible' },
    { key: 'hidden',  label: 'Hidden'  },
  ]

  return (
    <>
      {detail && <DetailModal review={detail} onClose={() => setDetail(null)} />}
      {pendingDelete && (
        <DeleteModal
          message={`Permanently delete the review by ${pendingDelete.userName ?? 'Customer'}? This cannot be undone.`}
          deleting={deleting}
          onConfirm={handleDelete}
          onCancel={() => !deleting && setPendingDelete(null)}
        />
      )}

      <div className="space-y-5">
        {/* Back + header */}
        <div className="flex items-start gap-4 flex-wrap">
          <button
            onClick={() => router.push('/admin/reviews')}
            className="flex items-center gap-1.5 text-sm text-masala-500 hover:text-masala-900 transition-colors shrink-0 mt-0.5"
          >
            <ArrowLeft className="w-4 h-4" />
            All Products
          </button>

          {product && (
            <div className="flex items-center gap-3">
              {product.image ? (
                <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-masala-100 shrink-0">
                  <Image src={product.image} alt={product.name} fill className="object-cover" sizes="40px" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-masala-100 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-masala-400" />
                </div>
              )}
              <div>
                <h1 className="font-heading text-xl font-bold text-masala-900 leading-tight">{product.name}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-saffron-100 text-saffron-700 font-medium">
                    {product.category || 'Uncategorised'}
                  </span>
                  {!loading && (
                    <span className="text-xs text-masala-400">{total} review{total !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-3">
          {/* Visibility tabs */}
          <div className="flex rounded-xl border border-masala-200 overflow-hidden bg-white dark:bg-masala-100 shrink-0">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-masala-900 dark:bg-masala-400 text-white'
                    : 'text-masala-600 hover:bg-masala-50 dark:hover:bg-masala-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Rating filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="h-10 px-3 border border-masala-200 rounded-xl text-sm text-masala-700 bg-white dark:bg-masala-100 focus:outline-none focus:ring-2 focus:ring-saffron-400/50 focus:border-saffron-500"
          >
            <option value="all">All Ratings</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={String(n)}>{n} ★</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-masala-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reviewer or comment…"
              className="w-full h-10 pl-10 pr-4 border border-masala-200 rounded-xl text-sm bg-white dark:bg-masala-100 text-masala-900 placeholder:text-masala-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/50 focus:border-saffron-500"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 skeleton rounded-2xl" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-masala-400">
            <MessageSquare className="w-12 h-12 mb-3 text-masala-200" />
            <p className="text-sm font-medium">No reviews match your filters</p>
            {(debouncedSearch || filter !== 'all' || ratingFilter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setFilter('all'); setRatingFilter('all') }}
                className="mt-2 text-xs text-chili-600 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-masala-100 border border-masala-200 rounded-2xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-masala-100 bg-masala-50 dark:bg-masala-200/60">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-masala-600 uppercase tracking-wider">Reviewer</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-masala-600 uppercase tracking-wider">Rating</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-masala-600 uppercase tracking-wider hidden lg:table-cell">Review</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-masala-600 uppercase tracking-wider hidden sm:table-cell">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-masala-600 uppercase tracking-wider hidden md:table-cell">Order</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-masala-600 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-masala-100">
                  {reviews.map((review) => (
                    <tr
                      key={review._id}
                      className={`transition-colors ${
                        review.isHidden
                          ? 'bg-masala-50/60 dark:bg-masala-200/30 opacity-75'
                          : 'hover:bg-masala-50 dark:hover:bg-masala-200/40'
                      }`}
                    >
                      {/* Reviewer */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-saffron-100 text-saffron-700 font-bold text-xs flex items-center justify-center shrink-0 select-none">
                            {initials(review.userName ?? '')}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-masala-900 truncate max-w-[120px]">
                              {review.userName ?? 'Customer'}
                            </p>
                            <p className="text-xs text-masala-400 truncate max-w-[120px]">
                              {review.userEmail || review.userPhone || '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="px-5 py-3.5">
                        <StarRow rating={review.rating} />
                      </td>

                      {/* Review snippet */}
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <div className="max-w-[220px]">
                          {review.title && (
                            <p className="font-medium text-masala-800 text-xs truncate">{review.title}</p>
                          )}
                          {review.comment ? (
                            <p className="text-masala-500 text-xs truncate">{review.comment}</p>
                          ) : (
                            <p className="text-masala-300 text-xs italic">Rating only</p>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <p className="text-masala-700 text-xs whitespace-nowrap">
                          {format(new Date(review.createdAt), 'dd MMM yyyy')}
                        </p>
                        <p className="text-masala-400 text-xs">
                          {format(new Date(review.createdAt), 'HH:mm')}
                        </p>
                      </td>

                      {/* Order verified */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        {review.orderVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs text-cardamom-600 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="text-xs text-masala-400">—</span>
                        )}
                      </td>

                      {/* Visibility */}
                      <td className="px-5 py-3.5">
                        {review.isHidden ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-masala-100 text-masala-600 text-xs font-medium whitespace-nowrap">
                            <EyeOff className="w-3 h-3" /> Hidden
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cardamom-100 text-cardamom-600 text-xs font-medium whitespace-nowrap">
                            <Eye className="w-3 h-3" /> Visible
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setDetail(review)}
                            title="View details"
                            className="p-1.5 rounded-lg text-masala-400 hover:text-masala-700 hover:bg-masala-100 transition-colors"
                            aria-label="View details"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleHide(review)}
                            disabled={togglingId === review._id}
                            title={review.isHidden ? 'Make visible' : 'Hide from customers'}
                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                              review.isHidden
                                ? 'text-masala-400 hover:text-cardamom-600 hover:bg-cardamom-100'
                                : 'text-masala-400 hover:text-masala-700 hover:bg-masala-100'
                            }`}
                            aria-label={review.isHidden ? 'Unhide review' : 'Hide review'}
                          >
                            {togglingId === review._id
                              ? <div className="w-4 h-4 border-2 border-masala-300 border-t-masala-600 rounded-full animate-spin" />
                              : review.isHidden
                                ? <Eye className="w-4 h-4" />
                                : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setPendingDelete(review)}
                            title="Delete permanently"
                            className="p-1.5 rounded-lg text-masala-400 hover:text-chili-600 hover:bg-chili-100 transition-colors"
                            aria-label="Delete review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-masala-500">
              Page {page} of {pages} · {total} reviews
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-masala-200 text-masala-700 hover:bg-masala-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-masala-200 text-masala-700 hover:bg-masala-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── Router-aware inner component ──────────────────────────────────────────────
function AdminReviewsInner() {
  const searchParams = useSearchParams()
  const productId    = searchParams.get('productId')

  return productId
    ? <ProductDetailView productId={productId} />
    : <ProductsGridView />
}

// ── Exported page ─────────────────────────────────────────────────────────────
export default function AdminReviewsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-5">
        <div className="h-8 skeleton rounded-xl w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
        </div>
      </div>
    }>
      <AdminReviewsInner />
    </Suspense>
  )
}
