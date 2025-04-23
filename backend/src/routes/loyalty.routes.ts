import { Router } from 'express';
import loyaltyController from '../controllers/loyalty.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Loyalty
 *   description: Loyalty program management
 */

// Loyalty Programs
router.get('/programs', authMiddleware, loyaltyController.getAllPrograms);
router.get('/programs/:id', authMiddleware, loyaltyController.getProgramById);
router.post('/programs', authMiddleware, loyaltyController.createProgram);
router.put('/programs/:id', authMiddleware, loyaltyController.updateProgram);

// Customer Loyalty
router.get('/customer/:customerId', authMiddleware, loyaltyController.getCustomerLoyalty);
router.get('/transactions/:customerId', authMiddleware, loyaltyController.getCustomerTransactions);
router.post('/transactions', authMiddleware, loyaltyController.createTransaction);

// Admin Operations
router.post('/process-expired', authMiddleware, loyaltyController.processExpiredPoints);

export default router; 