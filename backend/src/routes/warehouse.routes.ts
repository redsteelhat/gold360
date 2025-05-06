import express from 'express';
import * as warehouseController from '../controllers/warehouse.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all warehouse routes
router.use(authenticate);

// GET all warehouses
router.get('/', warehouseController.getAllWarehouses);

// GET warehouse by ID
router.get('/:id', warehouseController.getWarehouseById);

// POST create new warehouse
router.post('/', warehouseController.createWarehouse);

// PUT update warehouse
router.put('/:id', warehouseController.updateWarehouse);

// DELETE warehouse (soft delete)
router.delete('/:id', warehouseController.deleteWarehouse);

export default router; 