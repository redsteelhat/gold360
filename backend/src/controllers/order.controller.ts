import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { QueryTypes, Op } from 'sequelize';
import { Order, OrderStatus, PaymentStatus } from '../models/order.model';
import { OrderItem } from '../models/orderItem.model';
import { Product } from '../models/product.model';
import { StockTransaction, TransactionType } from '../models/stockTransaction.model';
import sequelize from '../config/database';

// Get all orders with optional filtering
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { 
      status, 
      paymentStatus, 
      customerId, 
      startDate, 
      endDate,
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'DESC'
    } = req.query;
    
    // Build filter object
    const filter: any = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (customerId) filter.customerId = customerId;
    
    // Date range filter
    if (startDate && endDate) {
      filter.createdAt = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      };
    } else if (startDate) {
      filter.createdAt = {
        [Op.gte]: new Date(startDate as string)
      };
    } else if (endDate) {
      filter.createdAt = {
        [Op.lte]: new Date(endDate as string)
      };
    }
    
    // Calculate pagination
    const offset = (Number(page) - 1) * Number(limit);
    
    // Query orders with pagination and sorting
    const sortField = (sort as string) || 'createdAt';
    const sortOrder = (order as string) || 'DESC';
    
    const { count, rows: orders } = await Order.findAndCountAll({
      where: filter,
      order: [[sortField, sortOrder]],
      limit: Number(limit),
      offset,
      include: [
        { model: OrderItem, include: [{ model: Product }] }
      ]
    });
    
    // Calculate pagination data
    const totalPages = Math.ceil(count / Number(limit));
    
    return res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          total: count,
          totalPages,
          currentPage: Number(page),
          limit: Number(limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching orders',
      error: error.message
    });
  }
};

// Get order by ID
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findByPk(id, {
      include: [
        { model: OrderItem, include: [{ model: Product }] }
      ]
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order with ID ${id} not found`
      });
    }
    
    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error: any) {
    console.error(`Error fetching order ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching order',
      error: error.message
    });
  }
};

// Create a new order
export const createOrder = async (req: Request, res: Response) => {
  const dbTransaction = await sequelize.transaction();
  
  try {
    const {
      customerId,
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      couponCode,
      customerNotes,
      isGift,
      giftMessage
    } = req.body;
    
    if (!customerId || !items || !Array.isArray(items) || items.length === 0 || !shippingAddress || !billingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Generate a unique order number (could be more sophisticated in production)
    const orderNumber = `ORD-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    // Initialize order totals
    let subtotal = 0;
    let tax = 0;
    let discount = 0;
    
    // Default shipping cost - could be calculated based on items, weight, etc.
    const shippingCost = 0;
    
    // Verify product availability and calculate totals
    for (const item of items) {
      const { productId, quantity } = item;
      
      if (!productId || !quantity || quantity <= 0) {
        await dbTransaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Invalid product or quantity'
        });
      }
      
      // Get product with current price
      const product = await Product.findByPk(productId);
      
      if (!product) {
        await dbTransaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Product with ID ${productId} not found`
        });
      }
      
      // Check stock availability
      if (product.stockQuantity < quantity) {
        await dbTransaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Not enough stock for product ID ${productId}. Available: ${product.stockQuantity}, Requested: ${quantity}`
        });
      }
      
      // Calculate item subtotal
      const itemPrice = product.salePrice || product.price;
      const itemSubtotal = itemPrice * quantity;
      
      // Add to order totals
      subtotal += itemSubtotal;
      
      // Calculate tax if applicable
      if (product.taxRate) {
        tax += (itemSubtotal * product.taxRate) / 100;
      }
    }
    
    // Apply coupon/discount logic here if needed
    // For now, keeping discount at 0
    
    // Calculate total
    const total = subtotal + tax + shippingCost - discount;
    
    // Create the order
    const order = await Order.create({
      orderNumber,
      customerId,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod,
      subtotal,
      tax,
      shippingCost,
      discount,
      total,
      couponCode,
      shippingAddress,
      billingAddress,
      customerNotes,
      isGift,
      giftMessage
    }, { transaction: dbTransaction });
    
    // Create order items and update inventory
    for (const item of items) {
      const { productId, quantity, notes } = item;
      const product = await Product.findByPk(productId);
      
      if (!product) {
        await dbTransaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Product with ID ${productId} not found`
        });
      }
      
      const unitPrice = product.price;
      const discountedPrice = product.salePrice || null;
      const finalPrice = discountedPrice || unitPrice;
      const itemSubtotal = finalPrice * quantity;
      
      // Store product data snapshot at time of order
      const productData = {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        salePrice: product.salePrice,
        images: product.images,
        category: product.category
      };
      
      // Create order item
      await OrderItem.create({
        orderId: order.id,
        productId,
        quantity,
        unitPrice,
        discountedPrice,
        subtotal: itemSubtotal,
        productData,
        notes
      }, { transaction: dbTransaction });
      
      // Reduce inventory
      await product.update({
        stockQuantity: product.stockQuantity - quantity
      }, { transaction: dbTransaction });
      
      // Create stock transaction
      await StockTransaction.create({
        productId,
        warehouseId: 1, // Default warehouse - this might need to be determined dynamically
        quantity,
        type: TransactionType.SALE,
        referenceId: orderNumber,
        performedBy: customerId.toString(),
        previousQuantity: product.stockQuantity,
        newQuantity: product.stockQuantity - quantity,
        notes: `Order ID: ${order.id}`
      }, { transaction: dbTransaction });
    }
    
    await dbTransaction.commit();
    
    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber
      }
    });
  } catch (error: any) {
    await dbTransaction.rollback();
    console.error('Error creating order:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating order',
      error: error.message
    });
  }
};

