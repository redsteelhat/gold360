import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  getFeaturedProducts,
  getLowStockProducts
} from '../controllers/product.controller';

const router = Router();

// Product routes
router.get('/', getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/:id', getProductById);
router.post('/', authMiddleware, createProduct);
router.put('/:id', authMiddleware, updateProduct);
router.delete('/:id', authMiddleware, deleteProduct);
router.patch('/:id/stock', authMiddleware, updateProductStock);

export default router; 