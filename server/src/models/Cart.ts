import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem {
  id: string; // product id
  name: string;
  weightId: string;
  price: number;
  weightPrice: number;
  quantity: number;
  image: string;
  taxPercent: number;
}

export interface ICart extends Document {
  userId: string;
  items: ICartItem[];
}

const CartItemSchema = new Schema<ICartItem>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    weightId: { type: String, required: true },
    price: { type: Number, required: true },
    weightPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    image: { type: String, required: true },
    taxPercent: { type: Number, default: 5 },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    userId: { type: String, required: true, unique: true },
    items: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true }
);

const Cart = mongoose.model<ICart>('Cart', CartSchema);
export default Cart;
