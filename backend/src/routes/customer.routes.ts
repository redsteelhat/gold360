import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import customerController from '../controllers/customer.controller';

const router = Router();

// Customer routes
router.get('/', authMiddleware, customerController.getAllCustomers);
router.get('/:id', authMiddleware, customerController.getCustomerById);
router.get('/:id/orders', authMiddleware, customerController.getCustomerOrders);
router.post('/', authMiddleware, customerController.createCustomer);
router.put('/:id', authMiddleware, customerController.updateCustomer);
router.delete('/:id', authMiddleware, customerController.deleteCustomer);

// Customer messaging routes
router.post('/:id/send-message', authMiddleware, customerController.sendCustomerMessage);
router.post('/bulk-message', authMiddleware, customerController.sendBulkCustomerMessage);

export default router; 