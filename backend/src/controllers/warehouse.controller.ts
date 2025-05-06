import { Request, Response } from 'express';
import { Warehouse } from '../models/warehouse.model';

// Get all warehouses
export const getAllWarehouses = async (_req: Request, res: Response) => {
  try {
    const warehouses = await Warehouse.findAll({
      where: {
        isActive: true,
      },
    });
    return res.status(200).json({
      success: true,
      data: warehouses,
    });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching warehouses',
      error,
    });
  }
};

// Get warehouse by ID
export const getWarehouseById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const warehouse = await Warehouse.findByPk(id);
    
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: `Warehouse with ID ${id} not found`,
      });
    }
    
    return res.status(200).json({
      success: true,
      data: warehouse,
    });
  } catch (error) {
    console.error(`Error fetching warehouse with ID ${id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching warehouse',
      error,
    });
  }
};

// Create new warehouse
export const createWarehouse = async (req: Request, res: Response) => {
  const {
    name,
    address,
    city,
    state,
    country,
    zipCode,
    contactPerson,
    contactPhone,
    description,
  } = req.body;
  
  try {
    // Validate required fields
    if (!name || !address || !city || !state || !country || !zipCode || !contactPerson || !contactPhone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }
    
    const warehouse = await Warehouse.create({
      name,
      address,
      city,
      state,
      country,
      zipCode,
      contactPerson,
      contactPhone,
      description,
      isActive: true,
    });
    
    return res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
      data: warehouse,
    });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating warehouse',
      error,
    });
  }
};

// Update warehouse
export const updateWarehouse = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    address,
    city,
    state,
    country,
    zipCode,
    contactPerson,
    contactPhone,
    description,
    isActive,
  } = req.body;
  
  try {
    const warehouse = await Warehouse.findByPk(id);
    
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: `Warehouse with ID ${id} not found`,
      });
    }
    
    await warehouse.update({
      name,
      address,
      city,
      state,
      country,
      zipCode,
      contactPerson,
      contactPhone,
      description,
      isActive,
    });
    
    return res.status(200).json({
      success: true,
      message: 'Warehouse updated successfully',
      data: warehouse,
    });
  } catch (error) {
    console.error(`Error updating warehouse with ID ${id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating warehouse',
      error,
    });
  }
};

// Delete warehouse (soft delete by setting isActive to false)
export const deleteWarehouse = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const warehouse = await Warehouse.findByPk(id);
    
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: `Warehouse with ID ${id} not found`,
      });
    }
    
    await warehouse.update({ isActive: false });
    
    return res.status(200).json({
      success: true,
      message: 'Warehouse deleted successfully',
    });
  } catch (error) {
    console.error(`Error deleting warehouse with ID ${id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting warehouse',
      error,
    });
  }
}; 