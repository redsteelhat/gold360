import { Request, Response } from 'express';
import * as warehouseController from '../../../controllers/warehouse.controller';
import { Warehouse, Inventory } from '../../../models';

// Mock dependencies
jest.mock('../../../models', () => ({
  Warehouse: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  Inventory: {
    findAll: jest.fn()
  }
}));

describe('Warehouse Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject = {};

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock request and response
    mockRequest = {};
    responseObject = {};
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation(result => {
        responseObject = result;
        return mockResponse;
      })
    };
  });

  describe('getAllWarehouses', () => {
    it('should return all warehouses', async () => {
      const mockWarehouses = [
        { id: 1, name: 'Main Warehouse', location: 'Istanbul' },
        { id: 2, name: 'Secondary Warehouse', location: 'Ankara' }
      ];
      
      (Warehouse.findAll as jest.Mock).mockResolvedValue(mockWarehouses);
      
      await warehouseController.getAllWarehouses(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toEqual(mockWarehouses);
    });

    it('should handle errors and return 500', async () => {
      (Warehouse.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      await warehouseController.getAllWarehouses(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject).toHaveProperty('error');
    });
  });

  describe('getWarehouseById', () => {
    it('should return a warehouse by ID', async () => {
      const mockWarehouse = { id: 1, name: 'Main Warehouse', location: 'Istanbul' };
      mockRequest.params = { id: '1' };
      
      (Warehouse.findByPk as jest.Mock).mockResolvedValue(mockWarehouse);
      
      await warehouseController.getWarehouseById(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toEqual(mockWarehouse);
    });

    it('should return 404 if warehouse not found', async () => {
      mockRequest.params = { id: '999' };
      
      (Warehouse.findByPk as jest.Mock).mockResolvedValue(null);
      
      await warehouseController.getWarehouseById(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toHaveProperty('message', 'Warehouse not found');
    });
  });

  describe('createWarehouse', () => {
    it('should create a new warehouse', async () => {
      const warehouseData = {
        name: 'New Warehouse',
        location: 'Izmir',
        address: 'Sample Address',
        contactPerson: 'John Doe',
        contactPhone: '555-1234'
      };
      
      mockRequest.body = warehouseData;
      
      const createdWarehouse = { id: 3, ...warehouseData };
      (Warehouse.create as jest.Mock).mockResolvedValue(createdWarehouse);
      
      await warehouseController.createWarehouse(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject).toEqual(createdWarehouse);
    });

    it('should handle validation errors', async () => {
      mockRequest.body = { location: 'Invalid Warehouse' }; // Missing required fields
      
      (Warehouse.create as jest.Mock).mockRejectedValue({
        name: 'SequelizeValidationError',
        errors: [{ message: 'Warehouse name is required' }]
      });
      
      await warehouseController.createWarehouse(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toHaveProperty('message');
      expect(responseObject).toHaveProperty('errors');
    });
  });

  describe('updateWarehouse', () => {
    it('should update an existing warehouse', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'Updated Warehouse', location: 'Antalya' };
      
      const mockWarehouse = {
        id: 1,
        name: 'Main Warehouse',
        location: 'Istanbul',
        update: jest.fn().mockResolvedValue({
          id: 1,
          name: 'Updated Warehouse',
          location: 'Antalya'
        })
      };
      
      (Warehouse.findByPk as jest.Mock).mockResolvedValue(mockWarehouse);
      
      await warehouseController.updateWarehouse(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockWarehouse.update).toHaveBeenCalledWith(mockRequest.body);
    });

    it('should return 404 if warehouse not found', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { name: 'Updated Warehouse' };
      
      (Warehouse.findByPk as jest.Mock).mockResolvedValue(null);
      
      await warehouseController.updateWarehouse(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toHaveProperty('message', 'Warehouse not found');
    });
  });

  describe('deleteWarehouse', () => {
    it('should delete a warehouse', async () => {
      mockRequest.params = { id: '1' };
      
      const mockWarehouse = {
        id: 1,
        name: 'Main Warehouse',
        destroy: jest.fn().mockResolvedValue(undefined)
      };
      
      (Warehouse.findByPk as jest.Mock).mockResolvedValue(mockWarehouse);
      
      await warehouseController.deleteWarehouse(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockWarehouse.destroy).toHaveBeenCalled();
      expect(responseObject).toHaveProperty('message', 'Warehouse deleted successfully');
    });

    it('should return 404 if warehouse not found', async () => {
      mockRequest.params = { id: '999' };
      
      (Warehouse.findByPk as jest.Mock).mockResolvedValue(null);
      
      await warehouseController.deleteWarehouse(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toHaveProperty('message', 'Warehouse not found');
    });
  });

  describe('getWarehouseInventory', () => {
    it('should return inventory for a specific warehouse', async () => {
      mockRequest.params = { id: '1' };
      
      const mockInventory = [
        { productId: 1, warehouseId: 1, quantity: 50, product: { name: 'Gold Ring' } },
        { productId: 2, warehouseId: 1, quantity: 30, product: { name: 'Gold Necklace' } }
      ];
      
      (Warehouse.findByPk as jest.Mock).mockResolvedValue({ id: 1, name: 'Main Warehouse' });
      (Inventory.findAll as jest.Mock).mockResolvedValue(mockInventory);
      
      await warehouseController.getWarehouseInventory(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toEqual(mockInventory);
    });

    it('should return 404 if warehouse not found', async () => {
      mockRequest.params = { id: '999' };
      
      (Warehouse.findByPk as jest.Mock).mockResolvedValue(null);
      
      await warehouseController.getWarehouseInventory(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toHaveProperty('message', 'Warehouse not found');
    });
  });
}); 