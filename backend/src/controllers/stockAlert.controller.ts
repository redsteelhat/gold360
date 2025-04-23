import { Request, Response } from 'express';
import { StockAlert, Product, Warehouse, Inventory } from '../models';
import { Op } from 'sequelize';

/**
 * @swagger
 * tags:
 *   name: Stock Alerts
 *   description: Stock alert management
 */

/**
 * @swagger
 * /api/stock-alerts:
 *   get:
 *     summary: Get all stock alerts
 *     tags: [Stock Alerts]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, resolved, ignored]
 *         description: Filter by alert status
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: integer
 *         description: Filter by warehouse ID
 *     responses:
 *       200:
 *         description: List of stock alerts
 *       500:
 *         description: Server error
 */
export const getAllAlerts = async (req: Request, res: Response) => {
  try {
    const { status, warehouseId } = req.query;
    
    const whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (warehouseId) {
      whereClause.warehouseId = warehouseId;
    }
    
    const alerts = await StockAlert.findAll({
      where: whereClause,
      include: [
        { model: Product, as: 'Product', attributes: ['id', 'name', 'sku', 'description'] },
        { model: Warehouse, as: 'Warehouse', attributes: ['id', 'name', 'location'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json(alerts);
  } catch (error) {
    console.error('Error fetching stock alerts:', error);
    return res.status(500).json({ error: 'Failed to fetch stock alerts' });
  }
};

/**
 * @swagger
 * /api/stock-alerts/{id}:
 *   get:
 *     summary: Get stock alert by ID
 *     tags: [Stock Alerts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Stock alert details
 *       404:
 *         description: Alert not found
 *       500:
 *         description: Server error
 */
export const getAlertById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const alert = await StockAlert.findByPk(id, {
      include: [
        { model: Product, as: 'Product', attributes: ['id', 'name', 'sku', 'description'] },
        { model: Warehouse, as: 'Warehouse', attributes: ['id', 'name', 'location'] }
      ]
    });
    
    if (!alert) {
      return res.status(404).json({ error: 'Stock alert not found' });
    }
    
    return res.status(200).json(alert);
  } catch (error) {
    console.error('Error fetching stock alert:', error);
    return res.status(500).json({ error: 'Failed to fetch stock alert' });
  }
};

/**
 * @swagger
 * /api/stock-alerts:
 *   post:
 *     summary: Create a new stock alert threshold
 *     tags: [Stock Alerts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - warehouseId
 *               - threshold
 *             properties:
 *               productId:
 *                 type: integer
 *               warehouseId:
 *                 type: integer
 *               threshold:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Alert threshold created
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
export const createAlertThreshold = async (req: Request, res: Response) => {
  try {
    const { productId, warehouseId, threshold } = req.body;
    
    if (!productId || !warehouseId || !threshold) {
      return res.status(400).json({ error: 'Product ID, warehouse ID, and threshold are required' });
    }
    
    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(400).json({ error: 'Product not found' });
    }
    
    // Check if warehouse exists
    const warehouse = await Warehouse.findByPk(warehouseId);
    if (!warehouse) {
      return res.status(400).json({ error: 'Warehouse not found' });
    }
    
    // Get current stock level
    const inventory = await Inventory.findOne({
      where: { productId, warehouseId }
    });
    
    const currentLevel = inventory ? inventory.quantity : 0;
    
    // Check if an alert already exists
    const existingAlert = await StockAlert.findOne({
      where: { productId, warehouseId }
    });
    
    if (existingAlert) {
      // Update existing alert
      existingAlert.threshold = threshold;
      existingAlert.currentLevel = currentLevel;
      existingAlert.status = currentLevel <= threshold ? 'active' : 'resolved';
      await existingAlert.save();
      
      return res.status(200).json(existingAlert);
    }
    
    // Create new alert
    const newAlert = await StockAlert.create({
      productId,
      warehouseId,
      threshold,
      currentLevel,
      status: currentLevel <= threshold ? 'active' : 'resolved',
      notificationSent: false
    });
    
    return res.status(201).json(newAlert);
  } catch (error) {
    console.error('Error creating stock alert threshold:', error);
    return res.status(500).json({ error: 'Failed to create stock alert threshold' });
  }
};

/**
 * @swagger
 * /api/stock-alerts/{id}:
 *   put:
 *     summary: Update stock alert status
 *     tags: [Stock Alerts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, resolved, ignored]
 *               threshold:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Alert updated
 *       404:
 *         description: Alert not found
 *       500:
 *         description: Server error
 */
export const updateAlert = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, threshold } = req.body;
    
    const alert = await StockAlert.findByPk(id);
    
    if (!alert) {
      return res.status(404).json({ error: 'Stock alert not found' });
    }
    
    if (status) {
      alert.status = status;
    }
    
    if (threshold) {
      alert.threshold = threshold;
      
      // Update status based on new threshold
      const inventory = await Inventory.findOne({
        where: { productId: alert.productId, warehouseId: alert.warehouseId }
      });
      
      const currentLevel = inventory ? inventory.quantity : 0;
      alert.currentLevel = currentLevel;
      
      if (currentLevel <= threshold && status !== 'ignored') {
        alert.status = 'active';
      } else if (currentLevel > threshold && status !== 'ignored') {
        alert.status = 'resolved';
      }
    }
    
    await alert.save();
    
    return res.status(200).json(alert);
  } catch (error) {
    console.error('Error updating stock alert:', error);
    return res.status(500).json({ error: 'Failed to update stock alert' });
  }
};

