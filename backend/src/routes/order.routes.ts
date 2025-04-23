import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication middleware to all order routes
router.use(authMiddleware);

// Routes
router.get('/', orderController.getAllOrders);
router.get('/customer/:customerId', orderController.getOrdersByCustomer);
router.get('/:id', orderController.getOrderById);
router.post('/', orderController.createOrder);
router.patch('/:id/status', orderController.updateOrderStatus);
router.patch('/:id/delivery', orderController.updateDeliveryDate);
router.post('/:id/cancel', orderController.cancelOrder);

export default router; 