import { Request, Response } from 'express';
import { Inventory, Product, Warehouse, StockTransaction, User, StockAlert } from '../models';
import { Op } from 'sequelize';
import sequelize from '../config/database';

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Inventory management operations
 */

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Get all inventory items
 *     tags: [Inventory]
 *     parameters:
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: integer
 *         description: Filter by warehouse ID
 *       - in: query
 *         name: productId
 *         schema:
 *           type: integer
 *         description: Filter by product ID
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Filter for low stock items only
 *     responses:
 *       200:
 *         description: List of inventory items
 *       500:
 *         description: Server error
 */
export const getAllInventory = async (req: Request, res: Response) => {
  try {
    const { warehouseId, productId, lowStock } = req.query;
    
    const whereClause: any = {};
    
    if (warehouseId) {
      whereClause.warehouseId = warehouseId;
    }
    
    if (productId) {
      whereClause.productId = productId;
    }
    
    if (lowStock === 'true') {
      whereClause[Op.and] = sequelize.literal('quantity <= alert_threshold');
    }
    
    const inventory = await Inventory.findAll({
      where: whereClause,
      include: [
        { model: Product, as: 'product' },
        { model: Warehouse, as: 'warehouse' }
      ],
      order: [['updatedAt', 'DESC']]
    });
    
    return res.status(200).json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return res.status(500).json({ error: 'Failed to fetch inventory data' });
  }
};

/**
 * @swagger
 * /api/inventory/{id}:
 *   get:
 *     summary: Get inventory item by ID
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inventory item details
 *       404:
 *         description: Inventory item not found
 *       500:
 *         description: Server error
 */
export const getInventoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const inventoryItem = await Inventory.findByPk(id, {
      include: [
        { model: Product, as: 'product' },
        { model: Warehouse, as: 'warehouse' },
        { model: StockTransaction, as: 'transactions' }
      ]
    });
    
    if (!inventoryItem) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    return res.status(200).json(inventoryItem);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    return res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
};

/**
 * @swagger
 * /api/inventory:
 *   post:
 *     summary: Create a new inventory item
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - warehouseId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: integer
 *               warehouseId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               minQuantity:
 *                 type: integer
 *               maxQuantity:
 *                 type: integer
 *               alertThreshold:
 *                 type: integer
 *               shelfLocation:
 *                 type: string
 *               barcode:
 *                 type: string
 *               rfidTag:
 *                 type: string
 *     responses:
 *       201:
 *         description: Inventory item created
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
export const createInventoryItem = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      productId,
      warehouseId,
      quantity,
      minQuantity,
      maxQuantity,
      alertThreshold,
      shelfLocation,
      barcode,
      rfidTag,
      userId
    } = req.body;
    
    // Validate required fields
    if (!productId || !warehouseId || quantity === undefined) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Product ID, warehouse ID, and quantity are required' });
    }
    
    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Product not found' });
    }
    
    // Check if warehouse exists
    const warehouse = await Warehouse.findByPk(warehouseId);
    if (!warehouse) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Warehouse not found' });
    }
    
    // Check if inventory item already exists for this product and warehouse
    const existingItem = await Inventory.findOne({
      where: { productId, warehouseId }
    });
    
    if (existingItem) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Inventory item already exists for this product in this warehouse',
        inventoryId: existingItem.id
      });
    }
    
    // Create new inventory item
    const inventoryItem = await Inventory.create({
      productId,
      warehouseId,
      quantity,
      minQuantity: minQuantity || 0,
      maxQuantity: maxQuantity || 1000,
      alertThreshold: alertThreshold || 10,
      lastStockCheck: new Date(),
      shelfLocation: shelfLocation || '',
      barcode,
      rfidTag,
      isActive: true
    }, { transaction });
    
    // Create initial stock transaction
    if (quantity > 0 && userId) {
      await StockTransaction.create({
        inventoryId: inventoryItem.id,
        quantity,
        type: 'IN',
        referenceType: 'MANUAL',
        transactionDate: new Date(),
        performedById: userId,
        notes: 'Initial inventory setup'
      }, { transaction });
    }
    
    // Check if we need to create a stock alert
    if (alertThreshold && quantity <= alertThreshold) {
      await StockAlert.create({
        productId,
        warehouseId,
        threshold: alertThreshold,
        currentLevel: quantity,
        status: 'active',
        notificationSent: false
      }, { transaction });
    }
    
    await transaction.commit();
    
    const newInventoryItem = await Inventory.findByPk(inventoryItem.id, {
      include: [
        { model: Product, as: 'product' },
        { model: Warehouse, as: 'warehouse' }
      ]
    });
    
    return res.status(201).json(newInventoryItem);
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating inventory item:', error);
    return res.status(500).json({ error: 'Failed to create inventory item' });
  }
};

/**
 * @swagger
 * /api/inventory/{id}:
 *   put:
 *     summary: Update an inventory item
 *     tags: [Inventory]
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
 *               minQuantity:
 *                 type: integer
 *               maxQuantity:
 *                 type: integer
 *               alertThreshold:
 *                 type: integer
 *               shelfLocation:
 *                 type: string
 *               barcode:
 *                 type: string
 *               rfidTag:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Inventory item updated
 *       404:
 *         description: Inventory item not found
 *       500:
 *         description: Server error
 */
