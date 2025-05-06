import { Request, Response } from 'express';
import sequelize from '../config/database';
import { Product } from '../models/product.model';
import { Warehouse } from '../models/warehouse.model';
import { StockTransaction, TransactionType } from '../models/stockTransaction.model';
import { StockAlert, AlertType, AlertStatus } from '../models/stockAlert.model';

// Get inventory levels for all products or filtered by warehouse
export const getInventory = async (req: Request, res: Response) => {
  try {
    const { warehouseId } = req.query;
    
    // Build the query to join product data with inventory data
    const query = `
      SELECT 
        p.id, p.name, p.sku, p.category, 
        w.id as warehouse_id, w.name as warehouse_name,
        COALESCE(SUM(CASE WHEN t.type = 'purchase' OR t.type = 'initial' THEN t.quantity 
                         WHEN t.type = 'sale' OR t.type = 'adjustment' THEN -t.quantity 
                         ELSE 0 END), 0) as current_quantity,
        p.price
      FROM products p
      CROSS JOIN warehouses w
      LEFT JOIN stock_transactions t ON p.id = t.product_id AND w.id = t.warehouse_id
      WHERE w.is_active = true
      ${warehouseId ? 'AND w.id = :warehouseId' : ''}
      GROUP BY p.id, w.id
      ORDER BY p.name, w.name
    `;
    
    const replacements = warehouseId ? { warehouseId } : {};
    const inventory = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });
    
    return res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching inventory',
      error,
    });
  }
};

// Get inventory details for a specific product
export const getProductInventory = async (req: Request, res: Response) => {
  const { productId } = req.params;
  
  try {
    const product = await Product.findByPk(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${productId} not found`,
      });
    }
    
    // Get inventory levels across all warehouses
    const query = `
      SELECT 
        w.id as warehouse_id, w.name as warehouse_name,
        COALESCE(SUM(CASE WHEN t.type = 'purchase' OR t.type = 'initial' THEN t.quantity 
                         WHEN t.type = 'sale' OR t.type = 'adjustment' THEN -t.quantity 
                         ELSE 0 END), 0) as current_quantity
      FROM warehouses w
      LEFT JOIN stock_transactions t ON w.id = t.warehouse_id AND t.product_id = :productId
      WHERE w.is_active = true
      GROUP BY w.id
      ORDER BY w.name
    `;
    
    const inventoryByWarehouse = await sequelize.query(query, {
      replacements: { productId },
      type: sequelize.QueryTypes.SELECT,
    });
    
    // Get recent transactions
    const recentTransactions = await StockTransaction.findAll({
      where: { productId },
      order: [['createdAt', 'DESC']],
      limit: 10,
    });
    
    return res.status(200).json({
      success: true,
      data: {
        product,
        inventoryByWarehouse,
        recentTransactions,
      },
    });
  } catch (error) {
    console.error(`Error fetching inventory for product ID ${productId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching product inventory',
      error,
    });
  }
};

