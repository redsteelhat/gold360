import { Router } from 'express';
import inventoryController from '../controllers/inventory.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Apply auth middleware to all inventory routes
router.use(authMiddleware);

// Inventory routes
router.get('/', inventoryController.getAllInventory);
router.get('/:id', inventoryController.getInventoryById);
router.post('/', inventoryController.createInventoryItem);
router.put('/:id', inventoryController.updateInventoryItem);
router.delete('/:id', inventoryController.deleteInventoryItem);
router.post('/:id/adjust', inventoryController.adjustInventory);
router.get('/barcode/:barcode', inventoryController.getInventoryByBarcode);
router.get('/rfid/:rfidTag', inventoryController.getInventoryByRfid);
router.post('/log-stock-check', inventoryController.logStockCheck);

export default router; 