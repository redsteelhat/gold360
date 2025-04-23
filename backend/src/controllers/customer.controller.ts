import { Request, Response } from 'express';
import { Customer as CustomerModel, Order, LoyaltyTransaction } from '../models';
import { Op } from 'sequelize';
import notificationService from '../services/notification.service';

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management
 */

// Yardımcı tip tanımlaması
type Customer = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  segment: string;
  isActive: boolean;
};

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for customer name or email
 *       - in: query
 *         name: segment
 *         schema:
 *           type: string
 *           enum: [vip, regular, new]
 *         description: Filter by customer segment
 *     responses:
 *       200:
 *         description: List of customers
 *       500:
 *         description: Server error
 */
export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const { search, segment } = req.query;
    
    const whereClause: any = {};
    
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (segment) {
      whereClause.segment = segment;
    }
    
    const customers = await CustomerModel.findAll({
      where: whereClause,
      order: [['lastName', 'ASC'], ['firstName', 'ASC']]
    });
    
    return res.status(200).json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customer details
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const customer = await CustomerModel.findByPk(id);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    return res.status(200).json(customer);
  } catch (error) {
    console.error(`Error fetching customer ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

/**
 * @swagger
 * /api/customers/{id}/orders:
 *   get:
 *     summary: Get customer orders
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customer orders
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
export const getCustomerOrders = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const customer = await CustomerModel.findByPk(id);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const orders = await Order.findAll({
      where: { customerId: id },
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json(orders);
  } catch (error) {
    console.error(`Error fetching orders for customer ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to fetch customer orders' });
  }
};

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Customer created
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
export const createCustomer = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      birthDate,
      gender,
      notes,
      userId
    } = req.body;
    
    // Required fields validation
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }
    
    // Check if customer with this email already exists
    const existingCustomer = await CustomerModel.findOne({
      where: { email }
    });
    
    if (existingCustomer) {
      return res.status(400).json({ error: 'Customer with this email already exists' });
    }
    
    // Create customer with default segment and loyalty points
    const newCustomer = await CustomerModel.create({
      userId: userId || null,
      firstName,
      lastName,
      email,
      phone,
      birthDate,
      gender,
      notes,
      segment: 'new',
      loyaltyPoints: 0,
      totalSpent: 0,
      isActive: true
    });
    
    return res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    return res.status(500).json({ error: 'Failed to create customer' });
  }
};

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               notes:
 *                 type: string
 *               segment:
 *                 type: string
 *                 enum: [vip, regular, new]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Customer updated
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      birthDate,
      gender,
      notes,
      segment,
      isActive
    } = req.body;
    
    const customer = await CustomerModel.findByPk(id);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Check if email is being updated and is already in use by another customer
    if (email && email !== customer.email) {
      const existingCustomer = await CustomerModel.findOne({
        where: { email, id: { [Op.ne]: id } }
      });
      
      if (existingCustomer) {
        return res.status(400).json({ error: 'Email is already in use by another customer' });
      }
    }
    
    // Update fields
    const updates: any = {};
    
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (email) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (birthDate !== undefined) updates.birthDate = birthDate;
    if (gender !== undefined) updates.gender = gender;
    if (notes !== undefined) updates.notes = notes;
    if (segment) updates.segment = segment;
    if (isActive !== undefined) updates.isActive = isActive;
    
    await customer.update(updates);
    
    return res.status(200).json(customer);
  } catch (error) {
    console.error(`Error updating customer ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to update customer' });
  }
};

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: Delete customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customer deleted
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const customer = await CustomerModel.findByPk(id);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Soft delete by deactivating instead of permanently removing
    await customer.update({ isActive: false });
    
    return res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error(`Error deleting customer ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to delete customer' });
  }
};

