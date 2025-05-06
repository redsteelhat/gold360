import express from 'express';
import * as inventoryController from '../controllers/inventory.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all inventory routes
router.use(authenticate);

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Get inventory status
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory status retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Failed to get inventory status
 */
router.get('/', inventoryController.getInventory);

/**
 * @swagger
 * /api/inventory/low-stock:
 *   get:
 *     summary: Get low stock items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Low stock items retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Failed to get low stock items
 */
router.get('/low-stock', inventoryController.getLowStockAlerts);

// GET inventory details for a specific product
router.get('/product/:productId', inventoryController.getProductInventory);

// POST add stock to inventory
router.post('/add', inventoryController.addStock);

// POST adjust inventory
router.post('/adjust', inventoryController.adjustStock);

// POST resolve a stock alert
router.post('/alerts/:alertId/resolve', inventoryController.resolveStockAlert);

export default router; 