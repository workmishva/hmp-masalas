'use client'

import { useState } from 'react'
import { Upload, X, Loader2, Trash2 } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import type { IProduct } from '@/types'
import { PRODUCT_CATEGORIES } from '@/lib/categories'

interface ProductFormProps {
  product?:  IProduct
  onSuccess: (product: IProduct) => void
  onCancel:  () => void
  onDelete?: () => void
}

interface WeightRow {
  weight:         string
  price:          string
  deliveryCharge: string
  tax:            string
  description:    string
  isDefault:      boolean
  isActive:       boolean
}

interface FormState {
  name:           string
  description:    string
  stock:          string
  category:       string
  images:         string[]
  weights:        WeightRow[]
  isActive:       boolean
  isFeatured:     boolean
}

// ── Constants ─────────────────────────────────────────────────────────────────

const WEIGHT_PRESETS = [
  { label: '50g',  subtitle: 'Sample / Gift pack' },
  { label: '100g', subtitle: 'Starter pack' },
  { label: '200g', subtitle: 'Regular pack' },
  { label: '250g', subtitle: 'Popular choice' },
  { label: '500g', subtitle: 'Large pack' },
  { label: '1kg',  subtitle: 'Bulk / Family pack' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

async function uploadToCloudinary(file: File): Promise<string> {
  const res = await fetch('/api/upload', { method: 'POST' })
  if (!res.ok) throw new Error('Failed to get upload signature')
  const { data } = await res.json()
  const fd = new FormData()
  fd.append('file', file)
  fd.append('signature', data.signature)
  fd.append('timestamp', String(data.timestamp))
  fd.append('api_key', data.apiKey)
  fd.append('folder', data.folder)
  const up = await fetch(`https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`, { method: 'POST', body: fd })
  if (!up.ok) throw new Error('Upload failed')
  return (await up.json()).secure_url as string
}

function parseGrams(label: string): number {
  const kg = label.trim().match(/^(\d+(?:\.\d+)?)\s*kg$/i)
  if (kg) return parseFloat(kg[1]) * 1000
  const g  = label.trim().match(/^(\d+(?:\.\d+)?)\s*g$/i)
  if (g)  return parseFloat(g[1])
  return 0
}

function computeWeightPrice(label: string, basePrice: number): number | null {
  const g = parseGrams(label)
  if (g <= 0 || basePrice <= 0) return null
  return Math.round((g / 100) * basePrice)
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const inputCls = (err?: string) =>
  `w-full rounded-2xl border px-4 py-3 text-sm text-masala-900 bg-masala-50 placeholder:text-masala-400
   focus:outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-400/40 focus:bg-white transition-all
   ${err ? 'border-chili-600' : 'border-masala-200 hover:border-masala-300'}`

function Field({ label, required, error, hint, children }: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-bold text-masala-900">
        {label}{required && <span className="text-chili-600 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-chili-600">{error}</p>}
      {hint && !error && <p className="text-xs text-masala-400">{hint}</p>}
    </div>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-[10px] font-bold text-masala-400 uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-masala-100" />
    </div>
  )
}

function Toggle({ checked, onChange, label, description, color = 'saffron' }: {
  checked: boolean; onChange: () => void; label: string; description: string; color?: 'saffron' | 'cardamom'
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-bold text-masala-900">{label}</p>
        <p className="text-xs text-masala-400 mt-0.5">{description}</p>
      </div>
      <button
        type="button" onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${
          checked ? (color === 'cardamom' ? 'bg-cardamom-600' : 'bg-saffron-500') : 'bg-masala-300'
        }`}
        role="switch" aria-checked={checked}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────

export function ProductForm({ product, onSuccess, onCancel, onDelete }: ProductFormProps) {
  const isEdit = !!product

  const [form, setForm] = useState<FormState>({
    name:        product?.name        ?? '',
    description: product?.description ?? '',
    stock:       product?.stock       != null ? String(product.stock) : '',
    category:    product?.category    ?? PRODUCT_CATEGORIES[0],
    images:      product?.images      ?? [],
    weights:     product?.weights?.map(w => ({
      weight:         w.weight,
      price:          w.price != null ? String(w.price) : '',
      deliveryCharge: w.deliveryCharge != null ? String(w.deliveryCharge) : '0',
      tax:            w.tax != null ? String(w.tax) : '0',
      description:    w.description ?? w.subtitle ?? '',
      isDefault:      w.isDefault ?? false,
      isActive:       w.isActive  ?? true,
    })) ?? [],
    isActive:    product?.isActive    ?? true,
    isFeatured:  product?.isFeatured  ?? false,
  })

  const [errors, setErrors]       = useState<Partial<Record<keyof FormState | 'weightRows', string>>>({})
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]       = useState(false)

  const set = (field: keyof FormState, value: unknown) =>
    setForm(f => ({ ...f, [field]: value }))

  // ── Weight helpers ──────────────────────────────────────────────────────────

  const addPreset = (p: typeof WEIGHT_PRESETS[0]) => {
    if (form.weights.some(w => w.weight === p.label)) return
    setForm(f => ({
      ...f,
      weights: [...f.weights, {
        weight:         p.label,
        price:          '',
        deliveryCharge: '0',
        tax:            '0',
        description:    p.subtitle,
        isDefault:      f.weights.length === 0,
        isActive:       true,
      }],
    }))
  }

  const addCustom = () =>
    setForm(f => ({
      ...f,
      weights: [...f.weights, {
        weight:         '',
        price:          '',
        deliveryCharge: '0',
        tax:            '0',
        description:    '',
        isDefault:      f.weights.length === 0,
        isActive:       true,
      }],
    }))

  const updateRow = (i: number, field: keyof WeightRow, val: string | boolean) =>
    setForm(f => {
      const next = f.weights.map((w, idx) => {
        if (idx !== i) return w
        return { ...w, [field]: val }
      })
      return { ...f, weights: next }
    })

  const setDefault = (i: number) =>
    setForm(f => ({ ...f, weights: f.weights.map((w, idx) => ({ ...w, isDefault: idx === i })) }))

  const removeRow = (i: number) =>
    setForm(f => {
      const next = f.weights.filter((_, idx) => idx !== i)
      // If we removed the default, promote the first remaining row
      if (f.weights[i]?.isDefault && next.length > 0) next[0] = { ...next[0], isDefault: true }
      return { ...f, weights: next }
    })

  // ── Validation ──────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const e: typeof errors = {}
    if (!form.name.trim() || form.name.length < 2)             e.name = 'Name must be at least 2 characters'
    if (!form.description.trim() || form.description.length < 10) e.description = 'Description must be at least 10 characters'
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0) e.stock = 'Enter a valid stock quantity'
    if (!form.category) e.category = 'Select a category'

    if (form.weights.length === 0) {
      e.weightRows = 'At least one weight variant is required'
    } else {
      if (form.weights.some(w => !w.weight.trim())) {
        e.weightRows = 'All weight fields must have a label (e.g. 100g)'
      } else {
        const labels = form.weights.map(w => w.weight.trim()).filter(Boolean)
        if (new Set(labels).size !== labels.length) {
          e.weightRows = 'Duplicate weight labels are not allowed'
        } else {
          for (const w of form.weights) {
            if (!w.price || isNaN(Number(w.price)) || Number(w.price) < 0) {
              e.weightRows = `Enter a valid price for variant "${w.weight}"`
              break
            }
            if (w.deliveryCharge && (isNaN(Number(w.deliveryCharge)) || Number(w.deliveryCharge) < 0)) {
              e.weightRows = `Enter a valid delivery charge for variant "${w.weight}"`
              break
            }
            if (w.tax && (isNaN(Number(w.tax)) || Number(w.tax) < 0 || Number(w.tax) > 100)) {
              e.weightRows = `Enter a valid tax percentage (0-100) for variant "${w.weight}"`
              break
            }
          }
        }
      }

      if (!e.weightRows && !form.weights.some(w => w.isDefault && w.isActive !== false)) {
        e.weightRows = 'One active weight variant must be marked as default'
      }
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Image upload ────────────────────────────────────────────────────────────

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    if (form.images.length + files.length > 5) { toast.error('Maximum 5 images per product'); return }
    setUploading(true)
    try {
      const urls = await Promise.all(files.map(uploadToCloudinary))
      set('images', [...form.images, ...urls])
      toast.success(`${urls.length} image${urls.length > 1 ? 's' : ''} uploaded`)
    } catch {
      toast.error('Image upload failed. Check Cloudinary settings.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const builtWeights = form.weights
        .filter(w => w.weight.trim())
        .map(w => {
          return {
            weight:         w.weight.trim(),
            price:          Number(w.price) || 0,
            deliveryCharge: Number(w.deliveryCharge) || 0,
            tax:            Number(w.tax) || 0,
            subtitle:       w.description.trim(), // for backward compatibility
            description:    w.description.trim(),
            isDefault:      w.isDefault,
            isActive:       w.isActive,
          }
        })

      // Ensure at least one active weight is marked default
      if (builtWeights.length > 0 && !builtWeights.some(w => w.isActive && w.isDefault)) {
        const first = builtWeights.find(w => w.isActive)
        if (first) first.isDefault = true
      }

      const payload = {
        name:           form.name.trim(),
        description:    form.description.trim(),
        stock:          Number(form.stock),
        category:       form.category,
        images:         form.images,
        weights:        builtWeights,
        isActive:       form.isActive,
        isFeatured:     form.isFeatured,
      }

      const res  = await fetch(
        isEdit ? `/api/products/${product._id}` : '/api/products',
        { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')

      toast.success(isEdit ? 'Product updated!' : 'Product created!')
      onSuccess(data.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        <SectionLabel label="Basic Info" />

        <Field label="Product Name" required error={errors.name}>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="e.g. Garam Masala" className={inputCls(errors.name)} />
        </Field>

        <Field label="Description" required error={errors.description}>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            rows={3} placeholder="Describe this masala blend..."
            className={`${inputCls(errors.description)} resize-none`} />
        </Field>

        <Field label="Category" required error={errors.category}>
          <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls(errors.category)}>
            {PRODUCT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>

        <SectionLabel label="Stock" />

        <div className="max-w-xs">
          <Field label="Stock (units)" required error={errors.stock}>
            <input type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)}
              placeholder="0" className={inputCls(errors.stock)} />
          </Field>
        </div>

        {/* ── Weight Variants ── */}
        <SectionLabel label="Weight Variants" />

        <div className="space-y-3">
          {/* Quick-add preset chips */}
          <div>
            <p className="text-xs font-bold text-masala-500 mb-2 uppercase tracking-wider">Quick add</p>
            <div className="flex flex-wrap gap-2">
              {WEIGHT_PRESETS.map(p => {
                const added = form.weights.some(w => w.weight === p.label)
                return (
                  <button key={p.label} type="button" onClick={() => addPreset(p)} disabled={added}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      added
                        ? 'bg-masala-100 text-masala-400 cursor-default line-through'
                        : 'bg-saffron-50 border border-saffron-200 text-saffron-700 hover:bg-saffron-100 hover:border-saffron-400 active:scale-95'
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
              <button type="button" onClick={addCustom}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-dashed border-masala-300 text-masala-500 hover:border-masala-400 hover:text-masala-700 transition-all active:scale-95">
                + Custom
              </button>
            </div>
          </div>

          {errors.weightRows && <p className="text-xs text-chili-600">{errors.weightRows}</p>}

          {/* Weight rows */}
          {form.weights.length === 0 && (
            <p className="text-xs text-masala-400 italic">
              No weight variants configured yet.
            </p>
          )}

          <div className="space-y-2.5">
            {form.weights.map((row, i) => {
              return (
                <div
                  key={i}
                  className={`rounded-2xl border-2 p-4 space-y-3 transition-all ${
                    row.isDefault && row.isActive
                      ? 'border-saffron-400 bg-saffron-50/40'
                      : !row.isActive
                        ? 'border-masala-100 bg-masala-50/60 opacity-60'
                        : 'border-masala-200 bg-white'
                  }`}
                >
                  {/* Row header: weight | price | delivery | tax | description | remove */}
                  <div className="grid grid-cols-2 sm:grid-cols-[90px_110px_110px_90px_1fr_auto] gap-2 items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-masala-400 uppercase tracking-wider">Weight</p>
                      <input
                        type="text" value={row.weight}
                        onChange={e => updateRow(i, 'weight', e.target.value)}
                        placeholder="e.g. 250g"
                        className="w-full rounded-xl border border-masala-200 bg-masala-50 px-2.5 py-2 text-sm font-bold text-masala-900 placeholder:text-masala-400 focus:outline-none focus:border-saffron-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-masala-400 uppercase tracking-wider">
                        Product Price
                      </p>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-masala-400 text-xs pointer-events-none">₹</span>
                        <input
                          type="number" min="0" step="any" value={row.price}
                          onChange={e => updateRow(i, 'price', e.target.value)}
                          placeholder="0"
                          className="w-full rounded-xl border border-masala-200 bg-masala-50 pl-5 pr-2 py-2 text-sm font-bold text-masala-900 placeholder:text-masala-400 focus:outline-none focus:border-saffron-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-masala-400 uppercase tracking-wider">Delivery (₹)</p>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-masala-400 text-xs pointer-events-none">₹</span>
                        <input
                          type="number" min="0" step="any" value={row.deliveryCharge}
                          onChange={e => updateRow(i, 'deliveryCharge', e.target.value)}
                          placeholder="0"
                          className="w-full rounded-xl border border-masala-200 bg-masala-50 pl-5 pr-2 py-2 text-sm font-bold text-masala-900 placeholder:text-masala-400 focus:outline-none focus:border-saffron-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-masala-400 uppercase tracking-wider">Tax (%)</p>
                      <div className="relative">
                        <input
                          type="number" min="0" max="100" step="any" value={row.tax}
                          onChange={e => updateRow(i, 'tax', e.target.value)}
                          placeholder="0"
                          className="w-full rounded-xl border border-masala-200 bg-masala-50 pl-3 pr-6 py-2 text-sm font-bold text-masala-900 placeholder:text-masala-400 focus:outline-none focus:border-saffron-500 focus:bg-white transition-all"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-masala-400 text-xs font-bold pointer-events-none">%</span>
                      </div>
                    </div>

                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <p className="text-[10px] font-bold text-masala-400 uppercase tracking-wider">Description (optional)</p>
                      <input
                        type="text" value={row.description}
                        onChange={e => updateRow(i, 'description', e.target.value)}
                        placeholder="e.g. Popular choice"
                        className="w-full rounded-xl border border-masala-200 bg-masala-50 px-3 py-2 text-sm text-masala-700 placeholder:text-masala-400 focus:outline-none focus:border-saffron-500 focus:bg-white transition-all"
                      />
                    </div>

                    <button type="button" onClick={() => removeRow(i)}
                      className="mt-5 w-7 h-7 flex items-center justify-center rounded-lg text-masala-400 hover:text-chili-600 hover:bg-chili-50 transition-colors col-span-2 sm:col-span-1 justify-self-end sm:justify-self-auto"
                      aria-label="Remove weight variant">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Row footer: default radio + active toggle */}
                  <div className="flex items-center gap-4">
                    {/* Default radio */}
                    <button type="button" onClick={() => setDefault(i)}
                      className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                        row.isDefault ? 'text-saffron-600' : 'text-masala-500 hover:text-saffron-500'
                      }`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        row.isDefault ? 'border-saffron-500 bg-saffron-500' : 'border-masala-300 bg-white'
                      }`}>
                        {row.isDefault && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      Default
                    </button>

                    <div className="flex-1" />

                    {/* Active mini-toggle */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-masala-500">Active</span>
                      <button type="button" onClick={() => updateRow(i, 'isActive', !row.isActive)}
                        className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${row.isActive ? 'bg-cardamom-600' : 'bg-masala-300'}`}
                        role="switch" aria-checked={row.isActive}>
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${row.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Images ── */}
        <SectionLabel label="Product Images" />

        <div className="space-y-2">
          {form.images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {form.images.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-2xl overflow-hidden border border-masala-200 group">
                  <Image src={url} alt={`Image ${i + 1}`} fill className="object-cover" sizes="64px" />
                  <button type="button" onClick={() => set('images', form.images.filter((_, j) => j !== i))}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    aria-label={`Remove image ${i + 1}`}>
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {form.images.length < 5 && (
            <label className={`flex items-center gap-3 w-full border-2 border-dashed rounded-2xl px-4 py-3.5 cursor-pointer transition-colors ${
              uploading ? 'border-masala-200 bg-masala-50 cursor-wait' : 'border-masala-300 hover:border-saffron-400 hover:bg-saffron-50'
            }`}>
              {uploading
                ? <><Loader2 className="w-4 h-4 text-saffron-500 animate-spin shrink-0" /><span className="text-sm text-masala-600">Uploading…</span></>
                : <><Upload className="w-4 h-4 text-saffron-500 shrink-0" /><span className="text-sm text-masala-600">Click to upload images</span><span className="text-xs text-masala-400 ml-auto">max 5</span></>
              }
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
          )}
        </div>

        {/* ── Visibility ── */}
        <SectionLabel label="Visibility" />

        <div className="space-y-4">
          <Toggle checked={form.isActive} onChange={() => set('isActive', !form.isActive)}
            label="Active" description="Visible to customers in the product listing" />
          <Toggle checked={form.isFeatured} onChange={() => set('isFeatured', !form.isFeatured)}
            label="Featured" description='Show in Home page "Best Sellers" section' color="cardamom" />
        </div>

      </div>

      {/* Fixed footer */}
      <div className="shrink-0 px-6 py-4 border-t border-masala-100 bg-white flex items-center gap-3">
        {onDelete && (
          <button type="button" onClick={onDelete}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-chili-600 border border-chili-200 hover:bg-chili-50 transition-colors mr-auto">
            <Trash2 className="w-4 h-4" />Delete
          </button>
        )}
        <Button type="button" variant="ghost" onClick={onCancel} className={onDelete ? '' : 'flex-1'}>Cancel</Button>
        <Button type="submit" loading={saving} className={onDelete ? 'min-w-[7.5rem]' : 'flex-1'}>
          {isEdit ? 'Save Changes' : 'Create Product'}
        </Button>
      </div>

    </form>
  )
}