/**
 * @swagger
 * /api/stock-alerts/{id}:
 *   delete:
 *     summary: Delete a stock alert
 *     tags: [Stock Alerts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Alert deleted
 *       404:
 *         description: Alert not found
 *       500:
 *         description: Server error
 */
export const deleteAlert = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const alert = await StockAlert.findByPk(id);
    
    if (!alert) {
      return res.status(404).json({ error: 'Stock alert not found' });
    }
    
    await alert.destroy();
    
    return res.status(200).json({ message: 'Stock alert deleted successfully' });
  } catch (error) {
    console.error('Error deleting stock alert:', error);
    return res.status(500).json({ error: 'Failed to delete stock alert' });
  }
};

/**
 * @swagger
 * /api/stock-alerts/check:
 *   post:
 *     summary: Check all inventory items against thresholds and create alerts
 *     tags: [Stock Alerts]
 *     responses:
 *       200:
 *         description: Alerts checked and updated
 *       500:
 *         description: Server error
 */
export const checkAndCreateAlerts = async (req: Request, res: Response) => {
  try {
    // Get all inventory items
    const inventoryItems = await Inventory.findAll({
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'name'] }
      ]
    });
    
    const results = {
      created: 0,
      updated: 0,
      resolved: 0
    };
    
    for (const item of inventoryItems) {
      // Check if there's already an alert for this product/warehouse
      const existingAlert = await StockAlert.findOne({
        where: {
          productId: item.productId,
          warehouseId: item.warehouseId
        }
      });
      
      if (existingAlert) {
        // Update existing alert
        existingAlert.currentLevel = item.quantity;
        
        // Update status based on threshold
        if (item.quantity <= existingAlert.threshold && existingAlert.status !== 'ignored') {
          existingAlert.status = 'active';
          results.updated++;
        } else if (item.quantity > existingAlert.threshold && existingAlert.status === 'active') {
          existingAlert.status = 'resolved';
          results.resolved++;
        }
        
        await existingAlert.save();
      } else if (item.quantity <= 10) { // Default threshold
        // Create new alert if stock is low
        await StockAlert.create({
          productId: item.productId,
          warehouseId: item.warehouseId,
          threshold: 10, // Default threshold
          currentLevel: item.quantity,
          status: 'active',
          notificationSent: false
        });
        
        results.created++;
      }
    }
    
    return res.status(200).json({
      message: 'Stock alerts checked and updated',
      results
    });
  } catch (error) {
    console.error('Error checking stock alerts:', error);
    return res.status(500).json({ error: 'Failed to check stock alerts' });
  }
};

/**
 * @swagger
 * /api/stock-alerts/dashboard:
 *   get:
 *     summary: Get stock alert statistics for dashboard
 *     tags: [Stock Alerts]
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *       500:
 *         description: Server error
 */
export const getAlertsDashboard = async (req: Request, res: Response) => {
  try {
    const activeAlerts = await StockAlert.count({
      where: { status: 'active' }
    });
    
    const totalAlerts = await StockAlert.count();
    
    const criticalAlerts = await StockAlert.count({
      where: { 
        status: 'active',
        currentLevel: 0 // Out of stock
      }
    });
    
    const recentAlerts = await StockAlert.findAll({
      where: { status: 'active' },
      include: [
        { model: Product, as: 'Product', attributes: ['id', 'name', 'sku'] },
        { model: Warehouse, as: 'Warehouse', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    return res.status(200).json({
      activeAlerts,
      totalAlerts,
      criticalAlerts,
      recentAlerts
    });
  } catch (error) {
    console.error('Error fetching alerts dashboard:', error);
    return res.status(500).json({ error: 'Failed to fetch alerts dashboard' });
  }
};

export default {
  getAllAlerts,
  getAlertById,
  createAlertThreshold,
  updateAlert,
  deleteAlert,
  checkAndCreateAlerts,
  getAlertsDashboard
}; 