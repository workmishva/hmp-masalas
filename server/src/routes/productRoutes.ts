import express from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { verifyAdmin } from '../middlewares/verifyAdmin';

const router = express.Router();

router.get('/', getProducts);
router.post('/', verifyAdmin, createProduct);
router.patch('/:id', verifyAdmin, updateProduct);
router.delete('/:id', verifyAdmin, deleteProduct);

export default router;
