import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Customer, CustomerType, CustomerLoyaltyTier, CustomerAddress, AddressType } from '../models/customer.model';
import { User } from '../models/user.model';
import { Order } from '../models/order.model';

// Get all customers with optional filtering
export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const {
      search,
      type,
      loyaltyTier,
      limit = 10,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (type && Object.values(CustomerType).includes(type as CustomerType)) {
      filter.type = type;
    }
    
    if (loyaltyTier && Object.values(CustomerLoyaltyTier).includes(loyaltyTier as CustomerLoyaltyTier)) {
      filter.loyaltyTier = loyaltyTier;
    }

    // Join with User model for search
    const includeUser: any = {
      model: User,
      attributes: ['id', 'email', 'firstName', 'lastName', 'active']
    };

    // Add search filter if provided
    if (search) {
      includeUser.where = {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }

    const customers = await Customer.findAndCountAll({
      where: filter,
      include: [
        includeUser,
        {
          model: Order,
          attributes: ['id', 'orderNumber', 'totalAmount', 'createdAt'],
          limit: 5,
          order: [['createdAt', 'DESC']]
        }
      ],
      limit: Number(limit),
      offset: Number(offset),
      order: [[sortBy as string, sortOrder as string]]
    });

    return res.status(200).json({
      total: customers.count,
      customers: customers.rows,
      limit: Number(limit),
      offset: Number(offset),
      totalPages: Math.ceil(customers.count / Number(limit))
    });
  } catch (error) {
    console.error('Error getting customers:', error);
    return res.status(500).json({
      message: 'Server error while fetching customers',
      error: (error as Error).message
    });
  }
};

// Get a customer by ID
export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.id);
    
    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    const customer = await Customer.findByPk(customerId, {
      include: [
        {
          model: User,
          attributes: ['id', 'email', 'firstName', 'lastName', 'active']
        },
        {
          model: Order,
          attributes: ['id', 'orderNumber', 'totalAmount', 'createdAt', 'status', 'paymentStatus'],
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    return res.status(200).json(customer);
  } catch (error) {
    console.error(`Error getting customer ID ${req.params.id}:`, error);
    return res.status(500).json({
      message: 'Server error while fetching customer',
      error: (error as Error).message
    });
  }
};

// Create a new customer
export const createCustomer = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      type,
      companyName,
      taxId,
      phoneNumber,
      addresses,
      preferences,
      notes,
      marketingConsent
    } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if customer already exists for this user
    const existingCustomer = await Customer.findOne({ where: { userId } });
    if (existingCustomer) {
      return res.status(409).json({ message: 'Customer profile already exists for this user' });
    }

    // Create the customer
    const customer = await Customer.create({
      userId,
      type: type || CustomerType.INDIVIDUAL,
      companyName,
      taxId,
      phoneNumber,
      addresses: addresses || [],
      preferences,
      notes,
      marketingConsent: marketingConsent || false,
      loyaltyTier: CustomerLoyaltyTier.STANDARD,
      loyaltyPoints: 0,
      lastContactDate: new Date(),
      lifetimeValue: 0
    });

    return res.status(201).json({
      message: 'Customer created successfully',
      customer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return res.status(500).json({
      message: 'Server error while creating customer',
      error: (error as Error).message
    });
  }
};

// Update a customer
export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.id);
    
    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    const {
      type,
      companyName,
      taxId,
      phoneNumber,
      addresses,
      preferences,
      notes,
      marketingConsent
    } = req.body;

    // Find the customer
    const customer = await Customer.findByPk(customerId);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Update customer fields
    await customer.update({
      type: type || customer.type,
      companyName: companyName !== undefined ? companyName : customer.companyName,
      taxId: taxId !== undefined ? taxId : customer.taxId,
      phoneNumber: phoneNumber !== undefined ? phoneNumber : customer.phoneNumber,
      addresses: addresses || customer.addresses,
      preferences: preferences || customer.preferences,
      notes: notes !== undefined ? notes : customer.notes,
      marketingConsent: marketingConsent !== undefined ? marketingConsent : customer.marketingConsent,
      lastContactDate: new Date()
    });

    return res.status(200).json({
      message: 'Customer updated successfully',
      customer
    });
  } catch (error) {
    console.error(`Error updating customer ID ${req.params.id}:`, error);
    return res.status(500).json({
      message: 'Server error while updating customer',
      error: (error as Error).message
    });
  }
};

