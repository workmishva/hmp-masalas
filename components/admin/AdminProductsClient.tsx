'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { ProductForm } from './ProductForm'
import type { IProduct } from '@/types'

interface AdminProductsClientProps {
  initialProducts: IProduct[]
}

function DeleteModal({
  product,
  onConfirm,
  onCancel,
  loading,
}: {
  product: IProduct
  onConfirm: () => void
  onCancel:  () => void
  loading:   boolean
}) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl border border-masala-200 shadow-2xl max-w-sm w-full p-6 space-y-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-chili-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-chili-600" />
          </div>
          <h3 className="font-heading font-semibold text-masala-900 text-lg">Delete Product?</h3>
          <p className="text-masala-500 text-sm mt-1">
            Are you sure you want to delete <strong className="text-masala-900">{product.name}</strong>? This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading} className="flex-1">
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AdminProductsClient({ initialProducts }: AdminProductsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [products, setProducts]       = useState<IProduct[]>(initialProducts)
  const [search, setSearch]           = useState('')
  const [modalOpen, setModalOpen]     = useState(false)
  const [editProduct, setEditProduct] = useState<IProduct | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<IProduct | null>(null)
  const [deleting, setDeleting]       = useState(false)
  const [toggling, setToggling]       = useState<string | null>(null)

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd  = () => { setEditProduct(undefined); setModalOpen(true) }
  const openEdit = (p: IProduct) => { setEditProduct(p); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditProduct(undefined) }

  const handleSaved = (saved: IProduct) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p._id === saved._id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [saved, ...prev]
    })
    closeModal()
    startTransition(() => router.refresh())
  }

  const handleToggle = async (product: IProduct) => {
    setToggling(product._id)
    try {
      const res = await fetch(`/api/products/${product._id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ isActive: !product.isActive }),
      })
      if (!res.ok) throw new Error()
      setProducts((prev) =>
        prev.map((p) => p._id === product._id ? { ...p, isActive: !p.isActive } : p)
      )
      toast.success(product.isActive ? 'Product deactivated' : 'Product activated')
    } catch {
      toast.error('Failed to update product status')
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/products/${deleteTarget._id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setProducts((prev) => prev.filter((p) => p._id !== deleteTarget._id))
      toast.success('Product deleted')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete product')
    } finally {
      setDeleting(false)
    }
  }

  const stockColor = (stock: number) => {
    if (stock === 0) return 'text-chili-600 bg-chili-100'
    if (stock < 5)  return 'text-yellow-700 bg-yellow-100'
    return 'text-cardamom-600 bg-cardamom-100'
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-masala-900">Products</h1>
          <p className="text-sm text-masala-500 mt-0.5">{products.length} total products</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-masala-200 bg-white dark:bg-masala-100 text-sm font-medium text-masala-700 hover:bg-masala-50 dark:hover:bg-masala-200 transition-colors w-full sm:w-auto"
          >
            ← Back to Store
          </Link>
          <Button onClick={openAdd} className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or category..."
          className="w-full sm:w-72 h-10 border border-masala-200 rounded-xl px-4 text-sm bg-white text-masala-900 placeholder:text-masala-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/50 focus:border-saffron-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-masala-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Products table">
            <thead>
              <tr className="border-b border-masala-200 bg-masala-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-masala-600 uppercase tracking-wider">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-masala-600 uppercase tracking-wider hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-masala-600 uppercase tracking-wider">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-masala-600 uppercase tracking-wider hidden md:table-cell">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-masala-600 uppercase tracking-wider hidden lg:table-cell">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-masala-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-masala-500">
                    {search ? `No products matching "${search}"` : 'No products yet — add your first one!'}
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr
                    key={product._id}
                    className={`hover:bg-masala-50 transition-colors ${
                      product.stock === 0 ? 'border-l-4 border-l-chili-500' :
                      product.stock < 5  ? 'border-l-4 border-l-yellow-400' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl bg-masala-50 overflow-hidden shrink-0 border border-masala-200">
                          {product.images[0] ? (
                            <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="40px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">🌶️</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-masala-900 truncate">{product.name}</p>
                          <p className="text-xs text-masala-500 sm:hidden">{product.category}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-masala-600 hidden sm:table-cell">{product.category}</td>

                    <td className="px-4 py-3 font-semibold text-masala-900">
                      {(() => {
                        const defaultWeight = product.weights?.find(w => w.isDefault && w.isActive !== false) ?? product.weights?.find(w => w.isActive !== false)
                        return defaultWeight ? `₹${defaultWeight.price.toLocaleString('en-IN')}` : '—'
                      })()}
                    </td>

                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stockColor(product.stock)}`}>
                        {product.stock} units
                      </span>
                    </td>

                    <td className="px-4 py-3 hidden lg:table-cell">
                      <button
                        onClick={() => handleToggle(product)}
                        disabled={toggling === product._id}
                        className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${
                          product.isActive ? 'bg-chili-600' : 'bg-masala-300'
                        } disabled:opacity-50`}
                        role="switch"
                        aria-checked={product.isActive}
                        aria-label={`${product.isActive ? 'Deactivate' : 'Activate'} ${product.name}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                          product.isActive ? 'translate-x-[1.125rem]' : 'translate-x-0'
                        }`} />
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(product)}
                          className="p-1.5 rounded-lg text-masala-500 hover:text-chili-600 hover:bg-chili-100 transition-colors"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product)}
                          className="p-1.5 rounded-lg text-masala-500 hover:text-chili-600 hover:bg-chili-100 transition-colors"
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit modal (old-project style: centered, backdrop blur) ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-masala-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-masala-100 shrink-0">
              <h2 className="font-heading text-xl font-bold text-masala-900">
                {editProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl text-masala-400 hover:bg-masala-100 hover:text-masala-700 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ProductForm
              product={editProduct}
              onSuccess={handleSaved}
              onCancel={closeModal}
              onDelete={editProduct ? () => {
                const target = editProduct
                closeModal()
                setDeleteTarget(target)
              } : undefined}
            />
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          product={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {isPending && <div className="fixed inset-0 z-40 pointer-events-none" />}
    </>
  )
}