export const updateInventoryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      minQuantity,
      maxQuantity,
      alertThreshold,
      shelfLocation,
      barcode,
      rfidTag,
      isActive
    } = req.body;
    
    const inventoryItem = await Inventory.findByPk(id);
    
    if (!inventoryItem) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    // Update fields
    const updates: any = {};
    
    if (minQuantity !== undefined) updates.minQuantity = minQuantity;
    if (maxQuantity !== undefined) updates.maxQuantity = maxQuantity;
    if (alertThreshold !== undefined) updates.alertThreshold = alertThreshold;
    if (shelfLocation !== undefined) updates.shelfLocation = shelfLocation;
    if (barcode !== undefined) updates.barcode = barcode;
    if (rfidTag !== undefined) updates.rfidTag = rfidTag;
    if (isActive !== undefined) updates.isActive = isActive;
    
    await inventoryItem.update(updates);
    
    // Update stock alert if alert threshold changed
    if (alertThreshold !== undefined) {
      const stockAlert = await StockAlert.findOne({
        where: {
          productId: inventoryItem.productId,
          warehouseId: inventoryItem.warehouseId
        }
      });
      
      if (stockAlert) {
        await stockAlert.update({
          threshold: alertThreshold,
          status: inventoryItem.quantity <= alertThreshold ? 'active' : 'resolved'
        });
      } else if (inventoryItem.quantity <= alertThreshold) {
        // Create new alert if none exists and stock is below threshold
        await StockAlert.create({
          productId: inventoryItem.productId,
          warehouseId: inventoryItem.warehouseId,
          threshold: alertThreshold,
          currentLevel: inventoryItem.quantity,
          status: 'active',
          notificationSent: false
        });
      }
    }
    
    const updatedItem = await Inventory.findByPk(id, {
      include: [
        { model: Product, as: 'product' },
        { model: Warehouse, as: 'warehouse' }
      ]
    });
    
    return res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return res.status(500).json({ error: 'Failed to update inventory item' });
  }
};

/**
 * @swagger
 * /api/inventory/{id}:
 *   delete:
 *     summary: Delete an inventory item
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inventory item deleted
 *       404:
 *         description: Inventory item not found
 *       500:
 *         description: Server error
 */
export const deleteInventoryItem = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    const inventoryItem = await Inventory.findByPk(id);
    
    if (!inventoryItem) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    // Delete related stock alerts
    await StockAlert.destroy({
      where: {
        productId: inventoryItem.productId,
        warehouseId: inventoryItem.warehouseId
      },
      transaction
    });
    
    // Delete the inventory item
    await inventoryItem.destroy({ transaction });
    
    await transaction.commit();
    
    return res.status(200).json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting inventory item:', error);
    return res.status(500).json({ error: 'Failed to delete inventory item' });
  }
};

