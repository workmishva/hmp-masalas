import { Router } from 'express';
import {
  checkoutOrder,
  getUserOrders,
  getOrderById,
  getAdminOrders,
  getAdminDashboardStats,
  updateOrderStatusByAdmin,
  markWhatsAppPaymentCompletedByAdmin,
  cancelUserOrder,
} from '../controllers/orderController';
import { verifyToken } from '../middlewares/verifyToken';
import { verifyAdmin } from '../middlewares/verifyAdmin';

const router = Router();

// Admin order-management routes
router.get('/admin/stats', verifyAdmin, getAdminDashboardStats);
router.get('/admin/all', verifyAdmin, getAdminOrders);
router.patch('/admin/:orderId/status', verifyAdmin, updateOrderStatusByAdmin);
router.patch('/admin/:orderId/payment-completed', verifyAdmin, markWhatsAppPaymentCompletedByAdmin);

// Customer routes
router.post('/checkout', verifyToken, checkoutOrder);
router.get('/', verifyToken, getUserOrders);
router.get('/:orderId', verifyToken, getOrderById);
router.patch('/:orderId/cancel', verifyToken, cancelUserOrder);

export default router;
