import { Types } from 'mongoose'

export type UserRole = 'admin' | 'enduser'

export interface IUser {
  _id:    string
  name:   string
  email:  string
  phone:  string
  role:   UserRole
  // Legacy
  address?: string
  // Structured profile
  firstName?: string
  lastName?:  string
  house?:     string
  street?:    string
  landmark?:  string
  city?:      string
  district?:  string
  state?:     string
  pincode?:   string
  profileCompleted: boolean
  createdAt: Date
}

export interface IProductWeight {
  weight:     string
  price:      number
  subtitle?:  string
  isDefault?: boolean
  isActive?:  boolean
  deliveryCharge?: number
  tax?: number
  description?: string
}

export interface IProduct {
  _id: string
  name: string
  description: string
  stock: number
  category: string
  images: string[]
  isActive: boolean
  isFeatured: boolean
  weights?: IProductWeight[]
  createdAt: Date
}

export interface ICartItem {
  productId: string | IProduct
  qty: number
  weight?: string
  weightPrice?: number
  deliveryCharge?: number
  tax?: number
}

export interface ICart {
  _id: string
  userId: string
  items: ICartItem[]
}

export type OrderStatus =
  | 'Payment Pending'
  | 'Payment Confirmed'
  | 'Packed'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'

export type PaymentStatus = 'Unpaid' | 'Paid'

export interface IOrderItem {
  productId: string
  name: string
  price: number
  qty: number
  weight?: string
  deliveryCharge?: number
  tax?: number
}

export interface IOrder {
  _id: string
  userId: string
  items: IOrderItem[]
  productsPriceTotal: number
  deliveryTotal: number
  taxTotal: number
  totalAmount: number
  deliveryAddress: string
  verificationCode: string
  isVerified: boolean
  status: OrderStatus
  paymentStatus: PaymentStatus
  cancelledByUser?: boolean
  archivedAt?: Date
  createdAt: Date
}

export interface ISettings {
  paymentEnabled: boolean
  whatsappVerificationEnabled: boolean
  whatsappNumber: string
  storeName: string
}

export interface IReview {
  _id:       string
  userId:    string
  productId: string
  orderId:   string
  rating:    number
  title:     string
  comment:   string
  isHidden:  boolean
  createdAt: Date
  userName?: string
}

export interface IAdminReview extends IReview {
  userEmail:     string
  userPhone:     string
  productName:   string
  orderStatus:   string
  orderVerified: boolean
}

export interface ApiSuccess<T = unknown> {
  data: T
}

export interface ApiError {
  error: string
}
