import request from 'supertest';
import express from 'express';
import { Op } from 'sequelize';
import { sequelize } from '../../../config/database';
import routes from '../../../routes';

// Mock models
jest.mock('../../../models', () => ({
  StockTransfer: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    count: jest.fn().mockResolvedValue(0)
  },
  TransferItem: {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  Product: {
    findByPk: jest.fn()
  },
  Warehouse: {
    findByPk: jest.fn()
  },
  User: {
    findByPk: jest.fn()
  }
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockReturnValue({ id: 1, role: 'admin' })
}));

describe('StockTransfer Controller Integration Tests', () => {
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

  describe('GET /api/stock-transfers', () => {
    it('should return all stock transfers', async () => {
      const mockTransfers = [
        {
          id: 1,
          sourceWarehouseId: 1,
          destinationWarehouseId: 2,
          referenceNumber: 'TRF-2301-0001',
          status: 'PENDING',
          sourceWarehouse: { id: 1, name: 'Warehouse A' },
          destinationWarehouse: { id: 2, name: 'Warehouse B' }
        }
      ];
      
      models.StockTransfer.findAll.mockResolvedValue(mockTransfers);
      
      const response = await request(app)
        .get('/api/stock-transfers')
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTransfers);
      expect(models.StockTransfer.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /api/stock-transfers/:id', () => {
    it('should return a stock transfer by id', async () => {
      const mockTransfer = {
        id: 1,
        sourceWarehouseId: 1,
        destinationWarehouseId: 2,
        referenceNumber: 'TRF-2301-0001',
        status: 'PENDING',
        sourceWarehouse: { id: 1, name: 'Warehouse A' },
        destinationWarehouse: { id: 2, name: 'Warehouse B' },
        items: [
          {
            id: 1,
            transferId: 1,
            productId: 1,
            quantity: 5,
            status: 'pending',
            product: { id: 1, name: 'Product A' }
          }
        ]
      };
      
      models.StockTransfer.findByPk.mockResolvedValue(mockTransfer);
      
      const response = await request(app)
        .get('/api/stock-transfers/1')
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTransfer);
      expect(models.StockTransfer.findByPk).toHaveBeenCalledWith('1', expect.any(Object));
    });

    it('should return 404 if transfer not found', async () => {
      models.StockTransfer.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .get('/api/stock-transfers/999')
        .set('Authorization', token);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Transfer not found');
    });
  });

  describe('POST /api/stock-transfers', () => {
    it('should create a new stock transfer', async () => {
      const newTransferData = {
        sourceWarehouseId: 1,
        destinationWarehouseId: 2,
        initiatedById: 1,
        items: [
          {
            productId: 1,
            quantity: 5,
            unitCost: 100
          }
        ]
      };
      
      const createdTransfer = {
        id: 1,
        ...newTransferData,
        referenceNumber: 'TRF-2301-0001',
        status: 'PENDING',
        initiatedDate: new Date()
      };
      
      const createdItems = [
        {
          id: 1,
          transferId: 1,
          productId: 1,
          quantity: 5,
          unitCost: 100,
          status: 'pending'
        }
      ];
      
      models.StockTransfer.create.mockResolvedValue(createdTransfer);
      models.TransferItem.create.mockResolvedValue(createdItems[0]);
      
      const response = await request(app)
        .post('/api/stock-transfers')
        .set('Authorization', token)
        .send(newTransferData);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Transfer created successfully');
      expect(response.body).toHaveProperty('transfer');
      expect(response.body).toHaveProperty('items');
      expect(models.StockTransfer.create).toHaveBeenCalled();
      expect(models.TransferItem.create).toHaveBeenCalled();
    });

    it('should return 400 if source and destination warehouses are the same', async () => {
      const invalidTransferData = {
        sourceWarehouseId: 1,
        destinationWarehouseId: 1,
        initiatedById: 1,
        items: [
          {
            productId: 1,
            quantity: 5,
            unitCost: 100
          }
        ]
      };
      
      const response = await request(app)
        .post('/api/stock-transfers')
        .set('Authorization', token)
        .send(invalidTransferData);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Source and destination warehouses cannot be the same');
    });
  });

  describe('PUT /api/stock-transfers/:id/status', () => {
    it('should update transfer status', async () => {
      const mockTransfer = {
        id: 1,
        status: 'PENDING',
        update: jest.fn().mockResolvedValue({ id: 1, status: 'IN_TRANSIT' })
      };
      
      const mockItems = [
        { id: 1, transferId: 1, status: 'pending', update: jest.fn() }
      ];
      
      models.StockTransfer.findByPk.mockResolvedValue(mockTransfer);
      models.TransferItem.findAll.mockResolvedValue(mockItems);
      models.TransferItem.update = jest.fn().mockResolvedValue([1]);
      
      const response = await request(app)
        .put('/api/stock-transfers/1/status')
        .set('Authorization', token)
        .send({ status: 'IN_TRANSIT' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Transfer status updated to IN_TRANSIT');
      expect(mockTransfer.update).toHaveBeenCalled();
      expect(models.TransferItem.update).toHaveBeenCalled();
    });

    it('should return 404 if transfer not found', async () => {
      models.StockTransfer.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .put('/api/stock-transfers/999/status')
        .set('Authorization', token)
        .send({ status: 'IN_TRANSIT' });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Transfer not found');
    });
  });

  describe('PUT /api/stock-transfers/:transferId/items/:itemId', () => {
    it('should update a transfer item', async () => {
      const mockItem = {
        id: 1,
        transferId: 1,
        productId: 1,
        quantity: 5,
        receivedQuantity: null,
        status: 'pending',
        update: jest.fn().mockReturnThis()
      };
      
      models.TransferItem.findOne.mockResolvedValue(mockItem);
      
      const response = await request(app)
        .put('/api/stock-transfers/1/items/1')
        .set('Authorization', token)
        .send({ receivedQuantity: 3 });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Transfer item updated successfully');
      expect(mockItem.update).toHaveBeenCalled();
    });

    it('should return 404 if item not found', async () => {
      models.TransferItem.findOne.mockResolvedValue(null);
      
      const response = await request(app)
        .put('/api/stock-transfers/1/items/999')
        .set('Authorization', token)
        .send({ receivedQuantity: 3 });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Transfer item not found');
    });
  });

  describe('DELETE /api/stock-transfers/:id', () => {
    it('should delete a pending transfer', async () => {
      const mockTransfer = {
        id: 1,
        status: 'PENDING',
        destroy: jest.fn().mockResolvedValue(true)
      };
      
      models.StockTransfer.findByPk.mockResolvedValue(mockTransfer);
      models.TransferItem.destroy = jest.fn().mockResolvedValue(true);
      
      const response = await request(app)
        .delete('/api/stock-transfers/1')
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Transfer deleted successfully');
      expect(mockTransfer.destroy).toHaveBeenCalled();
      expect(models.TransferItem.destroy).toHaveBeenCalledWith({ where: { transferId: 1 } });
    });

    it('should return 400 if trying to delete a non-pending transfer', async () => {
      const mockTransfer = {
        id: 1,
        status: 'IN_TRANSIT'
      };
      
      models.StockTransfer.findByPk.mockResolvedValue(mockTransfer);
      
      const response = await request(app)
        .delete('/api/stock-transfers/1')
        .set('Authorization', token);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Only transfers with PENDING status can be deleted');
    });
  });
}); 