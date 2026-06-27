import { Request, Response } from 'express';
import { z } from 'zod';
import Order from '../models/Order';

// Strict validation schema for incoming checkout data
const orderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        weightId: z.string().min(1),
        quantity: z.number().int().positive(),
        weightPrice: z.number().positive(),
        taxPercent: z.number().min(0).max(100),
      })
    )
    .min(1),
  shippingAddress: z.object({
    fullName: z.string().min(2).max(100),
    house: z.string().min(1).max(100),
    street: z.string().min(2).max(255),
    nearby: z.string().max(255).optional(),
    cityVillage: z.string().min(2).max(100),
    district: z.string().min(2).max(100),
    state: z.string().min(2).max(100),
    country: z.string().min(2).max(100),
    postalCode: z.string().min(4).max(20),
    phone: z.string().min(10).max(20),
  }),
  shippingMethod: z.enum(['standard', 'express']),
  paymentMethod: z.enum(['upi', 'whatsapp']),
  shippingCost: z.number().min(0).optional(),
});

const adminOrderFilterSchema = z.object({
  paymentMethod: z.enum(['upi', 'whatsapp']).optional(),
  status: z
    .enum(['pending_payment', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .optional(),
});

const adminOrderStatusUpdateSchema = z.object({
  status: z.enum(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
});

function resolvePaymentStatus(order: { paymentMethod: 'upi' | 'whatsapp'; paymentStatus?: 'pending' | 'completed' | 'cancelled'; status?: string }) {
  if (order.status === 'cancelled') {
    return 'cancelled';
  }
  if (order.paymentStatus === 'pending' || order.paymentStatus === 'completed' || order.paymentStatus === 'cancelled') {
    return order.paymentStatus;
  }
  return order.paymentMethod === 'upi' ? 'completed' : 'pending';
}

function withResolvedPaymentStatus<T extends { paymentMethod: 'upi' | 'whatsapp'; paymentStatus?: 'pending' | 'completed' | 'cancelled'; status?: string }>(
  order: T
) {
  return {
    ...order,
    paymentStatus: resolvePaymentStatus(order),
  };
}

export const checkoutOrder = async (req: Request, res: Response) => {
  try {
    // 1. Validate payload aggressively
    const validatedData = orderSchema.parse(req.body);

    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'User is not authenticated' });
    }

    // 2. Re-calculate totals server-side
    const subtotal = validatedData.items.reduce(
      (sum, item) => sum + item.quantity * item.weightPrice,
      0
    );
    const tax = validatedData.items.reduce(
      (sum, item) => sum + item.quantity * item.weightPrice * (item.taxPercent / 100),
      0
    );

    // Shipping cost comes from checkout logic (distance rule configured by admin UI).
    const shippingCost = Math.max(0, validatedData.shippingCost ?? 0);
    const totalAmount = parseFloat((subtotal + shippingCost + tax).toFixed(2));

    // 3. Generate a unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 4. Save Order to MongoDB
    const newOrder = await Order.create({
      orderId,
      userId: user.uid,
      items: validatedData.items.map((item) => ({
        productId: item.id,
        productName: item.name,
        weightId: item.weightId,
        quantity: item.quantity,
        weightPrice: item.weightPrice,
        taxPercent: item.taxPercent,
      })),
      shippingAddress: validatedData.shippingAddress,
      shippingMethod: validatedData.shippingMethod,
      paymentMethod: validatedData.paymentMethod,
      paymentStatus: validatedData.paymentMethod === 'upi' ? 'completed' : 'pending',
      subtotal,
      shippingCost,
      tax,
      totalAmount,
      status: 'pending_payment',
    });

    console.log(`[ORDER CREATED] ${newOrder.orderId} for user ${user.uid} - INR ${totalAmount}`);

    // 5. Return secure summary
    res.status(201).json({
      message: 'Order created successfully',
      orderId: newOrder.orderId,
      totalToPay: totalAmount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid checkout payload', details: error.errors });
    }
    console.error('Error processing checkout:', error);
    res.status(500).json({ error: 'Internal server error while processing checkout' });
  }
};

// Get all orders for the authenticated user
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'User is not authenticated' });
    }

    const orders = await Order.find({ userId: user.uid }).sort({ createdAt: -1 }).lean();
    const ordersWithPaymentStatus = orders.map((order) => withResolvedPaymentStatus(order));

    res.status(200).json({ orders: ordersWithPaymentStatus });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get a single order by orderId
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'User is not authenticated' });
    }

    const order = await Order.findOne({
      orderId: req.params.orderId,
      userId: user.uid, // ensure user can only access their own orders
    }).lean();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({ order: withResolvedPaymentStatus(order) });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// Cancel an order (for users exiting WhatsApp checkout without sending)