// Update order status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    
    if (!status || !Object.values(OrderStatus).includes(status as OrderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing status'
      });
    }
    
    const order = await Order.findByPk(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order with ID ${id} not found`
      });
    }
    
    // Check if the transition is allowed
    if (!isValidStatusTransition(order.status, status as OrderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${order.status} to ${status}`
      });
    }
    
    // Update additional fields based on status
    const updateFields: any = { status, adminNotes };
    
    if (status === OrderStatus.SHIPPED) {
      updateFields.shippedAt = new Date();
    } else if (status === OrderStatus.DELIVERED) {
      updateFields.deliveredAt = new Date();
    }
    
    await order.update(updateFields);
    
    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`
    });
  } catch (error: any) {
    console.error(`Error updating order status for ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating order status',
      error: error.message
    });
  }
};

// Update payment status
export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentDetails } = req.body;
    
    if (!paymentStatus || !Object.values(PaymentStatus).includes(paymentStatus as PaymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing payment status'
      });
    }
    
    const order = await Order.findByPk(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order with ID ${id} not found`
      });
    }
    
    await order.update({
      paymentStatus,
      paymentDetails: paymentDetails || order.paymentDetails
    });
    
    return res.status(200).json({
      success: true,
      message: `Payment status updated to ${paymentStatus}`
    });
  } catch (error: any) {
    console.error(`Error updating payment status for order ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating payment status',
      error: error.message
    });
  }
};

// Cancel order
export const cancelOrder = async (req: Request, res: Response) => {
  const dbTransaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const order = await Order.findByPk(id, {
      include: [{ model: OrderItem }]
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order with ID ${id} not found`
      });
    }
    
    // Check if order can be cancelled
    if (![OrderStatus.PENDING, OrderStatus.PROCESSING].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status ${order.status}`
      });
    }
    
    // Update order status
    await order.update({
      status: OrderStatus.CANCELLED,
      adminNotes: reason ? `Cancelled: ${reason}` : 'Order cancelled'
    }, { transaction: dbTransaction });
    
    // Restore inventory for all items
    for (const item of order.items) {
      const product = await Product.findByPk(item.productId);
      
      if (product) {
        await product.update({
          stockQuantity: product.stockQuantity + item.quantity
        }, { transaction: dbTransaction });
        
        // Record stock transaction
        await StockTransaction.create({
          productId: item.productId,
          warehouseId: 1, // Default warehouse
          quantity: item.quantity,
          type: TransactionType.ADJUSTMENT,
          referenceId: order.orderNumber,
          performedBy: (req as any).user.id.toString(),
          previousQuantity: product.stockQuantity,
          newQuantity: product.stockQuantity + item.quantity,
          notes: `Cancelled order: ${order.orderNumber}`
        }, { transaction: dbTransaction });
      }
    }
    
    await dbTransaction.commit();
    
    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error: any) {
    await dbTransaction.rollback();
    console.error(`Error cancelling order ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Server error while cancelling order',
      error: error.message
    });
  }
};

// Helper function to check if status transition is valid
function isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED, OrderStatus.REFUNDED],
    [OrderStatus.COMPLETED]: [OrderStatus.REFUNDED],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.REFUNDED]: []
  };
  
  return validTransitions[currentStatus]?.includes(newStatus) || false;
} 