import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ProductDocument extends Document {
  name: string
  description: string
  stock: number
  category: string
  images: string[]
  isActive: boolean
  isFeatured: boolean
  weights: { weight: string; price: number; subtitle: string; isDefault: boolean; isActive: boolean; deliveryCharge: number; tax: number; description: string }[]
  createdAt: Date
}

const ProductSchema = new Schema<ProductDocument>(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, required: true },
    stock:       { type: Number, required: true, min: 0, default: 0 },
    category:    { type: String, required: true, trim: true },
    images:      [{ type: String }],
    isActive:    { type: Boolean, default: true },
    isFeatured:  { type: Boolean, default: false },
    weights: [{
      weight:    { type: String, required: true },
      price:     { type: Number, required: true, min: 0 },
      subtitle:  { type: String, default: '' },
      isDefault: { type: Boolean, default: false },
      isActive:  { type: Boolean, default: true },
      deliveryCharge: { type: Number, default: 0, min: 0 },
      tax:         { type: Number, default: 0, min: 0, max: 100 },
      description: { type: String, default: '' },
    }],
  },
  { timestamps: true }
)

ProductSchema.index({ category: 1 })
ProductSchema.index({ isActive: 1 })
ProductSchema.index({ name: 'text', description: 'text' })

if (process.env.NODE_ENV === 'development' || !mongoose.models.Product) {
  delete mongoose.models.Product
}

const Product: Model<ProductDocument> =
  mongoose.models.Product ?? mongoose.model<ProductDocument>('Product', ProductSchema)

export default Product
