import request from 'supertest';
import express from 'express';
import { sequelize } from '../../../config/database';
import { Warehouse, Inventory } from '../../../models';
import routes from '../../../routes';

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockReturnValue({ id: 1, role: 'admin' })
}));

// Mock models
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

describe('Warehouse Controller Integration Tests', () => {
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

  describe('GET /api/warehouses', () => {
    it('should return all warehouses', async () => {
      const mockWarehouses = [
        { id: 1, name: 'Main Warehouse', location: 'New York', capacity: 1000, manager: 'John Doe' },
        { id: 2, name: 'Secondary Warehouse', location: 'Los Angeles', capacity: 500, manager: 'Jane Smith' }
      ];
      
      models.Warehouse.findAll.mockResolvedValue(mockWarehouses);
      
      const response = await request(app)
        .get('/api/warehouses')
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockWarehouses);
      expect(models.Warehouse.findAll).toHaveBeenCalled();
    });

    it('should handle errors when retrieving warehouses', async () => {
      models.Warehouse.findAll.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .get('/api/warehouses')
        .set('Authorization', token);
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/warehouses/:id', () => {
    it('should return a specific warehouse', async () => {
      const mockWarehouse = {
        id: 1,
        name: 'Main Warehouse',
        location: 'New York',
        capacity: 1000,
        manager: 'John Doe'
      };
      
      models.Warehouse.findByPk.mockResolvedValue(mockWarehouse);
      
      const response = await request(app)
        .get('/api/warehouses/1')
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockWarehouse);
      expect(models.Warehouse.findByPk).toHaveBeenCalledWith('1');
    });

    it('should return 404 if warehouse not found', async () => {
      models.Warehouse.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .get('/api/warehouses/999')
        .set('Authorization', token);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Warehouse not found');
    });
  });

  describe('POST /api/warehouses', () => {
    it('should create a new warehouse', async () => {
      const warehouseData = {
        name: 'New Warehouse',
        location: 'Chicago',
        capacity: 800,
        manager: 'Mike Johnson'
      };
      
      const createdWarehouse = { id: 3, ...warehouseData };
      models.Warehouse.create.mockResolvedValue(createdWarehouse);
      
      const response = await request(app)
        .post('/api/warehouses')
        .set('Authorization', token)
        .send(warehouseData);
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdWarehouse);
      expect(models.Warehouse.create).toHaveBeenCalledWith(warehouseData);
    });

    it('should return 400 for invalid input', async () => {
      const invalidData = {
        name: 'Invalid Warehouse'
        // Missing required fields
      };
      
      models.Warehouse.create.mockRejectedValue({
        name: 'SequelizeValidationError',
        errors: [{ message: 'Location is required' }]
      });
      
      const response = await request(app)
        .post('/api/warehouses')
        .set('Authorization', token)
        .send(invalidData);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('PUT /api/warehouses/:id', () => {
    it('should update a warehouse', async () => {
      const updateData = {
        name: 'Updated Warehouse',
        manager: 'New Manager'
      };
      
      const mockWarehouse = {
        id: 1,
        name: 'Main Warehouse',
        location: 'New York',
        capacity: 1000,
        manager: 'John Doe',
        update: jest.fn().mockResolvedValue({
          id: 1,
          name: 'Updated Warehouse',
          location: 'New York',
          capacity: 1000,
          manager: 'New Manager'
        })
      };
      
      models.Warehouse.findByPk.mockResolvedValue(mockWarehouse);
      
      const response = await request(app)
        .put('/api/warehouses/1')
        .set('Authorization', token)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(mockWarehouse.update).toHaveBeenCalledWith(updateData);
    });

    it('should return 404 if warehouse not found', async () => {
      models.Warehouse.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .put('/api/warehouses/999')
        .set('Authorization', token)
        .send({ name: 'Updated Warehouse' });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Warehouse not found');
    });
  });

  describe('DELETE /api/warehouses/:id', () => {
    it('should delete a warehouse', async () => {
      const mockWarehouse = {
        id: 1,
        name: 'Main Warehouse',
        destroy: jest.fn().mockResolvedValue(true)
      };
      
      models.Warehouse.findByPk.mockResolvedValue(mockWarehouse);
      
      const response = await request(app)
        .delete('/api/warehouses/1')
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
      expect(mockWarehouse.destroy).toHaveBeenCalled();
      expect(response.body).toHaveProperty('message', 'Warehouse deleted successfully');
    });

    it('should return 404 if warehouse not found', async () => {
      models.Warehouse.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .delete('/api/warehouses/999')
        .set('Authorization', token);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Warehouse not found');
    });
  });

  describe('GET /api/warehouses/:id/inventory', () => {
    it('should return inventory for a specific warehouse', async () => {
      const mockWarehouse = {
        id: 1,
        name: 'Main Warehouse'
      };
      
      const mockInventory = [
        { id: 1, warehouseId: 1, productId: 101, quantity: 50, location: 'A1' },
        { id: 2, warehouseId: 1, productId: 102, quantity: 25, location: 'A2' }
      ];
      
      models.Warehouse.findByPk.mockResolvedValue(mockWarehouse);
      models.Inventory.findAll.mockResolvedValue(mockInventory);
      
      const response = await request(app)
        .get('/api/warehouses/1/inventory')
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockInventory);
      expect(models.Inventory.findAll).toHaveBeenCalledWith({
        where: { warehouseId: 1 },
        include: expect.anything()
      });
    });

    it('should return 404 if warehouse not found', async () => {
      models.Warehouse.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .get('/api/warehouses/999/inventory')
        .set('Authorization', token);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Warehouse not found');
    });
  });

  describe('Authorization', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/warehouses');
      
      expect(response.status).toBe(401);
    });

    it('should restrict access for non-admin roles on certain endpoints', async () => {
      // Mock JWT to return warehouse-staff role (non-admin)
      require('jsonwebtoken').verify.mockReturnValueOnce({ id: 2, role: 'warehouse-staff' });
      
      const warehouseData = {
        name: 'Non-admin Warehouse',
        location: 'Restricted',
        capacity: 100,
        manager: 'Restricted Access'
      };
      
      const response = await request(app)
        .post('/api/warehouses')
        .set('Authorization', token)
        .send(warehouseData);
      
      // Assuming only admins can create warehouses
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    it('should allow non-admin roles for reading warehouse data', async () => {
      // Mock JWT to return warehouse-staff role (non-admin)
      require('jsonwebtoken').verify.mockReturnValueOnce({ id: 2, role: 'warehouse-staff' });
      
      const mockWarehouses = [
        { id: 1, name: 'Main Warehouse', location: 'New York', capacity: 1000 }
      ];
      
      models.Warehouse.findAll.mockResolvedValue(mockWarehouses);
      
      const response = await request(app)
        .get('/api/warehouses')
        .set('Authorization', token);
      
      // Assuming warehouse-staff can view warehouses
      expect(response.status).toBe(200);
    });
  });
}); 