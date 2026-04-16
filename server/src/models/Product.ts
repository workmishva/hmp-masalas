import mongoose, { Schema, Document } from 'mongoose';

export interface IWeightOption {
  weightId: string;
  label: string;     // e.g. "100g", "250g", "500g"
  price: number;
  inStock: boolean;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  category: string;
  image: string;
  weightOptions: IWeightOption[];
  featured: boolean;
  isActive: boolean;
  taxPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

const WeightOptionSchema = new Schema<IWeightOption>(
  {
    weightId: { type: String, required: true },
    label: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    inStock: { type: Boolean, default: true },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    image: {
      type: String,
      default: '',
    },
    weightOptions: {
      type: [WeightOptionSchema],
      required: true,
      validate: [(val: IWeightOption[]) => val.length > 0, 'Product must have at least one weight option'],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    taxPercent: {
      type: Number,
      default: 5,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