/**
 * @swagger
 * /api/inventory/{id}/adjust:
 *   post:
 *     summary: Adjust inventory quantity
 *     tags: [Inventory]
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
 *             required:
 *               - quantity
 *               - adjustmentType
 *               - userId
 *             properties:
 *               quantity:
 *                 type: integer
 *               adjustmentType:
 *                 type: string
 *                 enum: [add, subtract, set]
 *               reason:
 *                 type: string
 *               userId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Inventory quantity adjusted
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Inventory item not found
 *       500:
 *         description: Server error
 */
export const adjustInventory = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { quantity, adjustmentType, reason, userId } = req.body;
    
    if (quantity === undefined || !adjustmentType || !userId) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Quantity, adjustment type, and user ID are required' });
    }
    
    const inventoryItem = await Inventory.findByPk(id, { transaction });
    
    if (!inventoryItem) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    // Check if user exists
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(400).json({ error: 'User not found' });
    }
    
    let newQuantity: number;
    let transactionType: 'IN' | 'OUT' | 'ADJUSTMENT';
    let transactionQuantity: number;
    
    // Calculate new quantity based on adjustment type
    switch (adjustmentType) {
      case 'add':
        newQuantity = inventoryItem.quantity + quantity;
        transactionType = 'IN';
        transactionQuantity = quantity;
        break;
      case 'subtract':
        if (inventoryItem.quantity < quantity) {
          await transaction.rollback();
          return res.status(400).json({ error: 'Cannot subtract more than current quantity' });
        }
        newQuantity = inventoryItem.quantity - quantity;
        transactionType = 'OUT';
        transactionQuantity = quantity;
        break;
      case 'set':
        newQuantity = quantity;
        transactionType = 'ADJUSTMENT';
        transactionQuantity = quantity;
        break;
      default:
        await transaction.rollback();
        return res.status(400).json({ error: 'Invalid adjustment type' });
    }
    
    // Update inventory
    await inventoryItem.update({
      quantity: newQuantity,
      lastStockCheck: new Date()
    }, { transaction });
    
    // Create stock transaction
    await StockTransaction.create({
      inventoryId: inventoryItem.id,
      quantity: transactionQuantity,
      type: transactionType,
      referenceType: 'MANUAL',
      transactionDate: new Date(),
      performedById: userId,
      notes: reason || 'Manual stock adjustment'
    }, { transaction });
    
    // Update stock alert status
    const stockAlert = await StockAlert.findOne({
      where: {
        productId: inventoryItem.productId,
        warehouseId: inventoryItem.warehouseId
      },
      transaction
    });
    
    if (stockAlert) {
      await stockAlert.update({
        currentLevel: newQuantity,
        status: newQuantity <= stockAlert.threshold ? 'active' : 'resolved'
      }, { transaction });
    } else if (newQuantity <= inventoryItem.alertThreshold) {
      // Create new alert if none exists and stock is below threshold
      await StockAlert.create({
        productId: inventoryItem.productId,
        warehouseId: inventoryItem.warehouseId,
        threshold: inventoryItem.alertThreshold,
        currentLevel: newQuantity,
        status: 'active',
        notificationSent: false
      }, { transaction });
    }
    
    await transaction.commit();
    
    const updatedItem = await Inventory.findByPk(id, {
      include: [
        { model: Product, as: 'product' },
        { model: Warehouse, as: 'warehouse' }
      ]
    });
    
    return res.status(200).json(updatedItem);
  } catch (error) {
    await transaction.rollback();
    console.error('Error adjusting inventory:', error);
    return res.status(500).json({ error: 'Failed to adjust inventory' });
  }
};

/**
 * @swagger
 * /api/inventory/barcode/{barcode}:
 *   get:
 *     summary: Get inventory item by barcode
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: barcode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inventory item details
 *       404:
 *         description: Inventory item not found
 *       500:
 *         description: Server error
 */
