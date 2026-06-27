import express from 'express';
import { getCart, updateCart } from '../controllers/cartController';
import { verifyToken } from '../middlewares/verifyToken';

const router = express.Router();

router.use(verifyToken); // Apply verifyToken to all cart routes

router.get('/', getCart);
router.patch('/', updateCart);

export default router;
