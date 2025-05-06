import express from 'express';
import * as stockTransferController from '../controllers/stockTransfer.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all stock transfer routes
router.use(authenticate);

// GET all stock transfers
router.get('/', stockTransferController.getAllTransfers);

// GET stock transfer by ID
router.get('/:id', stockTransferController.getTransferById);

// POST create a new stock transfer
router.post('/', stockTransferController.createTransfer);

// PUT update stock transfer status
router.put('/:id/status', stockTransferController.updateTransferStatus);

export default router; 