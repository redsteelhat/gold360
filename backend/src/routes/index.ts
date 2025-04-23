import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';
import inventoryRoutes from './inventory.routes';
import customerRoutes from './customer.routes';
import stockTransferRoutes from './stockTransfer.routes';
import warehouseRoutes from './warehouse.routes';
import stockAlertRoutes from './stockAlert.routes';
import loyaltyRoutes from './loyalty.routes';
import shipmentRoutes from './shipment.routes';

const router = Router();

// Health check route
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Gold360 API is up and running',
    version: '1.0.0',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/customers', customerRoutes);
router.use('/stock-transfers', stockTransferRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/stock-alerts', stockAlertRoutes);
router.use('/loyalty', loyaltyRoutes);
router.use('/shipments', shipmentRoutes);

export default router; 