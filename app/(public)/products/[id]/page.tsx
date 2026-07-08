import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { connectDB } from '@/lib/db'
import Product from '@/models/Product'
import { ImageGallery } from '@/components/products/ImageGallery'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductTabs } from '@/components/products/ProductTabs'
import { AnimatedGrid, AnimatedItem } from '@/components/products/AnimatedGrid'
import { Skeleton } from '@/components/ui/Skeleton'
import { ProductActions } from '@/components/products/ProductActions'
import { ReviewSection } from '@/components/products/ReviewSection'
import type { IProduct } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getProduct(id: string): Promise<IProduct | null> {
  try {
    await connectDB()
    const product = await Product.findById(id).lean()
    if (!product) return null
    return JSON.parse(JSON.stringify(product))
  } catch {
    return null
  }
}

async function getRelated(category: string, excludeId: string): Promise<IProduct[]> {
  const products = await Product.find({
    category,
    isActive: true,
    _id: { $ne: excludeId },
  }).limit(4).lean()
  return JSON.parse(JSON.stringify(products))
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) return { title: 'Not Found — HMP Masala' }
  return {
    title:       `${product.name} — HMP Masala`,
    description: product.description,
  }
}

/* ── Content component — all DB work happens here inside Suspense ── */
async function ProductContent({ id }: { id: string }) {
  const product = await getProduct(id)
  if (!product) notFound()

  const related = await getRelated(product.category, id)

  return (
    <>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-masala-500 mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-saffron-600 transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-saffron-600 transition-colors">Products</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-masala-900 font-medium truncate max-w-50">{product.name}</span>
      </nav>

      {/* Product layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <ImageGallery images={product.images} productName={product.name} />

        <div className="flex flex-col">
          <span className="text-xs font-semibold text-saffron-600 uppercase tracking-wider mb-2">
            {product.category}
          </span>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-masala-900 leading-tight mb-4">
            {product.name}
          </h1>

          {product.stock > 10 ? (
            <div className="inline-flex items-center gap-2 bg-cardamom-100 text-cardamom-600 text-sm font-medium px-3 py-1.5 rounded-full w-fit mb-4">
              <span className="w-2 h-2 rounded-full bg-cardamom-600" />
              In Stock
            </div>
          ) : product.stock > 0 ? (
            <div className="inline-flex items-center gap-2 bg-saffron-100 text-saffron-700 text-sm font-medium px-3 py-1.5 rounded-full w-fit mb-4">
              <span className="w-2 h-2 rounded-full bg-saffron-500" />
              Few Left
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-masala-100 text-masala-600 text-sm font-medium px-3 py-1.5 rounded-full w-fit mb-4">
              <span className="w-2 h-2 rounded-full bg-masala-400" />
              Out of Stock
            </div>
          )}

          <p className="text-masala-600 leading-relaxed mb-6 text-[15px]">{product.description}</p>

          {/* Weight selector + quantity + add-to-cart (handles both desktop inline and mobile sticky) */}
          <ProductActions
            productId={product._id}
            productName={product.name}
            maxStock={product.stock}
            weights={product.weights ?? []}
          />

          <ProductTabs description={product.description} />
        </div>
      </div>

      {/* Reviews */}
      <ReviewSection productId={product._id} />

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-20 pb-24 sm:pb-0">
          <h2 className="font-heading text-2xl font-bold text-masala-900 mb-6">
            More from {product.category}
          </h2>
          <AnimatedGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map((p) => (
              <AnimatedItem key={p._id}>
                <ProductCard product={p} />
              </AnimatedItem>
            ))}
          </AnimatedGrid>
        </section>
      )}

    </>
  )
}

function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <Skeleton className="aspect-square rounded-3xl" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}

/* ── Page shell — static, renders immediately ── */
export default function ProductDetailPage({ params }: PageProps) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <Suspense fallback={<ProductDetailSkeleton />}>
        {params.then(({ id }) => <ProductContent id={id} />)}
      </Suspense>
    </div>
  )
}
