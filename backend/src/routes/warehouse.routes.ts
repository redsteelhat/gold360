import { Router } from 'express';
import { 
  getAllWarehouses, 
  getWarehouseById, 
  createWarehouse, 
  updateWarehouse, 
  deleteWarehouse, 
  getWarehouseInventory,
  getLowStockItems
} from '../controllers/warehouse.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Tüm router'larda authentication middleware kullan
router.use(authMiddleware);

// Depo route tanımlamaları
router.get('/', getAllWarehouses);
router.get('/:id', getWarehouseById);
router.post('/', createWarehouse);
router.put('/:id', updateWarehouse);
router.delete('/:id', deleteWarehouse);

// Envanter ilişkili route'lar
router.get('/:id/inventory', getWarehouseInventory);
router.get('/:id/low-stock', getLowStockItems);

export default router; 