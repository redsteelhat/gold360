import { Router } from 'express';
import shippingController from '../controllers/shipping.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../models/user.model';

const router = Router();

/**
 * Shipping endpoints
 */
// Get all shipping records - Admin only
router.get('/all', authenticate, authorize(UserRole.ADMIN), shippingController.getAllShippingRecords);

// Get shipping by ID
router.get('/:id', authenticate, shippingController.getShippingById);

// Get shipping by order ID
router.get('/order/:orderId', authenticate, shippingController.getShippingByOrderId);

// Create a new shipping record
router.post('/', authenticate, shippingController.createShipping);

// Update a shipping record
router.put('/:id', authenticate, shippingController.updateShipping);

// Delete a shipping record - Admin only
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), shippingController.deleteShipping);

// Update shipping status
router.patch('/status/:id', authenticate, shippingController.updateShippingStatus);

// Track a shipment by tracking number and carrier (public endpoint)
router.get('/track/:trackingNumber/:carrier?', shippingController.trackShipment);

// Calculate shipping rates
router.post('/calculate-rates', authenticate, shippingController.calculateShippingRates);

/**
 * Shipping Provider endpoints
 */
// Get all shipping providers
router.get('/providers/all', authenticate, shippingController.getAllShippingProviders);

// Get shipping provider by ID
router.get('/providers/:id', authenticate, shippingController.getShippingProviderById);

// Create a new shipping provider - Admin only
router.post('/providers', authenticate, authorize(UserRole.ADMIN), shippingController.createShippingProvider);

// Update a shipping provider - Admin only
router.put('/providers/:id', authenticate, authorize(UserRole.ADMIN), shippingController.updateShippingProvider);

// Delete a shipping provider - Admin only
router.delete('/providers/:id', authenticate, authorize(UserRole.ADMIN), shippingController.deleteShippingProvider);

// Set shipping provider as default - Admin only
router.patch('/providers/set-default/:id', authenticate, authorize(UserRole.ADMIN), shippingController.setDefaultShippingProvider);

export default router; 