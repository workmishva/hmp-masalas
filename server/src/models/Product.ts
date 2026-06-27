import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
  featured: boolean;
  taxPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
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
    featured: {
      type: Boolean,
      default: false,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Product = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