// Add stock to inventory
export const addStock = async (req: Request, res: Response) => {
  const { productId, warehouseId, quantity, notes, unitCost } = req.body;
  const userId = (req as any).user.id; // From auth middleware
  
  try {
    // Validate required fields
    if (!productId || !warehouseId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid required fields',
      });
    }
    
    // Check if product and warehouse exist
    const product = await Product.findByPk(productId);
    const warehouse = await Warehouse.findByPk(warehouseId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${productId} not found`,
      });
    }
    
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: `Warehouse with ID ${warehouseId} not found`,
      });
    }
    
    // Get current quantity
    const currentQuantityQuery = `
      SELECT COALESCE(SUM(CASE WHEN type = 'purchase' OR type = 'initial' THEN quantity 
                              WHEN type = 'sale' OR type = 'adjustment' THEN -quantity 
                              ELSE 0 END), 0) as current_quantity
      FROM stock_transactions
      WHERE product_id = :productId AND warehouse_id = :warehouseId
    `;
    
    const [currentQuantityResult] = await sequelize.query(currentQuantityQuery, {
      replacements: { productId, warehouseId },
      type: sequelize.QueryTypes.SELECT,
    });
    
    const currentQuantity = parseFloat((currentQuantityResult as any).current_quantity || 0);
    const newQuantity = currentQuantity + parseFloat(quantity);
    
    // Create stock transaction
    const transaction = await StockTransaction.create({
      productId,
      warehouseId,
      quantity,
      type: TransactionType.PURCHASE,
      notes,
      performedBy: userId,
      previousQuantity: currentQuantity,
      newQuantity,
      unitCost,
    });
    
    // Update product stock quantity
    await product.update({
      stockQuantity: product.stockQuantity + parseFloat(quantity),
    });
    
    // Check if this resolves any active alerts
    const activeAlerts = await StockAlert.findAll({
      where: {
        productId,
        warehouseId,
        status: AlertStatus.ACTIVE,
        type: AlertType.LOW_STOCK,
      },
    });
    
    for (const alert of activeAlerts) {
      if (newQuantity > alert.threshold) {
        await alert.update({
          status: AlertStatus.RESOLVED,
          resolvedAt: new Date(),
          resolvedBy: userId,
        });
      }
    }
    
    return res.status(201).json({
      success: true,
      message: 'Stock added successfully',
      data: {
        transaction,
        newQuantity,
      },
    });
  } catch (error) {
    console.error('Error adding stock:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while adding stock',
      error,
    });
  }
};

// Adjust inventory (can be used for stock takes/counts)
export const adjustStock = async (req: Request, res: Response) => {
  const { productId, warehouseId, newActualQuantity, notes } = req.body;
  const userId = (req as any).user.id; // From auth middleware
  
  try {
    // Validate required fields
    if (!productId || !warehouseId || newActualQuantity === undefined || newActualQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid required fields',
      });
    }
    
    // Check if product and warehouse exist
    const product = await Product.findByPk(productId);
    const warehouse = await Warehouse.findByPk(warehouseId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${productId} not found`,
      });
    }
    
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: `Warehouse with ID ${warehouseId} not found`,
      });
    }
    
    // Get current quantity
    const currentQuantityQuery = `
      SELECT COALESCE(SUM(CASE WHEN type = 'purchase' OR type = 'initial' THEN quantity 
                              WHEN type = 'sale' OR type = 'adjustment' THEN -quantity 
                              ELSE 0 END), 0) as current_quantity
      FROM stock_transactions
      WHERE product_id = :productId AND warehouse_id = :warehouseId
    `;
    
    const [currentQuantityResult] = await sequelize.query(currentQuantityQuery, {
      replacements: { productId, warehouseId },
      type: sequelize.QueryTypes.SELECT,
    });
    
    const currentQuantity = parseFloat((currentQuantityResult as any).current_quantity || 0);
    const adjustmentQuantity = Math.abs(currentQuantity - parseFloat(newActualQuantity));
    
    // If no adjustment needed
    if (currentQuantity === parseFloat(newActualQuantity)) {
      return res.status(200).json({
        success: true,
        message: 'No adjustment needed, inventory is already correct',
        data: {
          currentQuantity,
        },
      });
    }
    
    // Create adjustment transaction (positive or negative)
    const transaction = await StockTransaction.create({
      productId,
      warehouseId,
      quantity: adjustmentQuantity,
      type: TransactionType.ADJUSTMENT,
      notes: notes || 'Inventory adjustment',
      performedBy: userId,
      previousQuantity: currentQuantity,
      newQuantity: parseFloat(newActualQuantity),
    });
    
    // Update product stock quantity
    const productTotalAdjustment = parseFloat(newActualQuantity) - currentQuantity;
    await product.update({
      stockQuantity: product.stockQuantity + productTotalAdjustment,
    });
    
    // Check for low stock alert conditions
    const minimumStockLevel = 5; // This could be configurable per product/warehouse
    
    if (parseFloat(newActualQuantity) <= minimumStockLevel) {
      // Check if an active alert already exists
      const existingAlert = await StockAlert.findOne({
        where: {
          productId,
          warehouseId,
          status: AlertStatus.ACTIVE,
          type: AlertType.LOW_STOCK,
        },
      });
      
      if (!existingAlert) {
        // Create a new alert
        await StockAlert.create({
          productId,
          warehouseId,
          type: AlertType.LOW_STOCK,
          status: AlertStatus.ACTIVE,
          threshold: minimumStockLevel,
          currentQuantity: parseFloat(newActualQuantity),
          message: `Low stock alert: ${product.name} is below minimum stock level (${minimumStockLevel})`,
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Stock adjusted successfully',
      data: {
        transaction,
        previousQuantity: currentQuantity,
        newQuantity: parseFloat(newActualQuantity),
      },
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while adjusting stock',
      error,
    });
  }
};

// Get low stock alerts
export const getLowStockAlerts = async (req: Request, res: Response) => {
  try {
    const alerts = await StockAlert.findAll({
      where: {
        status: AlertStatus.ACTIVE,
        type: AlertType.LOW_STOCK,
      },
      include: [
        { model: Product },
        { model: Warehouse },
      ],
      order: [['createdAt', 'DESC']],
    });
    
    return res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching low stock alerts',
      error,
    });
  }
};

// Resolve stock alert
export const resolveStockAlert = async (req: Request, res: Response) => {
  const { alertId } = req.params;
  const userId = (req as any).user.id; // From auth middleware
  
  try {
    const alert = await StockAlert.findByPk(alertId);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: `Alert with ID ${alertId} not found`,
      });
    }
    
    if (alert.status !== AlertStatus.ACTIVE) {
      return res.status(400).json({
        success: false,
        message: `Alert is already ${alert.status}`,
      });
    }
    
    await alert.update({
      status: AlertStatus.RESOLVED,
      resolvedAt: new Date(),
      resolvedBy: userId,
    });
    
    return res.status(200).json({
      success: true,
      message: 'Alert resolved successfully',
      data: alert,
    });
  } catch (error) {
    console.error(`Error resolving alert with ID ${alertId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Server error while resolving alert',
      error,
    });
  }
}; 