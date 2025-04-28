import request from 'supertest';
import express from 'express';
import { sequelize } from '../../../config/database';
import { Order, Product, Customer } from '../../../models';
import routes from '../../../routes';

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockReturnValue({ id: 1, role: 'admin' })
}));

// Mock models
jest.mock('../../../models', () => ({
  Order: {
    findAll: jest.fn(),
    count: jest.fn()
  },
  Product: {
    findAll: jest.fn()
  },
  Customer: {
    findAll: jest.fn(),
    count: jest.fn()
  },
  Sequelize: {
    literal: jest.fn().mockImplementation((str) => str),
    fn: jest.fn().mockImplementation((fn, field) => ({ fn, field })),
    col: jest.fn().mockImplementation((col) => col)
  }
}));

// Mock services
jest.mock('../../../services/analytics.service', () => ({
  getSalesData: jest.fn().mockResolvedValue({
    total: 25000,
    count: 10,
    average: 2500,
    byMonth: [{ month: '2023-01', sales: 10000 }, { month: '2023-02', sales: 15000 }]
  }),
  getProductPerformance: jest.fn().mockResolvedValue([
    { id: 1, name: 'Gold Ring', totalSales: 10000, unitsSold: 5 },
    { id: 2, name: 'Gold Necklace', totalSales: 15000, unitsSold: 3 }
  ]),
  getCustomerInsights: jest.fn().mockResolvedValue({
    totalCustomers: 100,
    newCustomers: 20,
    segments: { vip: 10, regular: 70, new: 20 }
  }),
  getInventoryAnalytics: jest.fn().mockResolvedValue({
    totalItems: 500,
    lowStock: 15,
    valueByCategory: [
      { category: 'Rings', value: 50000 },
      { category: 'Necklaces', value: 75000 }
    ]
  })
}));

