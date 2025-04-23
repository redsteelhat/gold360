import { Router } from 'express';
import {
  getAllTransfers,
  getTransferById,
  createTransfer,
  updateTransferStatus,
  updateTransferItem,
  deleteTransfer
} from '../controllers/stockTransfer.controller';

const router = Router();

// Temel transfer işlemleri
router.get('/', getAllTransfers);
router.get('/:id', getTransferById);
router.post('/', createTransfer);
router.put('/:id/status', updateTransferStatus);
router.delete('/:id', deleteTransfer);

// Transfer kalemi işlemleri
router.put('/:transferId/items/:itemId', updateTransferItem);

export default router; 