/**
 * @swagger
 * /api/customers/{id}/send-message:
 *   post:
 *     summary: Send message to customer via preferred channel
 *     tags: [Customers]
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
 *               - channel
 *               - message
 *             properties:
 *               channel:
 *                 type: string
 *                 enum: [email, sms, whatsapp, push]
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *               html:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
export const sendCustomerMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { channel, subject, message, html } = req.body;
    
    if (!channel || !message) {
      return res.status(400).json({ error: 'Channel and message are required' });
    }
    
    const customer = await CustomerModel.findByPk(id);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    let result;
    
    switch (channel) {
      case 'email':
        if (!customer.email) {
          return res.status(400).json({ error: 'Customer has no email address' });
        }
        
        result = await notificationService.sendEmail(
          customer.email,
          subject || 'Important notification from Gold360',
          html || `<p>${message}</p>`,
          message
        );
        break;
        
      case 'sms':
        if (!customer.phone) {
          return res.status(400).json({ error: 'Customer has no phone number' });
        }
        
        result = await notificationService.sendSMS(
          customer.phone,
          message
        );
        break;
        
      case 'whatsapp':
        if (!customer.phone) {
          return res.status(400).json({ error: 'Customer has no phone number' });
        }
        
        result = await notificationService.sendWhatsAppMessage(
          customer.phone,
          message
        );
        break;
        
      case 'push':
        // Normalde burada token bilgisi Customer modelinde olmalı veya başka bir servis üzerinden alınmalı
        return res.status(501).json({ error: 'Push notification is not fully implemented yet' });
        
      default:
        return res.status(400).json({ error: `Unsupported channel: ${channel}` });
    }
    
    // İşlem kaydı (loglama)
    console.log(`Message sent to customer ${id} via ${channel}:`, result);
    
    return res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    console.error(`Error sending message to customer ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to send message to customer' });
  }
};

/**
 * @swagger
 * /api/customers/bulk-message:
 *   post:
 *     summary: Send bulk message to multiple customers
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerIds
 *               - channel
 *               - message
 *             properties:
 *               customerIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               segment:
 *                 type: string
 *                 enum: [vip, regular, new, all]
 *               channel:
 *                 type: string
 *                 enum: [email, sms, whatsapp]
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *               html:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bulk message sent
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
export const sendBulkCustomerMessage = async (req: Request, res: Response) => {
  try {
    const { customerIds, segment, channel, subject, message, html } = req.body;
    
    if ((!customerIds && !segment) || !channel || !message) {
      return res.status(400).json({ error: 'Customer selection, channel and message are required' });
    }
    
    if (channel !== 'email' && channel !== 'sms' && channel !== 'whatsapp') {
      return res.status(400).json({ error: `Channel ${channel} is not supported for bulk messages` });
    }
    
    // Müşteri listesini al
    let customers: Customer[] = [];
    
    if (customerIds && Array.isArray(customerIds) && customerIds.length > 0) {
      customers = await CustomerModel.findAll({
        where: {
          id: { [Op.in]: customerIds },
          isActive: true
        }
      });
    } else if (segment) {
      const whereClause: any = {
        isActive: true
      };
      
      if (segment !== 'all') {
        whereClause.segment = segment;
      }
      
      customers = await CustomerModel.findAll({
        where: whereClause
      });
    }
    
    if (customers.length === 0) {
      return res.status(400).json({ error: 'No matching active customers found' });
    }
    
    // Her müşteri için iletişim bilgisi kontrolü
    const recipients = customers.map(customer => {
      switch (channel) {
        case 'email':
          return customer.email ? { type: channel, target: customer.email } : null;
        case 'sms':
        case 'whatsapp':
          return customer.phone ? { type: channel, target: customer.phone } : null;
        default:
          return null;
      }
    }).filter(Boolean) as Array<{type: 'email' | 'sms' | 'whatsapp', target: string}>;
    
    if (recipients.length === 0) {
      return res.status(400).json({ error: `No customers with valid ${channel} contact information found` });
    }
    
    // Toplu mesaj gönderimi
    const results = await notificationService.sendBulkNotifications(
      recipients,
      {
        subject,
        message,
        html
      }
    );
    
    return res.status(200).json({
      success: true,
      totalCustomers: customers.length,
      sentCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      results
    });
  } catch (error) {
    console.error('Error sending bulk message:', error);
    return res.status(500).json({ error: 'Failed to send bulk message' });
  }
};

export default {
  getAllCustomers,
  getCustomerById,
  getCustomerOrders,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  sendCustomerMessage,
  sendBulkCustomerMessage
}; 