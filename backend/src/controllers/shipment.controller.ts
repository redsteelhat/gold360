import { Request, Response } from 'express';
import { Shipment, ShipmentNotification, Order, Customer } from '../models';
import axios from 'axios';
import { Op } from 'sequelize';

// Add type interfaces for our models to fix type issues
interface ICustomer {
  id: number;
  email?: string;
  phone?: string;
  [key: string]: any;
}

interface IOrder {
  id: number;
  status: string;
  customer?: ICustomer;
  update: (data: any) => Promise<any>;
  [key: string]: any;
}

interface IShipment {
  id: number;
  orderId: number;
  carrierName: string;
  trackingNumber: string;
  trackingUrl?: string;
  status: string;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  shippingCost: number;
  shippingAddress: string;
  recipientName: string;
  recipientPhone?: string;
  notes?: string;
  Order?: IOrder;
  update: (data: any) => Promise<any>;
  [key: string]: any;
}

interface IShipmentNotification {
  id: number;
  shipmentId: number;
  notificationType: 'sms' | 'email' | 'push';
  recipient: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  Shipment?: IShipment;
  update: (data: any) => Promise<any>;
  [key: string]: any;
}

interface TrackingInfo {
  status: string;
  location?: string;
  timestamp?: string;
  details?: string;
  [key: string]: any;
}

/**
 * @swagger
 * tags:
 *   name: Shipments
 *   description: Shipment management
 */

/**
 * @swagger
 * /api/shipments:
 *   get:
 *     summary: Get all shipments
 *     tags: [Shipments]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: integer
 *         description: Filter by order ID
 *     responses:
 *       200:
 *         description: List of shipments
 *       500:
 *         description: Server error
 */
