import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../models/user.model';

const router = Router();

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders (Admin/Manager only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Failed to get orders
 */
router.get(
  '/',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  orderController.getAllOrders
);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get an order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       500:
 *         description: Failed to get order
 */
router.get(
  '/:id',
  authenticate,
  orderController.getOrderById
);

// Create a new order
router.post(
  '/',
  authenticate,
  orderController.createOrder
);

// Update order status (admin, manager)
router.patch(
  '/:id/status',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  orderController.updateOrderStatus
);

// Update payment status (admin, manager)
router.patch(
  '/:id/payment',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  orderController.updatePaymentStatus
);

// Cancel order
router.post(
  '/:id/cancel',
  authenticate,
  orderController.cancelOrder
);

export default router; 