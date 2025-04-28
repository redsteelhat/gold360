import { Request, Response } from 'express';
import * as loyaltyController from '../../../controllers/loyalty.controller';
import { Customer, LoyaltyProgram, LoyaltyTransaction } from '../../../models';

// Mock dependencies
jest.mock('../../../models', () => ({
  Customer: {
    findByPk: jest.fn(),
    update: jest.fn()
  },
  LoyaltyProgram: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  LoyaltyTransaction: {
    findAll: jest.fn(),
    create: jest.fn()
  }
}));

describe('Loyalty Controller', () => {
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

  describe('getLoyaltyPrograms', () => {
    it('should return all loyalty programs', async () => {
      const mockPrograms = [
        { id: 1, name: 'Gold Tier', pointsRequired: 5000, discount: 10, description: 'Gold tier benefits' },
        { id: 2, name: 'Platinum Tier', pointsRequired: 10000, discount: 15, description: 'Platinum tier benefits' }
      ];
      
      (LoyaltyProgram.findAll as jest.Mock).mockResolvedValue(mockPrograms);
      
      await loyaltyController.getLoyaltyPrograms(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toEqual(mockPrograms);
    });

    it('should handle errors and return 500', async () => {
      (LoyaltyProgram.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      await loyaltyController.getLoyaltyPrograms(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject).toHaveProperty('error');
    });
  });

  describe('getLoyaltyProgramById', () => {
    it('should return a loyalty program by ID', async () => {
      const mockProgram = { id: 1, name: 'Gold Tier', pointsRequired: 5000, discount: 10 };
      mockRequest.params = { id: '1' };
      
      (LoyaltyProgram.findByPk as jest.Mock).mockResolvedValue(mockProgram);
      
      await loyaltyController.getLoyaltyProgramById(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toEqual(mockProgram);
    });

    it('should return 404 if loyalty program not found', async () => {
      mockRequest.params = { id: '999' };
      
      (LoyaltyProgram.findByPk as jest.Mock).mockResolvedValue(null);
      
      await loyaltyController.getLoyaltyProgramById(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toHaveProperty('message', 'Loyalty program not found');
    });
  });

  describe('createLoyaltyProgram', () => {
    it('should create a new loyalty program', async () => {
      const programData = {
        name: 'Diamond Tier',
        pointsRequired: 20000,
        discount: 20,
        description: 'Diamond tier benefits'
      };
      
      mockRequest.body = programData;
      
      const createdProgram = { id: 3, ...programData };
      (LoyaltyProgram.create as jest.Mock).mockResolvedValue(createdProgram);
      
      await loyaltyController.createLoyaltyProgram(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject).toEqual(createdProgram);
    });

    it('should handle validation errors', async () => {
      mockRequest.body = { name: 'Invalid Program' }; // Missing required fields
      
      (LoyaltyProgram.create as jest.Mock).mockRejectedValue({
        name: 'SequelizeValidationError',
        errors: [{ message: 'Points required is required' }]
      });
      
      await loyaltyController.createLoyaltyProgram(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toHaveProperty('message');
      expect(responseObject).toHaveProperty('errors');
    });
  });

  describe('updateLoyaltyProgram', () => {
    it('should update an existing loyalty program', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'Updated Gold Tier', discount: 12 };
      
      const mockProgram = {
        id: 1,
        name: 'Gold Tier',
        pointsRequired: 5000,
        discount: 10,
        update: jest.fn().mockResolvedValue({
          id: 1,
          name: 'Updated Gold Tier',
          pointsRequired: 5000,
          discount: 12
        })
      };
      
      (LoyaltyProgram.findByPk as jest.Mock).mockResolvedValue(mockProgram);
      
      await loyaltyController.updateLoyaltyProgram(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockProgram.update).toHaveBeenCalledWith(mockRequest.body);
    });

    it('should return 404 if loyalty program not found', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { name: 'Updated Program' };
      
      (LoyaltyProgram.findByPk as jest.Mock).mockResolvedValue(null);
      
      await loyaltyController.updateLoyaltyProgram(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toHaveProperty('message', 'Loyalty program not found');
    });
  });

  describe('getCustomerLoyalty', () => {
    it('should return loyalty details for a customer', async () => {
      mockRequest.params = { customerId: '1' };
      
      const mockCustomer = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        loyaltyPoints: 7500,
        loyaltyTier: 'Gold'
      };
      
      const mockTransactions = [
        { id: 1, customerId: 1, points: 500, type: 'EARN', description: 'Purchase', createdAt: new Date() },
        { id: 2, customerId: 1, points: 200, type: 'REDEEM', description: 'Discount applied', createdAt: new Date() }
      ];
      
      (Customer.findByPk as jest.Mock).mockResolvedValue(mockCustomer);
      (LoyaltyTransaction.findAll as jest.Mock).mockResolvedValue(mockTransactions);
      
      await loyaltyController.getCustomerLoyalty(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toHaveProperty('customer', mockCustomer);
      expect(responseObject).toHaveProperty('transactions', mockTransactions);
    });

    it('should return 404 if customer not found', async () => {
      mockRequest.params = { customerId: '999' };
      
      (Customer.findByPk as jest.Mock).mockResolvedValue(null);
      
      await loyaltyController.getCustomerLoyalty(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toHaveProperty('message', 'Customer not found');
    });
  });

  describe('addLoyaltyPoints', () => {
    it('should add loyalty points to a customer', async () => {
      mockRequest.params = { customerId: '1' };
      mockRequest.body = { points: 500, description: 'Bonus points' };
      
      const mockCustomer = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        loyaltyPoints: 5000,
        update: jest.fn().mockResolvedValue({
          id: 1,
          loyaltyPoints: 5500
        })
      };
      
      const mockTransaction = {
        id: 3,
        customerId: 1,
        points: 500,
        type: 'EARN',
        description: 'Bonus points',
        createdAt: new Date()
      };
      
      (Customer.findByPk as jest.Mock).mockResolvedValue(mockCustomer);
      (LoyaltyTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      
      await loyaltyController.addLoyaltyPoints(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockCustomer.update).toHaveBeenCalledWith({ loyaltyPoints: 5500 });
      expect(responseObject).toHaveProperty('message', 'Loyalty points added successfully');
      expect(responseObject).toHaveProperty('transaction', mockTransaction);
    });

    it('should return 404 if customer not found', async () => {
      mockRequest.params = { customerId: '999' };
      mockRequest.body = { points: 500 };
      
      (Customer.findByPk as jest.Mock).mockResolvedValue(null);
      
      await loyaltyController.addLoyaltyPoints(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toHaveProperty('message', 'Customer not found');
    });

    it('should return 400 if points is invalid', async () => {
      mockRequest.params = { customerId: '1' };
      mockRequest.body = { points: -100 }; // Invalid points
      
      const mockCustomer = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        loyaltyPoints: 5000
      };
      
      (Customer.findByPk as jest.Mock).mockResolvedValue(mockCustomer);
      
      await loyaltyController.addLoyaltyPoints(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toHaveProperty('message', 'Points must be a positive number');
    });
  });

  describe('redeemLoyaltyPoints', () => {
    it('should redeem loyalty points from a customer', async () => {
      mockRequest.params = { customerId: '1' };
      mockRequest.body = { points: 300, description: 'Discount applied' };
      
      const mockCustomer = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        loyaltyPoints: 5000,
        update: jest.fn().mockResolvedValue({
          id: 1,
          loyaltyPoints: 4700
        })
      };
      
      const mockTransaction = {
        id: 4,
        customerId: 1,
        points: 300,
        type: 'REDEEM',
        description: 'Discount applied',
        createdAt: new Date()
      };
      
      (Customer.findByPk as jest.Mock).mockResolvedValue(mockCustomer);
      (LoyaltyTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      
      await loyaltyController.redeemLoyaltyPoints(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockCustomer.update).toHaveBeenCalledWith({ loyaltyPoints: 4700 });
      expect(responseObject).toHaveProperty('message', 'Loyalty points redeemed successfully');
      expect(responseObject).toHaveProperty('transaction', mockTransaction);
    });

    it('should return 404 if customer not found', async () => {
      mockRequest.params = { customerId: '999' };
      mockRequest.body = { points: 300 };
      
      (Customer.findByPk as jest.Mock).mockResolvedValue(null);
      
      await loyaltyController.redeemLoyaltyPoints(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toHaveProperty('message', 'Customer not found');
    });

    it('should return 400 if customer does not have enough points', async () => {
      mockRequest.params = { customerId: '1' };
      mockRequest.body = { points: 6000 }; // More than available
      
      const mockCustomer = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        loyaltyPoints: 5000
      };
      
      (Customer.findByPk as jest.Mock).mockResolvedValue(mockCustomer);
      
      await loyaltyController.redeemLoyaltyPoints(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toHaveProperty('message', 'Customer does not have enough loyalty points');
    });
  });
}); 