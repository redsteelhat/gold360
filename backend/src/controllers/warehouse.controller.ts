import { Request, Response } from 'express';
import { Warehouse, Inventory, Product } from '../models';
import { Op } from 'sequelize';

/**
 * @swagger
 * tags:
 *   name: Warehouses
 *   description: Warehouse management operations
 */

/**
 * @swagger
 * /warehouses:
 *   get:
 *     summary: Get all warehouses
 *     tags: [Warehouses]
 *     description: Retrieve a list of all warehouses
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of warehouses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Warehouse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getAllWarehouses = async (req: Request, res: Response) => {
  try {
    const warehouses = await Warehouse.findAll();
    return res.status(200).json(warehouses);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

/**
 * @swagger
 * /warehouses/{id}:
 *   get:
 *     summary: Get a warehouse by ID
 *     tags: [Warehouses]
 *     description: Retrieve detailed information about a warehouse
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The warehouse ID
 *     responses:
 *       200:
 *         description: Detailed warehouse information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Warehouse'
 *       404:
 *         description: Warehouse not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getWarehouseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const warehouse = await Warehouse.findByPk(id);
    
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }
    
    return res.status(200).json(warehouse);
  } catch (error) {
    console.error(`Error fetching warehouse with ID ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

/**
 * @swagger
 * /warehouses:
 *   post:
 *     summary: Create a new warehouse
 *     tags: [Warehouses]
 *     description: Create a new warehouse location
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Warehouse name
 *               location:
 *                 type: string
 *                 description: Warehouse location/city
 *               address:
 *                 type: string
 *                 description: Full address
 *               capacity:
 *                 type: integer
 *                 description: Storage capacity
 *               contactPerson:
 *                 type: string
 *                 description: Contact person name
 *               contactPhone:
 *                 type: string
 *                 description: Contact phone
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *             required:
 *               - name
 *               - location
 *               - address
 *     responses:
 *       201:
 *         description: Warehouse created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Warehouse created successfully
 *                 warehouse:
 *                   $ref: '#/components/schemas/Warehouse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const createWarehouse = async (req: Request, res: Response) => {
  try {
    const { name, location, address, capacity, isActive, contactPerson, contactPhone, notes } = req.body;
    
    const newWarehouse = await Warehouse.create({
      name,
      location,
      address,
      capacity: capacity || 0,
      isActive: isActive !== undefined ? isActive : true,
      contactPerson,
      contactPhone,
      notes
    });
    
    return res.status(201).json(newWarehouse);
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

/**
 * @swagger
 * /warehouses/{id}:
 *   put:
 *     summary: Update a warehouse
 *     tags: [Warehouses]
 *     description: Update warehouse information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The warehouse ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Warehouse name
 *               location:
 *                 type: string
 *                 description: Warehouse location/city
 *               address:
 *                 type: string
 *                 description: Full address
 *               capacity:
 *                 type: integer
 *                 description: Storage capacity
 *               isActive:
 *                 type: boolean
 *                 description: Is warehouse active
 *               contactPerson:
 *                 type: string
 *                 description: Contact person name
 *               contactPhone:
 *                 type: string
 *                 description: Contact phone
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *     responses:
 *       200:
 *         description: Warehouse updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Warehouse updated successfully
 *                 warehouse:
 *                   $ref: '#/components/schemas/Warehouse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Warehouse not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const updateWarehouse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, location, address, capacity, isActive, contactPerson, contactPhone, notes } = req.body;
    
    const warehouse = await Warehouse.findByPk(id);
    
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }
    
    await warehouse.update({
      name,
      location,
      address,
      capacity,
      isActive,
      contactPerson,
      contactPhone,
      notes
    });
    
    return res.status(200).json(warehouse);
  } catch (error) {
    console.error(`Error updating warehouse with ID ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

/**
 * @swagger
 * /warehouses/{id}:
 *   delete:
 *     summary: Delete a warehouse
 *     tags: [Warehouses]
 *     description: Delete a warehouse (soft deletion by setting isActive to false)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The warehouse ID
 *     responses:
 *       200:
 *         description: Warehouse deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Warehouse deleted successfully
 *       404:
 *         description: Warehouse not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const deleteWarehouse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const warehouse = await Warehouse.findByPk(id);
    
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }
    
    // Depoda stok var mı kontrol et
    const inventory = await Inventory.findOne({ where: { warehouseId: id } });
    
    if (inventory) {
      return res.status(400).json({ message: 'Cannot delete warehouse with existing inventory' });
    }
    
    await warehouse.destroy();
    
    return res.status(200).json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    console.error(`Error deleting warehouse with ID ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

/**
 * @swagger
 * /warehouses/{id}/inventory:
 *   get:
 *     summary: Get warehouse inventory
 *     tags: [Warehouses]
 *     description: Retrieve all inventory items in a warehouse
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The warehouse ID
 *     responses:
 *       200:
 *         description: Inventory list for the warehouse
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       404:
 *         description: Warehouse not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getWarehouseInventory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const warehouse = await Warehouse.findByPk(id);
    
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }
    
    const inventory = await Inventory.findAll({
      where: { warehouseId: id },
      include: [{ model: Product, as: 'product' }]
    });
    
    return res.status(200).json(inventory);
  } catch (error) {
    console.error(`Error fetching inventory for warehouse ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

/**
 * @swagger
 * /warehouses/{id}/low-stock:
 *   get:
 *     summary: Get low stock items
 *     tags: [Warehouses]
 *     description: Retrieve inventory items that are below their alert threshold
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The warehouse ID
 *     responses:
 *       200:
 *         description: Low stock items list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       404:
 *         description: Warehouse not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getLowStockItems = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 10;
    
    const warehouse = await Warehouse.findByPk(id);
    
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }
    
    const lowStockItems = await Inventory.findAll({
      where: { 
        warehouseId: id,
        quantity: { [Op.lt]: threshold }
      },
      include: [{ model: Product, as: 'product' }]
    });
    
    return res.status(200).json(lowStockItems);
  } catch (error) {
    console.error(`Error fetching low stock items for warehouse ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Server error', error });
  }
}; 