describe('Analytics Controller Integration Tests', () => {
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

  describe('GET /api/analytics/dashboard', () => {
    it('should return dashboard analytics data', async () => {
      const expectedResponse = {
        sales: {
          total: 25000,
          count: 10,
          average: 2500,
          byMonth: [
            { month: '2023-01', sales: 10000 },
            { month: '2023-02', sales: 15000 }
          ]
        },
        topProducts: [
          { id: 1, name: 'Gold Ring', totalSales: 10000, unitsSold: 5 },
          { id: 2, name: 'Gold Necklace', totalSales: 15000, unitsSold: 3 }
        ],
        customers: {
          totalCustomers: 100,
          newCustomers: 20,
          segments: { vip: 10, regular: 70, new: 20 }
        },
        inventory: {
          totalItems: 500,
          lowStock: 15,
          valueByCategory: [
            { category: 'Rings', value: 50000 },
            { category: 'Necklaces', value: 75000 }
          ]
        }
      };
      
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expectedResponse);
    });

    it('should handle errors and return 500', async () => {
      const mockAnalyticsService = require('../../../services/analytics.service');
      mockAnalyticsService.getSalesData.mockRejectedValueOnce(new Error('Database error'));
      
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', token);
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/analytics/sales', () => {
    it('should return sales analytics data', async () => {
      const mockSalesData = {
        total: 25000,
        count: 10,
        average: 2500,
        byMonth: [
          { month: '2023-01', sales: 10000 },
          { month: '2023-02', sales: 15000 }
        ]
      };
      
      const mockAnalyticsService = require('../../../services/analytics.service');
      mockAnalyticsService.getSalesData.mockResolvedValueOnce(mockSalesData);
      
      const response = await request(app)
        .get('/api/analytics/sales')
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSalesData);
    });

    it('should accept date range parameters', async () => {
      const mockSalesData = {
        total: 15000,
        count: 5,
        average: 3000,
        byMonth: [{ month: '2023-01', sales: 15000 }]
      };
      
      const mockAnalyticsService = require('../../../services/analytics.service');
      mockAnalyticsService.getSalesData.mockResolvedValueOnce(mockSalesData);
      
      const response = await request(app)
        .get('/api/analytics/sales?startDate=2023-01-01&endDate=2023-01-31')
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSalesData);
      expect(mockAnalyticsService.getSalesData).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2023-01-01',
          endDate: '2023-01-31'
        })
      );
    });
  });

  describe('GET /api/analytics/products', () => {
    it('should return product performance analytics', async () => {
      const mockProductData = [
        { id: 1, name: 'Gold Ring', totalSales: 10000, unitsSold: 5 },
        { id: 2, name: 'Gold Necklace', totalSales: 15000, unitsSold: 3 }
      ];
      
      const mockAnalyticsService = require('../../../services/analytics.service');
      mockAnalyticsService.getProductPerformance.mockResolvedValueOnce(mockProductData);
      
      const response = await request(app)
        .get('/api/analytics/products')
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProductData);
    });

    it('should accept limit parameter', async () => {
      const mockProductData = [
        { id: 1, name: 'Gold Ring', totalSales: 10000, unitsSold: 5 }
      ];
      
      const mockAnalyticsService = require('../../../services/analytics.service');
      mockAnalyticsService.getProductPerformance.mockResolvedValueOnce(mockProductData);
      
      const response = await request(app)
        .get('/api/analytics/products?limit=1')
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProductData);
      expect(mockAnalyticsService.getProductPerformance).toHaveBeenCalledWith(
        expect.objectContaining({ limit: "1" })
      );
    });
  });

  describe('GET /api/analytics/customers', () => {
    it('should return customer insights', async () => {
      const mockCustomerData = {
        totalCustomers: 100,
        newCustomers: 20,
        segments: { vip: 10, regular: 70, new: 20 }
      };
      
      const mockAnalyticsService = require('../../../services/analytics.service');
      mockAnalyticsService.getCustomerInsights.mockResolvedValueOnce(mockCustomerData);
      
      const response = await request(app)
        .get('/api/analytics/customers')
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCustomerData);
    });

    it('should accept period parameter', async () => {
      const mockCustomerData = {
        totalCustomers: 50,
        newCustomers: 10,
        segments: { vip: 5, regular: 35, new: 10 }
      };
      
      const mockAnalyticsService = require('../../../services/analytics.service');
      mockAnalyticsService.getCustomerInsights.mockResolvedValueOnce(mockCustomerData);
      
      const response = await request(app)
        .get('/api/analytics/customers?period=month')
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCustomerData);
      expect(mockAnalyticsService.getCustomerInsights).toHaveBeenCalledWith(
        expect.objectContaining({ period: "month" })
      );
    });
  });

  describe('GET /api/analytics/inventory', () => {
    it('should return inventory analytics', async () => {
      const mockInventoryData = {
        totalItems: 500,
        lowStock: 15,
        valueByCategory: [
          { category: 'Rings', value: 50000 },
          { category: 'Necklaces', value: 75000 }
        ]
      };
      
      const mockAnalyticsService = require('../../../services/analytics.service');
      mockAnalyticsService.getInventoryAnalytics.mockResolvedValueOnce(mockInventoryData);
      
      const response = await request(app)
        .get('/api/analytics/inventory')
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockInventoryData);
    });

    it('should accept warehouseId parameter', async () => {
      const mockInventoryData = {
        totalItems: 200,
        lowStock: 5,
        valueByCategory: [
          { category: 'Rings', value: 20000 },
          { category: 'Necklaces', value: 30000 }
        ]
      };
      
      const mockAnalyticsService = require('../../../services/analytics.service');
      mockAnalyticsService.getInventoryAnalytics.mockResolvedValueOnce(mockInventoryData);
      
      const response = await request(app)
        .get('/api/analytics/inventory?warehouseId=1')
        .set('Authorization', token);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockInventoryData);
      expect(mockAnalyticsService.getInventoryAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({ warehouseId: "1" })
      );
    });
  });

  describe('Authorization', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard');
      
      expect(response.status).toBe(401);
    });

    it('should return 403 if user does not have admin role', async () => {
      // Mock JWT to return non-admin role
      require('jsonwebtoken').verify.mockReturnValueOnce({ id: 2, role: 'user' });
      
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', token);
      
      expect(response.status).toBe(403);
    });
  });
}); 