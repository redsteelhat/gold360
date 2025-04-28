import request from 'supertest';
import express from 'express';
import { sequelize } from '../../../config/database';
import { Customer, LoyaltyProgram, LoyaltyTransaction } from '../../../models';
import routes from '../../../routes';

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockReturnValue({ id: 1, role: 'admin' })
}));

// Mock models
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

describe('Loyalty Controller Integration Tests', () => {
  let app: express.Application;
  let token: string;
  const models = require('../../../models');

  beforeAll(() => {
    // Setup express app
    app = express();
    app.use(express.json());
    app.use('/api', routes);
    
    // Generate mock token
    token = 'Bearer mock-token';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/loyalty/programs', () => {
    it('should return all loyalty programs', async () => {
      const mockPrograms = [
        { id: 1, name: 'Gold Tier', pointsRequired: 5000, discount: 10, description: 'Gold tier benefits' },
        { id: 2, name: 'Platinum Tier', pointsRequired: 10000, discount: 15, description: 'Platinum tier benefits' }
      ];
      
      models.LoyaltyProgram.findAll.mockResolvedValue(mockPrograms);
      
      const response = await request(app)
        .get('/api/loyalty/programs')
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPrograms);
      expect(models.LoyaltyProgram.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /api/loyalty/programs/:id', () => {
    it('should return a specific loyalty program', async () => {
      const mockProgram = {
        id: 1,
        name: 'Gold Tier',
        pointsRequired: 5000,
        discount: 10,
        description: 'Gold tier benefits'
      };
      
      models.LoyaltyProgram.findByPk.mockResolvedValue(mockProgram);
      
      const response = await request(app)
        .get('/api/loyalty/programs/1')
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProgram);
      expect(models.LoyaltyProgram.findByPk).toHaveBeenCalledWith('1');
    });

    it('should return 404 if program not found', async () => {
      models.LoyaltyProgram.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .get('/api/loyalty/programs/999')
        .set('Authorization', token);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Loyalty program not found');
    });
  });

  describe('POST /api/loyalty/programs', () => {
    it('should create a new loyalty program', async () => {
      const programData = {
        name: 'Diamond Tier',
        pointsRequired: 20000,
        discount: 20,
        description: 'Diamond tier benefits'
      };
      
      const createdProgram = { id: 3, ...programData };
      models.LoyaltyProgram.create.mockResolvedValue(createdProgram);
      
      const response = await request(app)
        .post('/api/loyalty/programs')
        .set('Authorization', token)
        .send(programData);
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdProgram);
      expect(models.LoyaltyProgram.create).toHaveBeenCalledWith(programData);
    });

    it('should return 400 for invalid input', async () => {
      const invalidData = {
        name: 'Invalid Program'
        // Missing required fields
      };
      
      models.LoyaltyProgram.create.mockRejectedValue({
        name: 'SequelizeValidationError',
        errors: [{ message: 'Points required is required' }]
      });
      
      const response = await request(app)
        .post('/api/loyalty/programs')
        .set('Authorization', token)
        .send(invalidData);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('PUT /api/loyalty/programs/:id', () => {
    it('should update a loyalty program', async () => {
      const updateData = {
        name: 'Updated Gold Tier',
        discount: 12
      };
      
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
      
      models.LoyaltyProgram.findByPk.mockResolvedValue(mockProgram);
      
      const response = await request(app)
        .put('/api/loyalty/programs/1')
        .set('Authorization', token)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(mockProgram.update).toHaveBeenCalledWith(updateData);
    });

    it('should return 404 if program not found', async () => {
      models.LoyaltyProgram.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .put('/api/loyalty/programs/999')
        .set('Authorization', token)
        .send({ name: 'Updated Program' });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Loyalty program not found');
    });
  });

  describe('GET /api/loyalty/customers/:customerId', () => {
    it('should return customer loyalty information', async () => {
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
      
      models.Customer.findByPk.mockResolvedValue(mockCustomer);
      models.LoyaltyTransaction.findAll.mockResolvedValue(mockTransactions);
      
      const response = await request(app)
        .get('/api/loyalty/customers/1')
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('customer', mockCustomer);
      expect(response.body).toHaveProperty('transactions', mockTransactions);
    });

    it('should return 404 if customer not found', async () => {
      models.Customer.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .get('/api/loyalty/customers/999')
        .set('Authorization', token);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Customer not found');
    });
  });

  describe('POST /api/loyalty/customers/:customerId/points/add', () => {
    it('should add loyalty points to a customer', async () => {
      const pointsData = {
        points: 500,
        description: 'Bonus points'
      };
      
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
      
      models.Customer.findByPk.mockResolvedValue(mockCustomer);
      models.LoyaltyTransaction.create.mockResolvedValue(mockTransaction);
      
      const response = await request(app)
        .post('/api/loyalty/customers/1/points/add')
        .set('Authorization', token)
        .send(pointsData);
      
      expect(response.status).toBe(200);
      expect(mockCustomer.update).toHaveBeenCalledWith({ loyaltyPoints: 5500 });
      expect(response.body).toHaveProperty('message', 'Loyalty points added successfully');
      expect(response.body).toHaveProperty('transaction', mockTransaction);
    });

    it('should return 400 if points is invalid', async () => {
      const invalidPointsData = {
        points: -100, // Invalid negative value
        description: 'Invalid points'
      };
      
      const mockCustomer = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        loyaltyPoints: 5000
      };
      
      models.Customer.findByPk.mockResolvedValue(mockCustomer);
      
      const response = await request(app)
        .post('/api/loyalty/customers/1/points/add')
        .set('Authorization', token)
        .send(invalidPointsData);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Points must be a positive number');
    });
  });

  describe('POST /api/loyalty/customers/:customerId/points/redeem', () => {
    it('should redeem loyalty points from a customer', async () => {
      const pointsData = {
        points: 300,
        description: 'Discount applied'
      };
      
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
      
      models.Customer.findByPk.mockResolvedValue(mockCustomer);
      models.LoyaltyTransaction.create.mockResolvedValue(mockTransaction);
      
      const response = await request(app)
        .post('/api/loyalty/customers/1/points/redeem')
        .set('Authorization', token)
        .send(pointsData);
      
      expect(response.status).toBe(200);
      expect(mockCustomer.update).toHaveBeenCalledWith({ loyaltyPoints: 4700 });
      expect(response.body).toHaveProperty('message', 'Loyalty points redeemed successfully');
      expect(response.body).toHaveProperty('transaction', mockTransaction);
    });

    it('should return 400 if customer does not have enough points', async () => {
      const pointsData = {
        points: 6000, // More than available
        description: 'Too many points'
      };
      
      const mockCustomer = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        loyaltyPoints: 5000
      };
      
      models.Customer.findByPk.mockResolvedValue(mockCustomer);
      
      const response = await request(app)
        .post('/api/loyalty/customers/1/points/redeem')
        .set('Authorization', token)
        .send(pointsData);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Customer does not have enough loyalty points');
    });
  });

  describe('Authorization', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/loyalty/programs');
      
      expect(response.status).toBe(401);
    });

    it('should allow non-admin roles for specific endpoints', async () => {
      // Mock JWT to return customer-service role
      require('jsonwebtoken').verify.mockReturnValueOnce({ id: 2, role: 'customer-service' });
      
      const mockCustomer = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        loyaltyPoints: 5000
      };
      
      models.Customer.findByPk.mockResolvedValue(mockCustomer);
      
      const response = await request(app)
        .get('/api/loyalty/customers/1')
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
    });
  });
}); 