import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { QueryTypes } from 'sequelize';
import { StockTransfer, TransferStatus } from '../models/stockTransfer.model';
import { TransferItem, TransferItemStatus } from '../models/transferItem.model';
import { StockTransaction, TransactionType } from '../models/stockTransaction.model';
import { Product } from '../models/product.model';
import { Warehouse } from '../models/warehouse.model';
import sequelize from '../config/database';

// Get all stock transfers
export const getAllTransfers = async (req: Request, res: Response) => {
  try {
    const transfers = await StockTransfer.findAll({
      order: [['createdAt', 'DESC']],
    });
    
    return res.status(200).json({
      success: true,
      data: transfers,
    });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching transfers',
      error,
    });
  }
};

// Get stock transfer by ID
export const getTransferById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const transfer = await StockTransfer.findByPk(id, {
      include: [
        { model: Warehouse, as: 'sourceWarehouse' },
        { model: Warehouse, as: 'destinationWarehouse' },
        { 
          model: TransferItem,
          include: [{ model: Product }],
        },
      ],
    });
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: `Transfer with ID ${id} not found`,
      });
    }
    
    return res.status(200).json({
      success: true,
      data: transfer,
    });
  } catch (error) {
    console.error(`Error fetching transfer with ID ${id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching transfer',
      error,
    });
  }
};

// Create a new stock transfer
export const createTransfer = async (req: Request, res: Response) => {
  const {
    sourceWarehouseId,
    destinationWarehouseId,
    notes,
    items,
  } = req.body;
  
  const userId = (req as any).user.id; // From auth middleware
  
  try {
    // Validate required fields
    if (!sourceWarehouseId || !destinationWarehouseId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }
    
    // Check if warehouses exist
    const sourceWarehouse = await Warehouse.findByPk(sourceWarehouseId);
    const destinationWarehouse = await Warehouse.findByPk(destinationWarehouseId);
    
    if (!sourceWarehouse) {
      return res.status(404).json({
        success: false,
        message: `Source warehouse with ID ${sourceWarehouseId} not found`,
      });
    }
    
    if (!destinationWarehouse) {
      return res.status(404).json({
        success: false,
        message: `Destination warehouse with ID ${destinationWarehouseId} not found`,
      });
    }
    
    // Cannot transfer to the same warehouse
    if (sourceWarehouseId === destinationWarehouseId) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination warehouses cannot be the same',
      });
    }
    
    // Generate a unique transfer code
    const transferCode = uuidv4().substring(0, 8).toUpperCase();
    
    // Start a database transaction
    const transaction = await sequelize.transaction();
    
    try {
      // Create the stock transfer
      const stockTransfer = await StockTransfer.create({
        sourceWarehouseId,
        destinationWarehouseId,
        status: TransferStatus.PENDING,
        notes,
        requestedBy: userId,
        requestedDate: new Date(),
        transferCode,
      }, { transaction });
      
      // Create transfer items
      for (const item of items) {
        const { productId, quantity } = item;
        
        // Check if product exists
        const product = await Product.findByPk(productId);
        
        if (!product) {
          throw new Error(`Product with ID ${productId} not found`);
        }
        
        // Check if there's enough stock in source warehouse
        const stockQuery = `
          SELECT COALESCE(SUM(CASE WHEN type = 'purchase' OR type = 'initial' THEN quantity 
                                  WHEN type = 'sale' OR type = 'adjustment' THEN -quantity 
                                  ELSE 0 END), 0) as current_quantity
          FROM stock_transactions
          WHERE product_id = :productId AND warehouse_id = :warehouseId
        `;
        
        const [stockResult] = await sequelize.query(stockQuery, {
          replacements: { productId, warehouseId: sourceWarehouseId },
          type: QueryTypes.SELECT,
          transaction,
        });
        
        const currentStock = parseFloat((stockResult as any).current_quantity || 0);
        
        if (currentStock < parseFloat(quantity)) {
          throw new Error(`Not enough stock for product ID ${productId} in source warehouse. Available: ${currentStock}, Requested: ${quantity}`);
        }
        
        // Create the transfer item
        await TransferItem.create({
          transferId: stockTransfer.id,
          productId,
          quantity,
          status: TransferItemStatus.PENDING,
        }, { transaction });
      }
      
      await transaction.commit();
      
      // Get the complete transfer with items
      const createdTransfer = await StockTransfer.findByPk(stockTransfer.id, {
        include: [
          { model: Warehouse, as: 'sourceWarehouse' },
          { model: Warehouse, as: 'destinationWarehouse' },
          { 
            model: TransferItem,
            include: [{ model: Product }],
          },
        ],
      });
      
      return res.status(201).json({
        success: true,
        message: 'Stock transfer created successfully',
        data: createdTransfer,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error('Error creating stock transfer:', error);
    return res.status(error.message?.includes('Not enough stock') ? 400 : 500).json({
      success: false,
      message: error.message || 'Server error while creating stock transfer',
      error,
    });
  }
};

// Update transfer status (approve, complete, cancel)
export const updateTransferStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = (req as any).user.id; // From auth middleware
  
  try {
    const transfer = await StockTransfer.findByPk(id, {
      include: [{ model: TransferItem }],
    });
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: `Transfer with ID ${id} not found`,
      });
    }
    
    // Validate status transition
    const currentStatus = transfer.status;
    
    if (status === currentStatus) {
      return res.status(400).json({
        success: false,
        message: `Transfer is already in ${status} status`,
      });
    }
    
    // Status transition validation
    if (
      (currentStatus === TransferStatus.DRAFT && status !== TransferStatus.PENDING && status !== TransferStatus.CANCELLED) ||
      (currentStatus === TransferStatus.PENDING && status !== TransferStatus.IN_TRANSIT && status !== TransferStatus.CANCELLED) ||
      (currentStatus === TransferStatus.IN_TRANSIT && status !== TransferStatus.COMPLETED && status !== TransferStatus.CANCELLED) ||
      (currentStatus === TransferStatus.COMPLETED || currentStatus === TransferStatus.CANCELLED)
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${currentStatus} to ${status}`,
      });
    }
    
    // Start a database transaction
    const dbTransaction = await sequelize.transaction();
    
    try {
      // Update transfer status based on requested action
      if (status === TransferStatus.PENDING) {
        await transfer.update({
          status: TransferStatus.PENDING,
          approvedBy: userId,
          approvedDate: new Date(),
        }, { transaction: dbTransaction });
      } else if (status === TransferStatus.IN_TRANSIT) {
        // When moving to IN_TRANSIT, reduce inventory in source warehouse
        const transferItems = await TransferItem.findAll({
          where: { transferId: transfer.id.toString() }
        });
        
        for (const item of transferItems) {
          // Check current stock level
          const stockQuery = `
            SELECT COALESCE(SUM(CASE WHEN type = 'purchase' OR type = 'initial' THEN quantity 
                                    WHEN type = 'sale' OR type = 'adjustment' THEN -quantity 
                                    ELSE 0 END), 0) as current_quantity
            FROM stock_transactions
            WHERE product_id = :productId AND warehouse_id = :warehouseId
          `;
          
          const [sourceStockResult] = await sequelize.query(stockQuery, {
            replacements: { 
              productId: item.productId, 
              warehouseId: transfer.sourceWarehouseId 
            },
            type: QueryTypes.SELECT,
            transaction: dbTransaction,
          });
          
          const currentStock = parseFloat((sourceStockResult as any).current_quantity || 0);
          
          if (currentStock < parseFloat(item.quantity)) {
            throw new Error(`Not enough stock for product ID ${item.productId} in source warehouse. Available: ${currentStock}, Requested: ${item.quantity}`);
          }
          
          // Create stock transaction for source warehouse (negative)
          await StockTransaction.create({
            productId: item.productId,
            warehouseId: transfer.sourceWarehouseId,
            quantity: item.quantity,
            type: TransactionType.TRANSFER,
            referenceId: transfer.transferCode,
            notes: `Transfer to ${transfer.destinationWarehouseId} - ${transfer.transferCode}`,
            performedBy: userId,
            previousQuantity: currentStock,
            newQuantity: currentStock - parseFloat(item.quantity),
          }, { transaction: dbTransaction });
          
          // Update transfer item status
          await item.update({
            status: TransferItemStatus.TRANSFERRED,
          }, { transaction: dbTransaction });
        }
        
        // Update transfer status
        await transfer.update({
          status: TransferStatus.IN_TRANSIT,
        }, { transaction: dbTransaction });
      } else if (status === TransferStatus.COMPLETED) {
        // When completing, add inventory to destination warehouse
        const transferItems = await TransferItem.findAll({
          where: { transferId: transfer.id.toString() }
        });
        
        for (const item of transferItems) {
          // Get current quantity at destination
          const stockQuery = `
            SELECT COALESCE(SUM(CASE WHEN type = 'purchase' OR type = 'initial' THEN quantity 
                                    WHEN type = 'sale' OR type = 'adjustment' THEN -quantity 
                                    ELSE 0 END), 0) as current_quantity
            FROM stock_transactions
            WHERE product_id = :productId AND warehouse_id = :warehouseId
          `;
          
          const [destStockResult] = await sequelize.query(stockQuery, {
            replacements: { 
              productId: item.productId, 
              warehouseId: transfer.destinationWarehouseId 
            },
            type: QueryTypes.SELECT,
            transaction: dbTransaction,
          });
          
          const currentDestStock = parseFloat((destStockResult as any).current_quantity || 0);
          
          // Create stock transaction for destination warehouse (positive)
          await StockTransaction.create({
            productId: item.productId,
            warehouseId: transfer.destinationWarehouseId,
            quantity: item.quantity,
            type: TransactionType.TRANSFER,
            referenceId: transfer.transferCode,
            notes: `Transfer from ${transfer.sourceWarehouseId} - ${transfer.transferCode}`,
            performedBy: userId,
            previousQuantity: currentDestStock,
            newQuantity: currentDestStock + parseFloat(item.quantity),
          }, { transaction: dbTransaction });
          
          // Update transfer item status
          await item.update({
            status: TransferItemStatus.RECEIVED,
            receivedQuantity: item.quantity,
            receivedAt: new Date(),
          }, { transaction: dbTransaction });
        }
        
        // Update transfer status
        await transfer.update({
          status: TransferStatus.COMPLETED,
          completedDate: new Date(),
        }, { transaction: dbTransaction });
      } else if (status === TransferStatus.CANCELLED) {
        // If it was in transit, add back to source warehouse
        if (currentStatus === TransferStatus.IN_TRANSIT) {
          const transferItems = await TransferItem.findAll({
            where: { transferId: transfer.id.toString() }
          });
          
          for (const item of transferItems) {
            // Get current quantity at source
            const stockQuery = `
              SELECT COALESCE(SUM(CASE WHEN type = 'purchase' OR type = 'initial' THEN quantity 
                                      WHEN type = 'sale' OR type = 'adjustment' THEN -quantity 
                                      ELSE 0 END), 0) as current_quantity
              FROM stock_transactions
              WHERE product_id = :productId AND warehouse_id = :warehouseId
            `;
            
            const [sourceStockResult] = await sequelize.query(stockQuery, {
              replacements: { 
                productId: item.productId, 
                warehouseId: transfer.sourceWarehouseId 
              },
              type: QueryTypes.SELECT,
              transaction: dbTransaction,
            });
            
            const currentSourceStock = parseFloat((sourceStockResult as any).current_quantity || 0);
            
            // Create stock transaction to add back to source warehouse
            await StockTransaction.create({
              productId: item.productId,
              warehouseId: transfer.sourceWarehouseId,
              quantity: item.quantity,
              type: TransactionType.ADJUSTMENT,
              referenceId: transfer.transferCode,
              notes: `Cancelled transfer ${transfer.transferCode}`,
              performedBy: userId,
              previousQuantity: currentSourceStock,
              newQuantity: currentSourceStock + parseFloat(item.quantity),
            }, { transaction: dbTransaction });
            
            // Update transfer item status
            await item.update({
              status: TransferItemStatus.CANCELLED,
            }, { transaction: dbTransaction });
          }
        } else {
          // Just update transfer item status
          const transferItems = await TransferItem.findAll({
            where: { transferId: transfer.id.toString() }
          });
          
          for (const item of transferItems) {
            await item.update({
              status: TransferItemStatus.CANCELLED,
            }, { transaction: dbTransaction });
          }
        }
        
        // Update transfer status
        await transfer.update({
          status: TransferStatus.CANCELLED,
        }, { transaction: dbTransaction });
      }
      
      await dbTransaction.commit();
      
      return res.status(200).json({
        success: true,
        message: `Transfer status updated to ${status}`,
        data: await StockTransfer.findByPk(id, {
          include: [
            { model: Warehouse, as: 'sourceWarehouse' },
            { model: Warehouse, as: 'destinationWarehouse' },
            { 
              model: TransferItem,
              include: [{ model: Product }],
            },
          ],
        }),
      });
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error(`Error updating transfer with ID ${id}:`, error);
    return res.status(error.message?.includes('Not enough stock') ? 400 : 500).json({
      success: false,
      message: error.message || 'Server error while updating transfer',
      error,
    });
  }
}; 