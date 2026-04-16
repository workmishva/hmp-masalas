import mongoose, { Schema, Document } from 'mongoose';

export interface IAddress {
  house?: string;
  street?: string;
  nearby?: string;
  cityVillage?: string;
  district?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  phone?: string;
  displayName: string;
  photoURL?: string;
  address?: IAddress;
  onboardingCompleted?: boolean;
  role: 'customer' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    house: { type: String, trim: true },
    street: { type: String, trim: true },
    nearby: { type: String, trim: true },
    cityVillage: { type: String, trim: true },
    district: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    postalCode: { type: String, trim: true },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    photoURL: {
      type: String,
      default: '',
    },
    address: {
      type: AddressSchema,
      default: {},
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