// Delete a customer (soft delete)
export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.id);
    
    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    const customer = await Customer.findByPk(customerId);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await customer.destroy();

    return res.status(200).json({
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error(`Error deleting customer ID ${req.params.id}:`, error);
    return res.status(500).json({
      message: 'Server error while deleting customer',
      error: (error as Error).message
    });
  }
};

// Get customer loyalty points
export const getCustomerLoyalty = async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.id);
    
    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    const customer = await Customer.findByPk(customerId, {
      attributes: ['id', 'loyaltyPoints', 'loyaltyTier', 'lifetimeValue']
    });
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    return res.status(200).json({
      id: customer.id,
      loyaltyPoints: customer.loyaltyPoints,
      loyaltyTier: customer.loyaltyTier,
      lifetimeValue: customer.lifetimeValue
    });
  } catch (error) {
    console.error(`Error getting loyalty for customer ID ${req.params.id}:`, error);
    return res.status(500).json({
      message: 'Server error while fetching customer loyalty',
      error: (error as Error).message
    });
  }
};

// Update customer loyalty points
export const updateCustomerLoyalty = async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.id);
    
    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    const { points, tier, reason } = req.body;

    if (points === undefined && tier === undefined) {
      return res.status(400).json({ message: 'Either points or tier must be provided' });
    }

    const customer = await Customer.findByPk(customerId);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Update loyalty points if provided
    if (points !== undefined) {
      const newPoints = customer.loyaltyPoints + parseInt(points);
      await customer.update({ loyaltyPoints: newPoints >= 0 ? newPoints : 0 });

      // Automatically update tier based on points
      if (newPoints >= 1000 && customer.loyaltyTier !== CustomerLoyaltyTier.PLATINUM) {
        await customer.update({ loyaltyTier: CustomerLoyaltyTier.PLATINUM });
      } else if (newPoints >= 500 && newPoints < 1000 && customer.loyaltyTier !== CustomerLoyaltyTier.GOLD) {
        await customer.update({ loyaltyTier: CustomerLoyaltyTier.GOLD });
      } else if (newPoints >= 200 && newPoints < 500 && customer.loyaltyTier !== CustomerLoyaltyTier.SILVER) {
        await customer.update({ loyaltyTier: CustomerLoyaltyTier.SILVER });
      }
    }

    // Update tier if explicitly provided
    if (tier && Object.values(CustomerLoyaltyTier).includes(tier as CustomerLoyaltyTier)) {
      await customer.update({ loyaltyTier: tier as CustomerLoyaltyTier });
    }

    const updatedCustomer = await Customer.findByPk(customerId, {
      attributes: ['id', 'loyaltyPoints', 'loyaltyTier']
    });

    return res.status(200).json({
      message: 'Customer loyalty updated successfully',
      customer: updatedCustomer,
      reason
    });
  } catch (error) {
    console.error(`Error updating loyalty for customer ID ${req.params.id}:`, error);
    return res.status(500).json({
      message: 'Server error while updating customer loyalty',
      error: (error as Error).message
    });
  }
};

// Add a new address to customer
export const addCustomerAddress = async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.id);
    const { type, street, city, state, postalCode, country, isDefault } = req.body;

    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    // Validate required fields
    if (!street || !city || !state || !postalCode || !country || !type) {
      return res.status(400).json({ message: 'All address fields are required' });
    }

    // Validate address type
    if (!Object.values(AddressType).includes(type)) {
      return res.status(400).json({ 
        message: 'Invalid address type. Must be one of: ' + Object.values(AddressType).join(', ')
      });
    }

    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const newAddress: CustomerAddress = {
      type: type as AddressType,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault: isDefault || false
    };

    // If this is the first address or marked as default, update other addresses
    const currentAddresses = [...customer.addresses];
    if (newAddress.isDefault || currentAddresses.length === 0) {
      currentAddresses.forEach(addr => addr.isDefault = false);
      newAddress.isDefault = true;
    }

    currentAddresses.push(newAddress);

    await customer.update({ addresses: currentAddresses });

    return res.status(200).json({
      message: 'Address added successfully',
      addresses: currentAddresses
    });
  } catch (error) {
    console.error('Error adding customer address:', error);
    return res.status(500).json({
      message: 'Server error while adding address',
      error: (error as Error).message
    });
  }
};

