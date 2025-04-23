import { Router } from 'express';
import stockAlertController from '../controllers/stockAlert.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Stock Alerts
 *   description: Stock alerts management
 */

// Get all stock alerts
router.get('/', authenticate, stockAlertController.getAllAlerts);

// Get dashboard statistics
router.get('/dashboard', authenticate, stockAlertController.getAlertsDashboard);

// Get a stock alert by ID
router.get('/:id', authenticate, stockAlertController.getAlertById);

// Create a new stock alert threshold
router.post('/', authenticate, stockAlertController.createAlertThreshold);

// Run check on inventory and create alerts
router.post('/check', authenticate, stockAlertController.checkAndCreateAlerts);

// Update a stock alert
router.put('/:id', authenticate, stockAlertController.updateAlert);

// Delete a stock alert
router.delete('/:id', authenticate, stockAlertController.deleteAlert);

export default router; 