import mongoose, { Schema, Document } from 'mongoose';

export interface IStoreConfig extends Document {
  whatsappNumber: string;
  storeLatitude: number | null;
  storeLongitude: number | null;
  freeShippingRadiusKm: number;
  outsideRadiusShippingCharge: number;
  upiPayment: boolean;
}

const StoreConfigSchema = new Schema<IStoreConfig>(
  {
    whatsappNumber: { type: String, required: true },
    storeLatitude: { type: Number, default: null },
    storeLongitude: { type: Number, default: null },
    freeShippingRadiusKm: { type: Number, required: true, default: 10 },
    outsideRadiusShippingCharge: { type: Number, required: true, default: 50 },
    upiPayment: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

const StoreConfig = mongoose.model<IStoreConfig>('StoreConfig', StoreConfigSchema);
export default StoreConfig;