export const getAllShipments = async (req: Request, res: Response) => {
  try {
    const { status, orderId } = req.query;
    
    const whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (orderId) {
      whereClause.orderId = orderId;
    }
    
    const shipments = await Shipment.findAll({
      where: whereClause,
      include: [
        { 
          model: Order, 
          include: [{ model: Customer, as: 'customer' }] 
        },
        { model: ShipmentNotification }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json(shipments);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return res.status(500).json({ error: 'Failed to fetch shipments' });
  }
};

/**
 * @swagger
 * /api/shipments/{id}:
 *   get:
 *     summary: Get shipment by ID
 *     tags: [Shipments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Shipment details
 *       404:
 *         description: Shipment not found
 *       500:
 *         description: Server error
 */
export const getShipmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const shipment = await Shipment.findByPk(id, {
      include: [
        { 
          model: Order, 
          include: [{ model: Customer, as: 'customer' }] 
        },
        { model: ShipmentNotification }
      ]
    });
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    return res.status(200).json(shipment);
  } catch (error) {
    console.error('Error fetching shipment:', error);
    return res.status(500).json({ error: 'Failed to fetch shipment' });
  }
};

/**
 * @swagger
 * /api/shipments:
 *   post:
 *     summary: Create a new shipment
 *     tags: [Shipments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - carrierName
 *               - trackingNumber
 *               - shippingAddress
 *               - recipientName
 *             properties:
 *               orderId:
 *                 type: integer
 *               carrierName:
 *                 type: string
 *               trackingNumber:
 *                 type: string
 *               trackingUrl:
 *                 type: string
 *               status:
 *                 type: string
 *               estimatedDeliveryDate:
 *                 type: string
 *                 format: date-time
 *               shippingCost:
 *                 type: number
 *               shippingAddress:
 *                 type: string
 *               recipientName:
 *                 type: string
 *               recipientPhone:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Shipment created
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
export const createShipment = async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      carrierName,
      trackingNumber,
      trackingUrl,
      status,
      estimatedDeliveryDate,
      shippingCost,
      shippingAddress,
      recipientName,
      recipientPhone,
      notes,
      sendNotification = true
    } = req.body;
    
    // Validate required fields
    if (!orderId || !carrierName || !trackingNumber || !shippingAddress || !recipientName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if order exists
    const order = await Order.findByPk(orderId, {
      include: [{ model: Customer, as: 'customer' }]
    }) as unknown as IOrder;
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Create shipment
    const shipment = await Shipment.create({
      orderId,
      carrierName,
      trackingNumber,
      trackingUrl,
      status: status || 'pending',
      estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : undefined,
      shippingCost: shippingCost || 0,
      shippingAddress,
      recipientName,
      recipientPhone,
      notes
    });
    
    // Update order status if necessary
    if (status === 'shipped') {
      await order.update({ status: 'shipped' });
    }
    
    // Send notification if requested
    if (sendNotification && order.customer && order.customer.email) {
      // Create email notification
      const emailNotification = await ShipmentNotification.create({
        shipmentId: shipment.id,
        notificationType: 'email',
        recipient: order.customer.email,
        message: `Your order #${order.id} has been shipped with ${carrierName}. Tracking number: ${trackingNumber}.`,
        status: 'pending'
      });
      
      // Create SMS notification if phone is available
      if (recipientPhone || (order.customer && order.customer.phone)) {
        await ShipmentNotification.create({
          shipmentId: shipment.id,
          notificationType: 'sms',
          recipient: recipientPhone || order.customer.phone,
          message: `Your order #${order.id} has been shipped with ${carrierName}. Tracking number: ${trackingNumber}.`,
          status: 'pending'
        });
      }
    }
    
    return res.status(201).json(shipment);
  } catch (error) {
    console.error('Error creating shipment:', error);
    return res.status(500).json({ error: 'Failed to create shipment' });
  }
};

/**
 * @swagger
 * /api/shipments/{id}:
 *   put:
 *     summary: Update shipment
 *     tags: [Shipments]
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
 *               carrierName:
 *                 type: string
 *               trackingNumber:
 *                 type: string
 *               trackingUrl:
 *                 type: string
 *               status:
 *                 type: string
 *               estimatedDeliveryDate:
 *                 type: string
 *                 format: date-time
 *               actualDeliveryDate:
 *                 type: string
 *                 format: date-time
 *               shippingCost:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shipment updated
 *       404:
 *         description: Shipment not found
 *       500:
 *         description: Server error
 */
export const updateShipment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      carrierName,
      trackingNumber,
      trackingUrl,
      status,
      estimatedDeliveryDate,
      actualDeliveryDate,
      shippingCost,
      notes,
      sendNotification = false
    } = req.body;
    
    const shipment = await Shipment.findByPk(id, {
      include: [{ model: Order, include: [{ model: Customer, as: 'customer' }] }]
    }) as unknown as IShipment;
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    // Track status change for notifications
    const statusChanged = status && status !== shipment.status;
    const oldStatus = shipment.status;
    
    await shipment.update({
      carrierName: carrierName || shipment.carrierName,
      trackingNumber: trackingNumber || shipment.trackingNumber,
      trackingUrl: trackingUrl !== undefined ? trackingUrl : shipment.trackingUrl,
      status: status || shipment.status,
      estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : shipment.estimatedDeliveryDate,
      actualDeliveryDate: actualDeliveryDate ? new Date(actualDeliveryDate) : shipment.actualDeliveryDate,
      shippingCost: shippingCost !== undefined ? shippingCost : shipment.shippingCost,
      notes: notes !== undefined ? notes : shipment.notes
    });
    
    // Update order status if shipment status changes
    if (statusChanged && shipment.Order) {
      if (status === 'delivered') {
        await shipment.Order.update({ status: 'delivered' });
      } else if (status === 'shipped' || status === 'in_transit') {
        await shipment.Order.update({ status: 'shipped' });
      } else if (status === 'failed' || status === 'returned') {
        await shipment.Order.update({ status: 'problem' });
      }
      
      // Send notifications for status changes if requested or for key status changes
      if ((sendNotification || status === 'delivered' || status === 'shipped') && 
          shipment.Order.customer) {
        let message = '';
        if (status === 'delivered') {
          message = `Your order #${shipment.Order.id} has been delivered.`;
        } else if (status === 'shipped') {
          message = `Your order #${shipment.Order.id} has been shipped with ${shipment.carrierName}. Tracking number: ${shipment.trackingNumber}.`;
        } else if (status === 'in_transit') {
          message = `Your order #${shipment.Order.id} is now in transit.`;
        } else {
          message = `The status of your order #${shipment.Order.id} has been updated to ${status}.`;
        }
        
        // Send email notification
        if (shipment.Order.customer.email) {
          await ShipmentNotification.create({
            shipmentId: shipment.id,
            notificationType: 'email',
            recipient: shipment.Order.customer.email,
            message,
            status: 'pending'
          });
        }
        
        // Send SMS notification if phone is available
        if (shipment.Order.customer.phone) {
          await ShipmentNotification.create({
            shipmentId: shipment.id,
            notificationType: 'sms',
            recipient: shipment.Order.customer.phone,
            message,
            status: 'pending'
          });
        }
      }
    }
    
    return res.status(200).json(shipment);
  } catch (error) {
    console.error('Error updating shipment:', error);
    return res.status(500).json({ error: 'Failed to update shipment' });
  }
};

