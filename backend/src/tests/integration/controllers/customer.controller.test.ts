import request from 'supertest';
import express from 'express';
import { sequelize } from '../../../config/database';
import { Customer, User } from '../../../models';
import routes from '../../../routes';
import jwt from 'jsonwebtoken';

// Mock dependencies and models
jest.mock('../../../models', () => ({
  Customer: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  User: {
    findByPk: jest.fn()
  },
  Order: {
    findAll: jest.fn()
  }
}));

jest.mock('../../../services/notification.service', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'test-id' }),
  sendSMS: jest.fn().mockResolvedValue({ success: true, messageId: 'test-id' }),
  sendWhatsAppMessage: jest.fn().mockResolvedValue({ success: true, messageId: 'test-id' }),
  sendBulkNotifications: jest.fn().mockResolvedValue([{ success: true, messageId: 'test-id' }])
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockReturnValue({ id: 1, email: 'test@example.com', role: 'admin' }),
  sign: jest.fn().mockReturnValue('mock-token')
}));

describe('Customer Controller Integration Tests', () => {
  let app: express.Application;
  let token: string;

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

  describe('GET /api/customers', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app).get('/api/customers');
      expect(response.status).toBe(401);
    });

    it('should return all customers', async () => {
      const mockCustomers = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          segment: 'vip',
          isActive: true
        }
      ];
      
      (Customer.findAll as jest.Mock).mockResolvedValue(mockCustomers);
      
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCustomers);
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should return customer by id', async () => {
      const mockCustomer = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        segment: 'vip',
        isActive: true
      };
      
      (Customer.findByPk as jest.Mock).mockResolvedValue(mockCustomer);
      
      const response = await request(app)
        .get('/api/customers/1')
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCustomer);
    });

    it('should return 404 if customer not found', async () => {
      (Customer.findByPk as jest.Mock).mockResolvedValue(null);
      
      const response = await request(app)
        .get('/api/customers/999')
        .set('Authorization', token);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Customer not found');
    });
  });

  describe('POST /api/customers', () => {
    it('should create a new customer', async () => {
      const newCustomer = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '5551234567',
        userId: 2
      };
      
      const createdCustomer = {
        id: 2,
        ...newCustomer,
        segment: 'new',
        loyaltyPoints: 0,
        totalSpent: 0,
        isActive: true
      };
      
      (Customer.findOne as jest.Mock).mockResolvedValue(null); // No existing customer
      (Customer.create as jest.Mock).mockResolvedValue(createdCustomer);
      
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', token)
        .send(newCustomer);
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdCustomer);
    });

    it('should return 400 if required fields are missing', async () => {
      const invalidCustomer = {
        lastName: 'Smith',
        phone: '5551234567'
        // Missing firstName and email
      };
      
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', token)
        .send(invalidCustomer);
      
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/customers/:id', () => {
    it('should update an existing customer', async () => {
      const customerId = 1;
      const updateData = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '5559876543',
        segment: 'vip'
      };
      
      const existingCustomer = {
        id: customerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '5551234567',
        segment: 'regular',
        isActive: true,
        update: jest.fn().mockImplementation(function(this: any, updates: any) {
          Object.assign(this, updates);
          return this;
        })
      };
      
      (Customer.findByPk as jest.Mock).mockResolvedValue(existingCustomer);
      
      const response = await request(app)
        .put(`/api/customers/${customerId}`)
        .set('Authorization', token)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(existingCustomer.update).toHaveBeenCalled();
      expect(response.body).toHaveProperty('segment', 'vip');
      expect(response.body).toHaveProperty('phone', '5559876543');
    });

    it('should return 404 if customer to update is not found', async () => {
      (Customer.findByPk as jest.Mock).mockResolvedValue(null);
      
      const response = await request(app)
        .put('/api/customers/999')
        .set('Authorization', token)
        .send({ firstName: 'Updated' });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Customer not found');
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('should soft delete a customer', async () => {
      const customerId = 1;
      
      const existingCustomer = {
        id: customerId,
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        update: jest.fn()
      };
      
      (Customer.findByPk as jest.Mock).mockResolvedValue(existingCustomer);
      
      const response = await request(app)
        .delete(`/api/customers/${customerId}`)
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
      expect(existingCustomer.update).toHaveBeenCalledWith({ isActive: false });
      expect(response.body).toHaveProperty('message', 'Customer deleted successfully');
    });

    it('should return 404 if customer to delete is not found', async () => {
      (Customer.findByPk as jest.Mock).mockResolvedValue(null);
      
      const response = await request(app)
        .delete('/api/customers/999')
        .set('Authorization', token);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Customer not found');
    });
  });
}); 