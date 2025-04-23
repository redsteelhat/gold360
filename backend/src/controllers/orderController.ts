import { Request, Response } from 'express';
import { Order, OrderItem, Product, Customer } from '../models';
import { Op } from 'sequelize';

// Tüm siparişleri getir
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: Customer, as: 'customer' },
        { 
          model: OrderItem, 
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    return res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// ID'ye göre sipariş getir
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [
        { model: Customer, as: 'customer' },
        { 
          model: OrderItem, 
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }]
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    return res.json(order);
  } catch (error) {
    console.error(`Error fetching order ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Müşteriye göre siparişleri getir
export const getOrdersByCustomer = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const orders = await Order.findAll({
      where: { customerId },
      include: [
        { model: Customer, as: 'customer' },
        { 
          model: OrderItem, 
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return res.json(orders);
  } catch (error) {
    console.error(`Error fetching orders for customer ${req.params.customerId}:`, error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Tarihe göre sipariş ara
export const searchOrdersByDate = async (req: Request, res: Response) => {
  try {
    const startDateStr = req.query.startDate as string;
    const endDateStr = req.query.endDate as string;
    
    if (!startDateStr || !endDateStr) {
      return res.status(400).json({ message: 'Both startDate and endDate are required' });
    }
    
    // String'den Date objelerine dönüştür
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    // Geçerli tarihler mi kontrol et
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    const orders = await Order.findAll({
      where: {
        orderDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        { model: Customer, as: 'customer' },
        { 
          model: OrderItem, 
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }]
        }
      ],
      order: [['orderDate', 'DESC']]
    });
    
    return res.json(orders);
  } catch (error) {
    console.error('Error searching orders by date:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Duruma göre sipariş ara
export const getOrdersByStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    const orders = await Order.findAll({
      where: { status },
      include: [
        { model: Customer, as: 'customer' },
        { 
          model: OrderItem, 
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return res.json(orders);
  } catch (error) {
    console.error(`Error fetching orders with status ${req.params.status}:`, error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Yeni sipariş oluştur
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { 
      customerId, 
      orderDate, 
      deliveryDate, 
      status, 
      totalAmount, 
      paymentStatus, 
      notes, 
      orderItems 
    } = req.body;
    
    // Müşteri kontrolü
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }
    
    // Sipariş oluştur
    const order = await Order.create({
      customerId,
      orderDate,
      deliveryDate,
      status,
      totalAmount,
      paymentStatus,
      notes
    });
    
    // Sipariş ürünlerini ekle
    if (orderItems && orderItems.length > 0) {
      for (const item of orderItems) {
        // Ürün kontrolü
        const product = await Product.findByPk(item.productId);
        if (!product) {
          // Sipariş oluşturuldu ama ürün ekleme başarısız oldu, o yüzden siparişi silelim
          await order.destroy();
          return res.status(400).json({ message: `Invalid product ID: ${item.productId}` });
        }
        
        await OrderItem.create({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          total: item.total
        });
      }
    }
    
    // Oluşturulan siparişi tüm detaylarıyla getir
    const createdOrder = await Order.findByPk(order.id, {
      include: [
        { model: Customer, as: 'customer' },
        { 
          model: OrderItem, 
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }]
        }
      ]
    });
    
    return res.status(201).json(createdOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Sipariş güncelle
export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      customerId, 
      orderDate, 
      deliveryDate, 
      status, 
      totalAmount, 
      paymentStatus, 
      notes 
    } = req.body;
    
    const order = await Order.findByPk(id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Müşteri kontrolü (eğer değiştiriliyorsa)
    if (customerId && customerId !== order.customerId) {
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        return res.status(400).json({ message: 'Invalid customer ID' });
      }
    }
    
    // Siparişi güncelle
    await order.update({
      customerId: customerId || order.customerId,
      orderDate: orderDate || order.orderDate,
      deliveryDate,
      status: status || order.status,
      totalAmount: totalAmount || order.totalAmount,
      paymentStatus: paymentStatus || order.paymentStatus,
      notes: notes !== undefined ? notes : order.notes
    });
    
    // Güncellenmiş siparişi getir
    const updatedOrder = await Order.findByPk(id, {
      include: [
        { model: Customer, as: 'customer' },
        { 
          model: OrderItem, 
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }]
        }
      ]
    });
    
    return res.json(updatedOrder);
  } catch (error) {
    console.error(`Error updating order ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Sipariş durumunu güncelle
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = await Order.findByPk(id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    await order.update({ status });
    
    return res.json(order);
  } catch (error) {
    console.error(`Error updating order status ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Sipariş ödeme durumunu güncelle
export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    
    const order = await Order.findByPk(id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    await order.update({ paymentStatus });
    
    return res.json(order);
  } catch (error) {
    console.error(`Error updating payment status for order ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Sipariş sil
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findByPk(id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // İlişkili sipariş öğelerini bul
    const orderItems = await OrderItem.findAll({
      where: { orderId: id }
    });
    
    // Sipariş öğelerini sil
    for (const item of orderItems) {
      await item.destroy();
    }
    
    // Siparişi sil
    await order.destroy();
    
    return res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error(`Error deleting order ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Server error', error });
  }
}; 