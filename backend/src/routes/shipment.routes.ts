import { Router } from 'express';
import shipmentController from '../controllers/shipment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Shipments
 *   description: Shipment management
 */

// Get all shipments
router.get('/', authenticate, shipmentController.getAllShipments);

// Get a shipment by ID
router.get('/:id', authenticate, shipmentController.getShipmentById);

// Create a new shipment
router.post('/', authenticate, shipmentController.createShipment);

// Update a shipment
router.put('/:id', authenticate, shipmentController.updateShipment);

// Track a shipment by tracking number
router.get('/track/:trackingNumber', authenticate, shipmentController.trackShipment);

// Get all notifications for a shipment
router.get('/notifications/:id', authenticate, shipmentController.getShipmentNotifications);

// Send a notification for a shipment
router.post('/notifications', authenticate, shipmentController.sendShipmentNotification);

// Process pending notifications
router.post('/process-notifications', authenticate, shipmentController.processNotifications);

export default router; 