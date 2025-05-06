import { Request, Response } from 'express';
import Shipping from '../models/shipping.model';
import ShippingProvider from '../models/shippingProvider.model';
import Order from '../models/order.model';
import { logger } from '../utils/logger';

// Manual validation instead of express-validator
const validateRequest = (data: any, requiredFields: string[]): string[] => {
  const errors: string[] = [];
  requiredFields.forEach(field => {
    if (!data[field]) {
      errors.push(`${field} is required`);
    }
  });
  return errors;
};

class ShippingController {
  /**
   * Get all shipping records
   */
  public async getAllShippingRecords(req: Request, res: Response): Promise<Response> {
    try {
      const shippingRecords = await Shipping.findAll({
        include: [{ model: Order }],
      });
      return res.status(200).json({ success: true, data: shippingRecords });
    } catch (error: any) {
      logger.error('Error fetching shipping records:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch shipping records', error: error.message });
    }
  }

  /**
   * Get shipping by ID
   */
  public async getShippingById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const shipping = await Shipping.findByPk(id, {
        include: [{ model: Order }],
      });

      if (!shipping) {
        return res.status(404).json({ success: false, message: 'Shipping record not found' });
      }

      return res.status(200).json({ success: true, data: shipping });
    } catch (error: any) {
      logger.error(`Error fetching shipping record with ID ${req.params.id}:`, error);
      return res.status(500).json({ success: false, message: 'Failed to fetch shipping record', error: error.message });
    }
  }

  /**
   * Get shipping by order ID
   */
  public async getShippingByOrderId(req: Request, res: Response): Promise<Response> {
    try {
      const { orderId } = req.params;
      const shipping = await Shipping.findOne({
        where: { orderId },
        include: [{ model: Order }],
      });

      if (!shipping) {
        return res.status(404).json({ success: false, message: 'Shipping record not found for this order' });
      }

      return res.status(200).json({ success: true, data: shipping });
    } catch (error: any) {
      logger.error(`Error fetching shipping record for order ID ${req.params.orderId}:`, error);
      return res.status(500).json({ success: false, message: 'Failed to fetch shipping record', error: error.message });
    }
  }

  /**
   * Create a new shipping record
   */
  public async createShipping(req: Request, res: Response): Promise<Response> {
    const requiredFields = ['orderId', 'carrier', 'trackingNumber', 'shippingCost', 'shippingAddress', 'recipientName', 'recipientPhone'];
    const errors = validateRequest(req.body, requiredFields);
    
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    try {
      const {
        orderId,
        carrier,
        trackingNumber,
        status,
        estimatedDeliveryDate,
        shippingCost,
        shippingAddress,
        recipientName,
        recipientPhone,
        notes,
        packageWeight,
        packageDimensions,
      } = req.body;

      // Check if order exists
      const orderExists = await Order.findByPk(orderId);
      if (!orderExists) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Check if shipping for this order already exists
      const existingShipping = await Shipping.findOne({ where: { orderId } });
      if (existingShipping) {
        return res.status(400).json({ success: false, message: 'Shipping record already exists for this order' });
      }

      const newShipping = await Shipping.create({
        orderId,
        carrier,
        trackingNumber,
        status: status || 'pending',
        estimatedDeliveryDate: estimatedDeliveryDate || null,
        actualDeliveryDate: null,
        shippingCost,
        shippingAddress,
        recipientName,
        recipientPhone,
        notes: notes || null,
        packageWeight: packageWeight || null,
        packageDimensions: packageDimensions || null,
      });

      return res.status(201).json({ success: true, data: newShipping });
    } catch (error: any) {
      logger.error('Error creating shipping record:', error);
      return res.status(500).json({ success: false, message: 'Failed to create shipping record', error: error.message });
    }
  }

  /**
   * Update a shipping record
   */
  public async updateShipping(req: Request, res: Response): Promise<Response> {
    const requiredFields = ['carrier', 'trackingNumber', 'status'];
    const errors = validateRequest(req.body, requiredFields);
    
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    try {
      const { id } = req.params;
      const {
        carrier,
        trackingNumber,
        status,
        estimatedDeliveryDate,
        actualDeliveryDate,
        shippingCost,
        shippingAddress,
        recipientName,
        recipientPhone,
        notes,
        packageWeight,
        packageDimensions,
      } = req.body;

      const shipping = await Shipping.findByPk(id);
      if (!shipping) {
        return res.status(404).json({ success: false, message: 'Shipping record not found' });
      }

      await shipping.update({
        carrier,
        trackingNumber,
        status,
        estimatedDeliveryDate,
        actualDeliveryDate,
        shippingCost,
        shippingAddress,
        recipientName,
        recipientPhone,
        notes,
        packageWeight,
        packageDimensions,
      });

      return res.status(200).json({ success: true, data: shipping });
    } catch (error: any) {
      logger.error(`Error updating shipping record with ID ${req.params.id}:`, error);
      return res.status(500).json({ success: false, message: 'Failed to update shipping record', error: error.message });
    }
  }

  /**
   * Delete a shipping record
   */
  public async deleteShipping(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const shipping = await Shipping.findByPk(id);

      if (!shipping) {
        return res.status(404).json({ success: false, message: 'Shipping record not found' });
      }

      await shipping.destroy();
      return res.status(200).json({ success: true, message: 'Shipping record deleted successfully' });
    } catch (error: any) {
      logger.error(`Error deleting shipping record with ID ${req.params.id}:`, error);
      return res.status(500).json({ success: false, message: 'Failed to delete shipping record', error: error.message });
    }
  }

  /**
   * Update shipping status
   */
  public async updateShippingStatus(req: Request, res: Response): Promise<Response> {
    const requiredFields = ['status'];
    const errors = validateRequest(req.body, requiredFields);
    
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    try {
      const { id } = req.params;
      const { status, actualDeliveryDate } = req.body;

      const shipping = await Shipping.findByPk(id);
      if (!shipping) {
        return res.status(404).json({ success: false, message: 'Shipping record not found' });
      }

      const updateData: any = { status };
      
      // If status is 'delivered', update the actual delivery date
      if (status === 'delivered' && !actualDeliveryDate) {
        updateData.actualDeliveryDate = new Date();
      } else if (actualDeliveryDate) {
        updateData.actualDeliveryDate = actualDeliveryDate;
      }

      await shipping.update(updateData);
      return res.status(200).json({ success: true, data: shipping });
    } catch (error: any) {
      logger.error(`Error updating shipping status for ID ${req.params.id}:`, error);
      return res.status(500).json({ success: false, message: 'Failed to update shipping status', error: error.message });
    }
  }

  // ShippingProvider methods
  /**
   * Get all shipping providers
   */
  public async getAllShippingProviders(req: Request, res: Response): Promise<Response> {
    try {
      const providers = await ShippingProvider.findAll();
      return res.status(200).json({ success: true, data: providers });
    } catch (error: any) {
      logger.error('Error fetching shipping providers:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch shipping providers', error: error.message });
    }
  }

  /**
   * Get shipping provider by ID
   */
  public async getShippingProviderById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const provider = await ShippingProvider.findByPk(id);

      if (!provider) {
        return res.status(404).json({ success: false, message: 'Shipping provider not found' });
      }

      return res.status(200).json({ success: true, data: provider });
    } catch (error: any) {
      logger.error(`Error fetching shipping provider with ID ${req.params.id}:`, error);
      return res.status(500).json({ success: false, message: 'Failed to fetch shipping provider', error: error.message });
    }
  }

  /**
   * Create a new shipping provider
   */
  public async createShippingProvider(req: Request, res: Response): Promise<Response> {
    const requiredFields = ['name'];
    const errors = validateRequest(req.body, requiredFields);
    
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    try {
      const {
        name,
        apiKey,
        apiSecret,
        baseUrl,
        isActive,
        defaultProvider,
        supportedFeatures,
        accountNumber,
        contactEmail,
        contactPhone,
        notes,
      } = req.body;

      // Check if provider already exists
      const providerExists = await ShippingProvider.findOne({ where: { name } });
      if (providerExists) {
        return res.status(400).json({ success: false, message: 'Shipping provider with this name already exists' });
      }

      // If this is set as default, update existing default provider
      if (defaultProvider) {
        await ShippingProvider.update(
          { defaultProvider: false },
          { where: { defaultProvider: true } }
        );
      }

      const newProvider = await ShippingProvider.create({
        name,
        apiKey,
        apiSecret,
        baseUrl,
        isActive: isActive !== undefined ? isActive : true,
        defaultProvider: defaultProvider !== undefined ? defaultProvider : false,
        supportedFeatures: supportedFeatures || {},
        accountNumber,
        contactEmail,
        contactPhone,
        notes,
      });

      return res.status(201).json({ success: true, data: newProvider });
    } catch (error: any) {
      logger.error('Error creating shipping provider:', error);
      return res.status(500).json({ success: false, message: 'Failed to create shipping provider', error: error.message });
    }
  }

  /**
   * Update a shipping provider
   */
  public async updateShippingProvider(req: Request, res: Response): Promise<Response> {
    const requiredFields = ['name'];
    const errors = validateRequest(req.body, requiredFields);
    
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    try {
      const { id } = req.params;
      const {
        name,
        apiKey,
        apiSecret,
        baseUrl,
        isActive,
        defaultProvider,
        supportedFeatures,
        accountNumber,
        contactEmail,
        contactPhone,
        notes,
      } = req.body;

      const provider = await ShippingProvider.findByPk(id);
      if (!provider) {
        return res.status(404).json({ success: false, message: 'Shipping provider not found' });
      }

      // If setting this provider as default
      if (defaultProvider && !provider.defaultProvider) {
        await ShippingProvider.update(
          { defaultProvider: false },
          { where: { defaultProvider: true } }
        );
      }

      await provider.update({
        name,
        apiKey,
        apiSecret,
        baseUrl,
        isActive,
        defaultProvider,
        supportedFeatures,
        accountNumber,
        contactEmail,
        contactPhone,
        notes,
      });

      return res.status(200).json({ success: true, data: provider });
    } catch (error: any) {
      logger.error(`Error updating shipping provider with ID ${req.params.id}:`, error);
      return res.status(500).json({ success: false, message: 'Failed to update shipping provider', error: error.message });
    }
  }

  /**
   * Delete a shipping provider
   */
  public async deleteShippingProvider(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const provider = await ShippingProvider.findByPk(id);

      if (!provider) {
        return res.status(404).json({ success: false, message: 'Shipping provider not found' });
      }

      if (provider.defaultProvider) {
        return res.status(400).json({ success: false, message: 'Cannot delete the default shipping provider' });
      }

      await provider.destroy();
      return res.status(200).json({ success: true, message: 'Shipping provider deleted successfully' });
    } catch (error: any) {
      logger.error(`Error deleting shipping provider with ID ${req.params.id}:`, error);
      return res.status(500).json({ success: false, message: 'Failed to delete shipping provider', error: error.message });
    }
  }

  /**
   * Set shipping provider as default
   */
  public async setDefaultShippingProvider(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const provider = await ShippingProvider.findByPk(id);

      if (!provider) {
        return res.status(404).json({ success: false, message: 'Shipping provider not found' });
      }

      // Update all providers to non-default
      await ShippingProvider.update(
        { defaultProvider: false },
        { where: { defaultProvider: true } }
      );

      // Set this provider as default
      await provider.update({ defaultProvider: true });

      return res.status(200).json({ success: true, data: provider, message: 'Default shipping provider updated successfully' });
    } catch (error: any) {
      logger.error(`Error setting default shipping provider with ID ${req.params.id}:`, error);
      return res.status(500).json({ success: false, message: 'Failed to set default shipping provider', error: error.message });
    }
  }

  /**
   * Track shipping by tracking number
   * This would integrate with the carrier's API in a real-world scenario
   */
  public async trackShipment(req: Request, res: Response): Promise<Response> {
    try {
      const { trackingNumber, carrier } = req.params;

      // Find the shipping record with this tracking number
      const shipping = await Shipping.findOne({
        where: { trackingNumber },
        include: [{ model: Order }],
      });

      if (!shipping) {
        return res.status(404).json({ success: false, message: 'Shipment not found' });
      }

      // In a real implementation, this would call the appropriate carrier's API
      // For now, we'll return the shipping details we have
      
      // Mock tracking information
      const trackingInfo = {
        trackingNumber: shipping.trackingNumber,
        carrier: shipping.carrier,
        currentStatus: shipping.status,
        estimatedDelivery: shipping.estimatedDeliveryDate,
        shipDate: shipping.createdAt,
        deliveryDate: shipping.actualDeliveryDate,
        lastUpdated: shipping.updatedAt,
        // This would include the tracking history in a real implementation
        trackingHistory: [
          {
            status: 'Order created',
            timestamp: shipping.createdAt,
            location: 'Seller facility',
          },
          {
            status: shipping.status,
            timestamp: shipping.updatedAt,
            location: shipping.status === 'delivered' ? shipping.shippingAddress : 'In transit',
          },
        ],
      };

      return res.status(200).json({ success: true, data: trackingInfo });
    } catch (error: any) {
      logger.error(`Error tracking shipment with tracking number ${req.params.trackingNumber}:`, error);
      return res.status(500).json({ success: false, message: 'Failed to track shipment', error: error.message });
    }
  }

  /**
   * Calculate shipping rates
   * This would integrate with carrier APIs in a real-world scenario
   */
  public async calculateShippingRates(req: Request, res: Response): Promise<Response> {
    const requiredFields = ['weight', 'fromZipCode', 'toZipCode'];
    const errors = validateRequest(req.body, requiredFields);
    
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    try {
      const {
        weight,
        dimensions,
        fromZipCode,
        toZipCode,
        serviceType,
      } = req.body;

      // Get all active shipping providers
      const providers = await ShippingProvider.findAll({
        where: { isActive: true },
      });

      if (providers.length === 0) {
        return res.status(404).json({ success: false, message: 'No active shipping providers found' });
      }

      // In a real implementation, this would call each carrier's API
      // For now, we'll generate mock rates
      const rates = providers.map(provider => {
        // Simple mock calculation based on weight and a random factor
        const baseRate = weight * 5; // $5 per kg
        const randomFactor = 0.8 + Math.random() * 0.4; // Random factor between 0.8 and 1.2
        const calculatedRate = baseRate * randomFactor;
        
        return {
          provider: provider.name,
          providerId: provider.id,
          serviceType: serviceType || 'standard',
          rate: parseFloat(calculatedRate.toFixed(2)),
          currency: 'USD',
          estimatedDeliveryDays: Math.floor(3 + Math.random() * 5), // 3-7 days
          isDefault: provider.defaultProvider,
        };
      });

      // Sort by rate
      rates.sort((a, b) => a.rate - b.rate);

      return res.status(200).json({ success: true, data: rates });
    } catch (error: any) {
      logger.error('Error calculating shipping rates:', error);
      return res.status(500).json({ success: false, message: 'Failed to calculate shipping rates', error: error.message });
    }
  }
}

export default new ShippingController(); 