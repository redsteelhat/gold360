import { Request, Response } from 'express';
import { Order, OrderItem, Product, Customer } from '../models';
import sequelize from '../config/database';

// Type for Order with items
interface ExtendedOrder {
  get: (param: string) => any;
  update: (updates: any, options?: any) => Promise<any>;
}

// Get all orders
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
        },
        {
          model: Customer,
          as: 'customer',
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error });
  }
};

// Get order by ID
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }],
        },
        {
          model: Customer,
          as: 'customer',
        },
      ],
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res.status(200).json(order);
  } catch (error) {
    console.error(`Error fetching order with ID ${id}:`, error);
    res.status(500).json({ message: 'Error fetching order', error });
  }
};

// Create a new order
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const { 
    customerId, 
    items,
    notes,
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    // Validate customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      await transaction.rollback();
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    // Calculate order totals
    let totalAmount = 0;

    // Create order
    const order = await Order.create({
      customerId,
      orderDate: new Date(),
      status: 'pending',
      paymentStatus: 'pending',
      totalAmount: 0, // Will update after calculating items
      notes: notes || null,
    }, { transaction });

    // Process order items
    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      res.status(400).json({ message: 'Order must contain at least one item' });
      return;
    }

    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        await transaction.rollback();
        res.status(404).json({ message: `Product with ID ${item.productId} not found` });
        return;
      }

      if (product.stockQuantity < item.quantity) {
        await transaction.rollback();
        res.status(400).json({ 
          message: `Insufficient stock for product ${product.name}. Available: ${product.stockQuantity}` 
        });
        return;
      }

      // Calculate item total
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      // Create order item
      await OrderItem.create({
        orderId: order.id,
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        discount: 0, // Could be dynamic based on promotions
        total: itemTotal,
      }, { transaction });

      // Update product stock
      await product.update({
        stockQuantity: product.stockQuantity - item.quantity
      }, { transaction });
    }

    // Update order with calculated totals
    await order.update({
      totalAmount,
    }, { transaction });

    // Update customer's stats
    await customer.update({
      totalSpent: customer.totalSpent + totalAmount,
      lastPurchaseDate: new Date(),
    }, { transaction });

    await transaction.commit();

    // Fetch the complete order with items to return
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
        },
      ],
    });

    res.status(201).json(completeOrder);
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order', error });
  }
};

// Update order status
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, paymentStatus } = req.body;
  
  try {
    const order = await Order.findByPk(id);
    
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const updates: any = {};
    
    if (status) updates.status = status;
    if (paymentStatus) updates.paymentStatus = paymentStatus;

    await order.update(updates);

    res.status(200).json(order);
  } catch (error) {
    console.error(`Error updating order status for ID ${id}:`, error);
    res.status(500).json({ message: 'Error updating order status', error });
  }
};

// Update delivery date
export const updateDeliveryDate = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { deliveryDate } = req.body;
  
  try {
    const order = await Order.findByPk(id);
    
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    await order.update({
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
    });

    res.status(200).json(order);
  } catch (error) {
    console.error(`Error updating delivery date for order ID ${id}:`, error);
    res.status(500).json({ message: 'Error updating delivery date', error });
  }
};

// Cancel order
export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const transaction = await sequelize.transaction();
  
  try {
    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
        }
      ],
      transaction
    }) as ExtendedOrder;
    
    if (!order) {
      await transaction.rollback();
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Only allow cancellation if order status is not delivered
    if (order.get('status') === 'delivered') {
      await transaction.rollback();
      res.status(400).json({ message: 'Cannot cancel a delivered order' });
      return;
    }

    // Update order status to cancelled
    await order.update({ status: 'cancelled' }, { transaction });

    // Restore product quantities
    const orderItems = order.get('orderItems') || [];
    for (const item of orderItems) {
      const product = await Product.findByPk(item.get('productId'), { transaction });
      if (product) {
        await product.update({
          stockQuantity: product.stockQuantity + item.get('quantity')
        }, { transaction });
      }
    }

    // If the order was paid, update payment status to refunded
    if (order.get('paymentStatus') === 'paid') {
      await order.update({ paymentStatus: 'refunded' }, { transaction });

      // Update customer's stats
      const customerId = order.get('customerId');
      const customer = await Customer.findByPk(customerId, { transaction });
      if (customer) {
        await customer.update({
          totalSpent: Math.max(0, customer.totalSpent - order.get('totalAmount'))
        }, { transaction });
      }
    }

    await transaction.commit();
    res.status(200).json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    await transaction.rollback();
    console.error(`Error cancelling order with ID ${id}:`, error);
    res.status(500).json({ message: 'Error cancelling order', error });
  }
};

// Get orders by customer
export const getOrdersByCustomer = async (req: Request, res: Response): Promise<void> => {
  const { customerId } = req.params;
  
  try {
    const customer = await Customer.findByPk(customerId);
    
    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }
    
    const orders = await Order.findAll({
      where: { customerId },
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
        }
      ],
      order: [['createdAt', 'DESC']],
    });
    
    res.status(200).json(orders);
  } catch (error) {
    console.error(`Error fetching orders for customer ${customerId}:`, error);
    res.status(500).json({ message: 'Error fetching customer orders', error });
  }
}; 