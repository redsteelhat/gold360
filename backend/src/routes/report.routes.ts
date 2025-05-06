import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../models/user.model';
import * as reportController from '../controllers/report.controller';

const router = express.Router();

/**
 * @swagger
 * /api/reports/dashboard:
 *   get:
 *     summary: Get dashboard overview report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard report retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Failed to get dashboard report
 */
router.get('/dashboard', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), reportController.getDashboardReport);

/**
 * @swagger
 * /api/reports/sales:
 *   get:
 *     summary: Get sales reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report (YYYY-MM-DD)
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: day
 *         description: Group sales data by time period
 *       - in: query
 *         name: productId
 *         schema:
 *           type: integer
 *         description: Filter by product ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *     responses:
 *       200:
 *         description: Sales report retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Failed to get sales report
 */
router.get('/sales', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), reportController.getSalesReport);

/**
 * @swagger
 * /api/reports/inventory:
 *   get:
 *     summary: Get inventory reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Only show low stock items
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: integer
 *         description: Filter by warehouse ID
 *     responses:
 *       200:
 *         description: Inventory report retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Failed to get inventory report
 */
router.get('/inventory', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), reportController.getInventoryReport);

/**
 * @swagger
 * /api/reports/customers:
 *   get:
 *     summary: Get customer reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report (YYYY-MM-DD)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [individual, business]
 *         description: Filter by customer type
 *       - in: query
 *         name: loyaltyTier
 *         schema:
 *           type: string
 *           enum: [bronze, silver, gold, platinum]
 *         description: Filter by loyalty tier
 *     responses:
 *       200:
 *         description: Customer report retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Failed to get customer report
 */
router.get('/customers', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), reportController.getCustomerReport);

export default router; 