// Helper function to simulate tracking information (would be replaced with real carrier API integration)
async function simulateTrackingInfo(carrierName: string, trackingNumber: string): Promise<TrackingInfo> {
  // This is a placeholder function to simulate tracking data that would come from a real carrier API
  return {
    status: 'in_transit', // Using one of the valid enum values
    location: 'Distribution Center',
    timestamp: new Date().toISOString(),
    details: 'Package is in transit',
    carrier: carrierName,
    trackingNumber: trackingNumber,
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    trackingEvents: [
      {
        date: new Date().toISOString(),
        location: 'Distribution Center',
        status: 'In Transit',
        description: 'Package is in transit'
      },
      {
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        location: 'Sorting Facility',
        status: 'Processed',
        description: 'Package has been processed at sorting facility'
      },
      {
        date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        location: 'Shipping Origin',
        status: 'Shipped',
        description: 'Package has been shipped'
      }
    ]
  };
}

/**
 * @swagger
 * /api/shipments/track/{trackingNumber}:
 *   get:
 *     summary: Track shipment by tracking number
 *     tags: [Shipments]
 *     parameters:
 *       - in: path
 *         name: trackingNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tracking information
 *       404:
 *         description: Shipment not found
 *       500:
 *         description: Server error
 */
export const trackShipment = async (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.params;
    
    if (!trackingNumber) {
      return res.status(400).json({ error: 'Tracking number is required' });
    }
    
    // Find the shipment with the given tracking number
    const shipment = await Shipment.findOne({
      where: { trackingNumber },
      include: [{ model: Order }]
    }) as IShipment | null;
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    // This would be replaced with an actual API call to a shipping carrier
    // For demonstration, we're simulating tracking data
    const trackingInfo: TrackingInfo = await simulateTrackingInfo(shipment.carrierName, trackingNumber);
    
    // Update the shipment status based on tracking info if needed
    if (trackingInfo.status && trackingInfo.status !== shipment.status) {
      // Only update if the tracking status is one of the valid shipment statuses
      const validStatuses = ['pending', 'processing', 'shipped', 'in_transit', 'delivered', 'failed', 'returned'];
      if (validStatuses.includes(trackingInfo.status)) {
        await shipment.update({ status: trackingInfo.status });
        
        // If delivered, update delivery date and order status
        if (trackingInfo.status === 'delivered') {
          await shipment.update({ actualDeliveryDate: new Date() });
          
          if (shipment.Order) {
            await shipment.Order.update({ status: 'delivered' });
          }
        }
      }
    }
    
    return res.status(200).json({
      shipment,
      trackingInfo
    });
  } catch (error: any) {
    console.error('Error tracking shipment:', error);
    return res.status(500).json({ error: error.message || 'Failed to track shipment' });
  }
};

