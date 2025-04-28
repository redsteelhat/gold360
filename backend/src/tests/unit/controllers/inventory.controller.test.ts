import { Request, Response } from 'express';
import * as inventoryController from '../../../controllers/inventory.controller';
import { Product, Category, Inventory } from '../../../models';

// Mock dependencies
jest.mock('../../../models', () => ({
  Product: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  Category: {
    findAll: jest.fn()
  },
  Inventory: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  }
}));

describe('Inventory Controller', () => {
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

  describe('getAllProducts', () => {
    it('should return all products with their categories', async () => {
      const mockProducts = [
        { id: 1, name: 'Gold Ring', categoryId: 1, category: { name: 'Rings' } },
        { id: 2, name: 'Gold Necklace', categoryId: 2, category: { name: 'Necklaces' } }
      ];
      
      (Product.findAll as jest.Mock).mockResolvedValue(mockProducts);
      
      await inventoryController.getAllProducts(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toEqual(mockProducts);
    });

    it('should handle errors and return 500', async () => {
      (Product.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      await inventoryController.getAllProducts(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject).toHaveProperty('message');
      expect(responseObject).toHaveProperty('error');
    });
  });

  describe('getProductById', () => {
    it('should return a product by ID', async () => {
      const mockProduct = { id: 1, name: 'Gold Ring', categoryId: 1, category: { name: 'Rings' } };
      mockRequest.params = { id: '1' };
      
      (Product.findByPk as jest.Mock).mockResolvedValue(mockProduct);
      
      await inventoryController.getProductById(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toEqual(mockProduct);
    });

    it('should return 404 if product not found', async () => {
      mockRequest.params = { id: '999' };
      
      (Product.findByPk as jest.Mock).mockResolvedValue(null);
      
      await inventoryController.getProductById(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toHaveProperty('message', 'Product not found');
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Gold Ring',
        description: 'Beautiful 18k gold ring',
        sku: 'GR-18K-001',
        categoryId: 1,
        weightGrams: 10.5,
        purity: '18K',
        cost: 500,
        price: 1000
      };
      
      mockRequest.body = productData;
      
      const createdProduct = { id: 3, ...productData };
      (Product.create as jest.Mock).mockResolvedValue(createdProduct);
      
      await inventoryController.createProduct(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject).toEqual(createdProduct);
    });

    it('should handle validation errors', async () => {
      mockRequest.body = { name: 'Invalid Product' }; // Missing required fields
      
      (Product.create as jest.Mock).mockRejectedValue({
        name: 'SequelizeValidationError',
        errors: [{ message: 'SKU is required' }]
      });
      
      await inventoryController.createProduct(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toHaveProperty('message');
      expect(responseObject).toHaveProperty('errors');
    });
  });

  describe('updateInventory', () => {
    it('should update inventory quantity', async () => {
      mockRequest.params = { productId: '1' };
      mockRequest.body = { quantity: 50, warehouseId: 1 };
      
      const mockInventory = {
        productId: 1,
        warehouseId: 1,
        quantity: 30,
        update: jest.fn().mockResolvedValue({
          productId: 1,
          warehouseId: 1,
          quantity: 50
        })
      };
      
      (Inventory.findOne as jest.Mock).mockResolvedValue(mockInventory);
      
      await inventoryController.updateInventory(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toHaveProperty('message', 'Inventory updated successfully');
      expect(mockInventory.update).toHaveBeenCalledWith({ quantity: 50 });
    });

    it('should create inventory record if not exists', async () => {
      mockRequest.params = { productId: '1' };
      mockRequest.body = { quantity: 50, warehouseId: 1 };
      
      (Inventory.findOne as jest.Mock).mockResolvedValue(null);
      
      const newInventory = {
        productId: 1,
        warehouseId: 1,
        quantity: 50
      };
      
      (Inventory.create as jest.Mock).mockResolvedValue(newInventory);
      
      await inventoryController.updateInventory(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject).toHaveProperty('message', 'Inventory created successfully');
      expect(Inventory.create).toHaveBeenCalledWith({
        productId: 1,
        warehouseId: 1,
        quantity: 50
      });
    });
  });

  describe('getAllCategories', () => {
    it('should return all product categories', async () => {
      const mockCategories = [
        { id: 1, name: 'Rings', description: 'Finger rings' },
        { id: 2, name: 'Necklaces', description: 'Neck jewelry' }
      ];
      
      (Category.findAll as jest.Mock).mockResolvedValue(mockCategories);
      
      await inventoryController.getAllCategories(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toEqual(mockCategories);
    });

    it('should handle errors and return 500', async () => {
      (Category.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      await inventoryController.getAllCategories(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject).toHaveProperty('message');
      expect(responseObject).toHaveProperty('error');
    });
  });
}); 