export const cancelUserOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'User is not authenticated' });
    }

    const orderId = req.params.orderId;
    
    // Find the order that belongs to the user and is still in pending_payment status
    const order = await Order.findOneAndUpdate(
      { orderId, userId: user.uid, status: 'pending_payment' },
      { $set: { status: 'cancelled' } },
      { returnDocument: 'after' }
    ).lean();

    if (!order) {
      return res.status(404).json({ error: 'Order not found or cannot be cancelled' });
    }

    res.status(200).json({ message: 'Order cancelled successfully', order: withResolvedPaymentStatus(order) });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};

// Get all orders for admin dashboard (optional filtering by payment/status)
export const getAdminOrders = async (req: Request, res: Response) => {
  try {
    const parsedQuery = adminOrderFilterSchema.parse({
      paymentMethod:
        typeof req.query.paymentMethod === 'string' ? req.query.paymentMethod : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
    });

    const filter: Record<string, unknown> = {};
    if (parsedQuery.paymentMethod) {
      filter.paymentMethod = parsedQuery.paymentMethod;
    }
    if (parsedQuery.status) {
      filter.status = parsedQuery.status;
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
    const ordersWithPaymentStatus = orders.map((order) => withResolvedPaymentStatus(order));
    res.status(200).json({ orders: ordersWithPaymentStatus });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid filter query', details: error.errors });
    }
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ error: 'Failed to fetch admin orders' });
  }
};

// Update an order status from admin dashboard (approve/complete/cancel flow)
export const updateOrderStatusByAdmin = async (req: Request, res: Response) => {
  try {
    const { status } = adminOrderStatusUpdateSchema.parse(req.body);

    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: req.params.orderId },
      { $set: { status } },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({
      message: 'Order status updated',
      order: withResolvedPaymentStatus(updatedOrder),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid status update request', details: error.errors });
    }
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// Mark payment complete for WhatsApp orders only
export const markWhatsAppPaymentCompletedByAdmin = async (req: Request, res: Response) => {
  try {
    const existingOrder = await Order.findOne({ orderId: req.params.orderId }).lean();
    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (existingOrder.paymentMethod !== 'whatsapp') {
      return res.status(400).json({ error: 'Payment completion can only be marked for WhatsApp orders' });
    }

    const existingPaymentStatus = resolvePaymentStatus(existingOrder);
    if (existingPaymentStatus === 'completed') {
      return res.status(200).json({
        message: 'Payment was already completed',
        order: withResolvedPaymentStatus(existingOrder),
      });
    }

    const updatePayload: Record<string, unknown> = { paymentStatus: 'completed' };
    if (existingOrder.status === 'pending_payment') {
      updatePayload.status = 'confirmed';
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: req.params.orderId },
      { $set: updatePayload },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({
      message: 'Payment marked as completed',
      order: withResolvedPaymentStatus(updatedOrder),
    });
  } catch (error) {
    console.error('Error marking WhatsApp payment as completed:', error);
    res.status(500).json({ error: 'Failed to mark payment as completed' });
  }
};

// Get aggregated dashboard stats for the admin overview
export const getAdminDashboardStats = async (req: Request, res: Response) => {
  try {
    const sinceParam = req.query.since as string | undefined;
    const sinceDate = sinceParam ? new Date(sinceParam) : undefined;
    const matchFilter: any = {};
    if (sinceDate && !isNaN(sinceDate.getTime())) {
      matchFilter.createdAt = { $gte: sinceDate };
    }

    const [
      totalOrders,
      pendingOrders,
      revenueResult,
      uniqueCustomerIds,
      dailySales,
      statusBreakdown,
    ] = await Promise.all([
      Order.countDocuments(matchFilter),
      Order.countDocuments({ ...matchFilter, status: { $in: ['pending_payment', 'confirmed', 'processing'] } }),
      Order.aggregate([
        { $match: { ...matchFilter, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.distinct('userId', matchFilter),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: sinceDate && sinceDate.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 ? sinceDate : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            orders: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Fill missing days in the last 7 days with zeros
    const dailySalesMap = new Map(dailySales.map((d: any) => [d._id, d]));
    const filledDailySales = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const existing = dailySalesMap.get(dateStr);
      filledDailySales.push({
        date: dateStr,
        day: dayName,
        orders: existing ? existing.orders : 0,
        revenue: existing ? existing.revenue : 0,
      });
    }

    const statusMap: Record<string, number> = {};
    statusBreakdown.forEach((s: any) => {
      statusMap[s._id] = s.count;
    });

    res.status(200).json({
      totalOrders,
      pendingOrders,
      totalRevenue,
      totalCustomers: uniqueCustomerIds.length,
      dailySales: filledDailySales,
      statusBreakdown: statusMap,
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};