export const getInventoryByBarcode = async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;
    
    const inventoryItem = await Inventory.findOne({
      where: { barcode },
      include: [
        { model: Product, as: 'product' },
        { model: Warehouse, as: 'warehouse' }
      ]
    });
    
    if (!inventoryItem) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    return res.status(200).json(inventoryItem);
  } catch (error) {
    console.error('Error fetching inventory by barcode:', error);
    return res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
};

/**
 * @swagger
 * /api/inventory/rfid/{rfidTag}:
 *   get:
 *     summary: Get inventory item by RFID tag
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: rfidTag
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inventory item details
 *       404:
 *         description: Inventory item not found
 *       500:
 *         description: Server error
 */
export const getInventoryByRfid = async (req: Request, res: Response) => {
  try {
    const { rfidTag } = req.params;
    
    const inventoryItem = await Inventory.findOne({
      where: { rfidTag },
      include: [
        { model: Product, as: 'product' },
        { model: Warehouse, as: 'warehouse' }
      ]
    });
    
    if (!inventoryItem) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    return res.status(200).json(inventoryItem);
  } catch (error) {
    console.error('Error fetching inventory by RFID:', error);
    return res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
};

/**
 * @swagger
 * /api/inventory/log-stock-check:
 *   post:
 *     summary: Log a stock check for multiple inventory items
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - userId
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - inventoryId
 *                     - quantity
 *                   properties:
 *                     inventoryId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     notes:
 *                       type: string
 *               userId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Stock check logged successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
export const logStockCheck = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { items, userId } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0 || !userId) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Items array and user ID are required' });
    }
    
    // Check if user exists
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(400).json({ error: 'User not found' });
    }
    
    const results = [];
    
    for (const item of items) {
      const { inventoryId, quantity, notes } = item;
      
      if (!inventoryId || quantity === undefined) {
        continue;
      }
      
      const inventoryItem = await Inventory.findByPk(inventoryId, { transaction });
      
      if (!inventoryItem) {
        continue;
      }
      
      const oldQuantity = inventoryItem.quantity;
      
      // Create adjustment transaction if quantities differ
      if (oldQuantity !== quantity) {
        await StockTransaction.create({
          inventoryId,
          quantity,
          type: 'ADJUSTMENT',
          referenceType: 'MANUAL',
          transactionDate: new Date(),
          performedById: userId,
          notes: notes || 'Stock check adjustment'
        }, { transaction });
        
        // Update inventory quantity
        await inventoryItem.update({
          quantity,
          lastStockCheck: new Date()
        }, { transaction });
        
        // Update stock alert status
        const stockAlert = await StockAlert.findOne({
          where: {
            productId: inventoryItem.productId,
            warehouseId: inventoryItem.warehouseId
          },
          transaction
        });
        
        if (stockAlert) {
          await stockAlert.update({
            currentLevel: quantity,
            status: quantity <= stockAlert.threshold ? 'active' : 'resolved'
          }, { transaction });
        } else if (quantity <= inventoryItem.alertThreshold) {
          // Create new alert if none exists and stock is below threshold
          await StockAlert.create({
            productId: inventoryItem.productId,
            warehouseId: inventoryItem.warehouseId,
            threshold: inventoryItem.alertThreshold,
            currentLevel: quantity,
            status: 'active',
            notificationSent: false
          }, { transaction });
        }
      } else {
        // Just update lastStockCheck date if quantities match
        await inventoryItem.update({
          lastStockCheck: new Date()
        }, { transaction });
      }
      
      results.push({
        inventoryId,
        oldQuantity,
        newQuantity: quantity,
        adjusted: oldQuantity !== quantity
      });
    }
    
    await transaction.commit();
    
    return res.status(200).json({
      message: 'Stock check logged successfully',
      results
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error logging stock check:', error);
    return res.status(500).json({ error: 'Failed to log stock check' });
  }
};

export default {
  getAllInventory,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustInventory,
  getInventoryByBarcode,
  getInventoryByRfid,
  logStockCheck
}; 