import mongoose, { Schema, Document } from 'mongoose';

// --- Sub-document interfaces ---
export interface IOrderItem {
  productId: string;
  productName: string;
  weightId: string;
  quantity: number;
  weightPrice: number;
  taxPercent: number;
}

export interface IShippingAddress {
  fullName: string;
  house: string;
  street: string;
  nearby?: string;
  cityVillage: string;
  district: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
}

// --- Main Order interface ---
export interface IOrder extends Document {
  orderId: string;
  userId: string;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  shippingMethod: 'standard' | 'express';
  paymentMethod: 'upi' | 'whatsapp';
  paymentStatus: 'pending' | 'completed';
  subtotal: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  status: 'pending_payment' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// --- Sub-schemas ---
const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    weightId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    weightPrice: { type: Number, required: true, min: 0 },
    taxPercent: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: { type: String, required: true, trim: true },
    house: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    nearby: { type: String, trim: true },
    cityVillage: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false }
);

// --- Main Order schema ---
const OrderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: [(val: IOrderItem[]) => val.length > 0, 'Order must have at least one item'],
    },
    shippingAddress: {
      type: ShippingAddressSchema,
      required: true,
    },
    shippingMethod: {
      type: String,
      enum: ['standard', 'express'],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['upi', 'whatsapp'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending_payment', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending_payment',
    },
  },
  {
    timestamps: true, // auto adds createdAt and updatedAt
  }
);

const Order = mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