/**
 * @swagger
 * /api/shipments/notifications/{id}:
 *   get:
 *     summary: Get all notifications for a shipment
 *     tags: [Shipments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of notifications
 *       404:
 *         description: Shipment not found
 *       500:
 *         description: Server error
 */
export const getShipmentNotifications = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const shipment = await Shipment.findByPk(id);
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    const notifications = await ShipmentNotification.findAll({
      where: { shipmentId: id },
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching shipment notifications:', error);
    return res.status(500).json({ error: 'Failed to fetch shipment notifications' });
  }
};

/**
 * @swagger
 * /api/shipments/notifications:
 *   post:
 *     summary: Send a notification for a shipment
 *     tags: [Shipments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shipmentId
 *               - notificationType
 *               - recipient
 *               - message
 *             properties:
 *               shipmentId:
 *                 type: integer
 *               notificationType:
 *                 type: string
 *                 enum: [sms, email, push]
 *               recipient:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notification created
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Shipment not found
 *       500:
 *         description: Server error
 */
export const sendShipmentNotification = async (req: Request, res: Response) => {
  try {
    const {
      shipmentId,
      notificationType,
      recipient,
      message
    } = req.body;
    
    // Validate required fields
    if (!shipmentId || !notificationType || !recipient || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if shipment exists
    const shipment = await Shipment.findByPk(shipmentId);
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    // Create notification
    const notification = await ShipmentNotification.create({
      shipmentId,
      notificationType,
      recipient,
      message,
      status: 'pending'
    });
    
    // In a real app, you would actually send the notification here
    // This is just a simulation
    const sentAt = new Date();
    await notification.update({
      status: 'sent',
      sentAt
    });
    
    return res.status(201).json(notification);
  } catch (error) {
    console.error('Error sending shipment notification:', error);
    return res.status(500).json({ error: 'Failed to send shipment notification' });
  }
};

/**
 * @swagger
 * /api/shipments/process-notifications:
 *   post:
 *     summary: Process pending notifications
 *     tags: [Shipments]
 *     responses:
 *       200:
 *         description: Notifications processed
 *       500:
 *         description: Server error
 */
export const processNotifications = async (req: Request, res: Response) => {
  try {
    // Find all pending notifications
    const pendingNotifications = await ShipmentNotification.findAll({
      where: { status: 'pending' },
      include: [{ model: Shipment }]
    }) as unknown as IShipmentNotification[];
    
    const results = {
      total: pendingNotifications.length,
      sent: 0,
      failed: 0
    };
    
    // Process each notification
    for (const notification of pendingNotifications) {
      try {
        // In a real app, you would send the notification using appropriate service
        // (Twilio for SMS, SendGrid for email, FCM for push notifications, etc.)
        
        // Simulate sending the notification
        // Example with Twilio for SMS (commented out as it's just an example)
        /*
        if (notification.notificationType === 'sms') {
          const twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          await twilioClient.messages.create({
            body: notification.message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: notification.recipient
          });
        } else if (notification.notificationType === 'email') {
          const sgMail = require('@sendgrid/mail');
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          await sgMail.send({
            to: notification.recipient,
            from: process.env.SENDGRID_FROM_EMAIL,
            subject: `Order Update for Order #${notification.Shipment?.orderId}`,
            text: notification.message
          });
        }
        */
        
        // Update notification status
        await notification.update({
          status: 'sent',
          sentAt: new Date()
        });
        
        results.sent++;
      } catch (error: any) {
        console.error(`Error sending notification ${notification.id}:`, error);
        
        // Update notification status as failed
        await notification.update({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error)
        });
        
        results.failed++;
      }
    }
    
    return res.status(200).json({
      message: 'Notifications processed',
      results
    });
  } catch (error) {
    console.error('Error processing notifications:', error);
    return res.status(500).json({ error: 'Failed to process notifications' });
  }
};

export default {
  getAllShipments,
  getShipmentById,
  createShipment,
  updateShipment,
  trackShipment,
  getShipmentNotifications,
  sendShipmentNotification,
  processNotifications
}; 