// Update a customer address
export const updateCustomerAddress = async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.id);
    const addressIndex = parseInt(req.params.addressIndex);
    const { type, street, city, state, postalCode, country, isDefault } = req.body;

    if (isNaN(customerId) || isNaN(addressIndex)) {
      return res.status(400).json({ message: 'Invalid customer ID or address index' });
    }

    // Validate address type if provided
    if (type && !Object.values(AddressType).includes(type)) {
      return res.status(400).json({ 
        message: 'Invalid address type. Must be one of: ' + Object.values(AddressType).join(', ')
      });
    }

    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const addresses = [...customer.addresses];
    if (addressIndex < 0 || addressIndex >= addresses.length) {
      return res.status(404).json({ message: 'Address not found' });
    }

    addresses[addressIndex] = {
      type: type as AddressType || addresses[addressIndex].type,
      street: street || addresses[addressIndex].street,
      city: city || addresses[addressIndex].city,
      state: state || addresses[addressIndex].state,
      postalCode: postalCode || addresses[addressIndex].postalCode,
      country: country || addresses[addressIndex].country,
      isDefault: isDefault || addresses[addressIndex].isDefault
    };

    // If marked as default, update other addresses
    if (isDefault) {
      addresses.forEach((addr, idx) => {
        if (idx !== addressIndex) {
          addr.isDefault = false;
        }
      });
    }

    await customer.update({ addresses });

    return res.status(200).json({
      message: 'Address updated successfully',
      addresses
    });
  } catch (error) {
    console.error('Error updating customer address:', error);
    return res.status(500).json({
      message: 'Server error while updating address',
      error: (error as Error).message
    });
  }
};

// Delete customer address
export const deleteCustomerAddress = async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.id);
    const addressIndex = parseInt(req.params.addressIndex);
    
    if (isNaN(customerId) || isNaN(addressIndex)) {
      return res.status(400).json({ message: 'Invalid customer ID or address index' });
    }

    const customer = await Customer.findByPk(customerId);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Get current addresses
    const addresses = [...customer.addresses];
    
    if (addressIndex < 0 || addressIndex >= addresses.length) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Check if trying to delete the default address
    if (addresses[addressIndex].isDefault && addresses.length > 1) {
      // Set the first other address as default
      const newDefaultIndex = addressIndex === 0 ? 1 : 0;
      addresses[newDefaultIndex].isDefault = true;
    }

    // Remove the address
    addresses.splice(addressIndex, 1);

    // Update customer with modified addresses
    await customer.update({ addresses });

    return res.status(200).json({
      message: 'Address deleted successfully',
      addresses
    });
  } catch (error) {
    console.error(`Error deleting address for customer ID ${req.params.id}:`, error);
    return res.status(500).json({
      message: 'Server error while deleting customer address',
      error: (error as Error).message
    });
  }
};

// Update customer lifetime value
export const updateLifetimeValue = async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.id);
    
    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ message: 'Value must be provided' });
    }

    const valueNum = parseFloat(value);
    
    if (isNaN(valueNum)) {
      return res.status(400).json({ message: 'Value must be a number' });
    }

    const customer = await Customer.findByPk(customerId);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Update lifetime value
    const newValue = customer.lifetimeValue + valueNum;
    await customer.update({ lifetimeValue: newValue >= 0 ? newValue : 0 });

    return res.status(200).json({
      message: 'Customer lifetime value updated successfully',
      lifetimeValue: newValue >= 0 ? newValue : 0
    });
  } catch (error) {
    console.error(`Error updating lifetime value for customer ID ${req.params.id}:`, error);
    return res.status(500).json({
      message: 'Server error while updating customer lifetime value',
      error: (error as Error).message
    });
  }
}; 