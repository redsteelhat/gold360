import { Router } from 'express';
import loyaltyController from '../controllers/loyalty.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Loyalty
 *   description: Loyalty program management
 */

// Loyalty Programs
router.get('/programs', authenticate, loyaltyController.getAllPrograms);
router.get('/programs/:id', authenticate, loyaltyController.getProgramById);
router.post('/programs', authenticate, loyaltyController.createProgram);
router.put('/programs/:id', authenticate, loyaltyController.updateProgram);

// Customer Loyalty
router.get('/customer/:customerId', authenticate, loyaltyController.getCustomerLoyalty);
router.get('/transactions/:customerId', authenticate, loyaltyController.getCustomerTransactions);
router.post('/transactions', authenticate, loyaltyController.createTransaction);

// Admin Operations
router.post('/process-expired', authenticate, loyaltyController.processExpiredPoints);

export default router; 