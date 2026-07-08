import mongoose, { Schema, Document, Model } from 'mongoose'

interface CartItemSubdoc {
  productId:    mongoose.Types.ObjectId
  qty:          number
  weight?:      string
  weightPrice?: number
  deliveryCharge?: number
  tax?: number
}

export interface CartDocument extends Document {
  userId:          mongoose.Types.ObjectId
  items:           CartItemSubdoc[]
  // Pending checkout — set on /api/orders/create, cleared on /api/orders/confirm
  pendingCode?:    string
  pendingAddress?: string
  pendingExpiry?:  Date
  pendingTotal?:   number
  pendingProductsPriceTotal?: number
  pendingDeliveryTotal?:      number
  pendingTaxTotal?:           number
}

const CartItemSchema = new Schema<CartItemSubdoc>(
  {
    productId:   { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    qty:         { type: Number, required: true, min: 1 },
    weight:      { type: String },
    weightPrice: { type: Number, min: 0 },
    deliveryCharge: { type: Number, min: 0, default: 0 },
    tax:         { type: Number, min: 0, default: 0 },
  },
  { _id: false }
)

const CartSchema = new Schema<CartDocument>(
  {
    userId:         { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items:          [CartItemSchema],
    pendingCode:    { type: String },
    pendingAddress: { type: String },
    pendingExpiry:  { type: Date },
    pendingTotal:   { type: Number },
    pendingProductsPriceTotal: { type: Number },
    pendingDeliveryTotal:      { type: Number },
    pendingTaxTotal:           { type: Number },
  },
  { timestamps: true }
)

const Cart: Model<CartDocument> =
  mongoose.models.Cart ?? mongoose.model<CartDocument>('Cart', CartSchema)

export default Cart
