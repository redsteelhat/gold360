import { Request, Response } from 'express';
import * as orderController from '../../../controllers/order.controller';
import { Order, OrderItem, Product, Customer } from '../../../models';

// Mock dependencies
jest.mock('../../../models', () => ({
  Order: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn()
  },
  OrderItem: {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  Product: {
    findByPk: jest.fn()
  },
  Customer: {
    findByPk: jest.fn(),
    update: jest.fn()
  },
  Inventory: {
    findOne: jest.fn(),
    update: jest.fn()
  }
}));

describe('Order Controller', () => {
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

  describe('getAllOrders', () => {
    it('should return all orders', async () => {
      const mockOrders = [
        { id: 1, customerId: 1, status: 'COMPLETED', totalAmount: 1500, customer: { firstName: 'John' } },
        { id: 2, customerId: 2, status: 'PENDING', totalAmount: 2000, customer: { firstName: 'Jane' } }
      ];
      
      (Order.findAll as jest.Mock).mockResolvedValue(mockOrders);
      
      await orderController.getAllOrders(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toEqual(mockOrders);
    });

    it('should handle errors and return 500', async () => {
      (Order.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      await orderController.getAllOrders(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject).toHaveProperty('message');
      expect(responseObject).toHaveProperty('error');
    });
  });

  describe('getOrderById', () => {
    it('should return an order by ID with items', async () => {
      const mockOrder = {
        id: 1,
        customerId: 1,
        status: 'COMPLETED',
        totalAmount: 1500,
        items: [
          { id: 1, orderId: 1, productId: 1, quantity: 1, price: 1000, product: { name: 'Gold Ring' } },
          { id: 2, orderId: 1, productId: 2, quantity: 1, price: 500, product: { name: 'Silver Necklace' } }
        ],
        customer: { firstName: 'John', lastName: 'Doe' }
      };
      
      mockRequest.params = { id: '1' };
      
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      
      await orderController.getOrderById(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toEqual(mockOrder);
    });

    it('should return 404 if order not found', async () => {
      mockRequest.params = { id: '999' };
      
      (Order.findByPk as jest.Mock).mockResolvedValue(null);
      
      await orderController.getOrderById(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toHaveProperty('message', 'Order not found');
    });
  });

  describe('createOrder', () => {
    it('should create a new order with items', async () => {
      const orderData = {
        customerId: 1,
        items: [
          { productId: 1, quantity: 1, price: 1000 },
          { productId: 2, quantity: 1, price: 500 }
        ],
        paymentMethod: 'CREDIT_CARD',
        shippingAddress: '123 Main St'
      };
      
      mockRequest.body = orderData;
      
      const mockCustomer = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        loyaltyPoints: 100,
        update: jest.fn()
      };
      
      const mockProducts = [
        { id: 1, name: 'Gold Ring', price: 1000, weightGrams: 10 },
        { id: 2, name: 'Silver Necklace', price: 500, weightGrams: 20 }
      ];
      
      const mockInventory = {
        productId: 1,
        warehouseId: 1,
        quantity: 10,
        update: jest.fn()
      };
      
      const mockCreatedOrder = {
        id: 3,
        customerId: 1,
        status: 'PENDING',
        totalAmount: 1500,
        orderNumber: 'ORD-2023-001',
        ...orderData
      };
      
      const mockCreatedItems = [
        { id: 1, orderId: 3, productId: 1, quantity: 1, price: 1000 },
        { id: 2, orderId: 3, productId: 2, quantity: 1, price: 500 }
      ];
      
      (Customer.findByPk as jest.Mock).mockResolvedValue(mockCustomer);
      (Product.findByPk as jest.Mock)
        .mockResolvedValueOnce(mockProducts[0])
        .mockResolvedValueOnce(mockProducts[1]);
      
      (Order.create as jest.Mock).mockResolvedValue(mockCreatedOrder);
      (OrderItem.create as jest.Mock)
        .mockResolvedValueOnce(mockCreatedItems[0])
        .mockResolvedValueOnce(mockCreatedItems[1]);
      
      await orderController.createOrder(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject).toHaveProperty('order', mockCreatedOrder);
      expect(responseObject).toHaveProperty('items');
      expect(Order.create).toHaveBeenCalled();
      expect(OrderItem.create).toHaveBeenCalledTimes(2);
    });

    it('should handle missing customer', async () => {
      const orderData = {
        customerId: 999,
        items: [{ productId: 1, quantity: 1 }]
      };
      
      mockRequest.body = orderData;
      
      (Customer.findByPk as jest.Mock).mockResolvedValue(null);
      
      await orderController.createOrder(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toHaveProperty('message', 'Customer not found');
    });

    it('should handle validation errors', async () => {
      mockRequest.body = { customerId: 1 }; // Missing items
      
      await orderController.createOrder(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toHaveProperty('message');
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'SHIPPED' };
      
      const mockOrder = {
        id: 1,
        status: 'PROCESSING',
        update: jest.fn().mockResolvedValue({
          id: 1,
          status: 'SHIPPED'
        })
      };
      
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      
      await orderController.updateOrderStatus(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockOrder.update).toHaveBeenCalledWith({ status: 'SHIPPED' });
      expect(responseObject).toHaveProperty('message', 'Order status updated successfully');
    });

    it('should return 404 if order not found', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { status: 'SHIPPED' };
      
      (Order.findByPk as jest.Mock).mockResolvedValue(null);
      
      await orderController.updateOrderStatus(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toHaveProperty('message', 'Order not found');
    });

    it('should return 400 if status is invalid', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'INVALID_STATUS' };
      
      const mockOrder = {
        id: 1,
        status: 'PROCESSING'
      };
      
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      
      await orderController.updateOrderStatus(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toHaveProperty('message', 'Invalid order status');
    });
  });

  describe('getCustomerOrders', () => {
    it('should return all orders for a customer', async () => {
      mockRequest.params = { customerId: '1' };
      
      const mockOrders = [
        { id: 1, customerId: 1, status: 'COMPLETED', totalAmount: 1500 },
        { id: 3, customerId: 1, status: 'PROCESSING', totalAmount: 2500 }
      ];
      
      (Customer.findByPk as jest.Mock).mockResolvedValue({ id: 1, firstName: 'John' });
      (Order.findAll as jest.Mock).mockResolvedValue(mockOrders);
      
      await orderController.getCustomerOrders(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toEqual(mockOrders);
    });

    it('should return 404 if customer not found', async () => {
      mockRequest.params = { customerId: '999' };
      
      (Customer.findByPk as jest.Mock).mockResolvedValue(null);
      
      await orderController.getCustomerOrders(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toHaveProperty('message', 'Customer not found');
    });
  });

  describe('addOrderItem', () => {
    it('should add an item to an existing order', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { productId: 3, quantity: 1, price: 800 };
      
      const mockOrder = {
        id: 1,
        status: 'PENDING',
        totalAmount: 1500,
        update: jest.fn()
      };
      
      const mockProduct = {
        id: 3,
        name: 'Gold Bracelet',
        price: 800
      };
      
      const mockNewItem = {
        id: 3,
        orderId: 1,
        productId: 3,
        quantity: 1,
        price: 800
      };
      
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (Product.findByPk as jest.Mock).mockResolvedValue(mockProduct);
      (OrderItem.create as jest.Mock).mockResolvedValue(mockNewItem);
      
      await orderController.addOrderItem(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject).toHaveProperty('message', 'Item added to order successfully');
      expect(responseObject).toHaveProperty('item', mockNewItem);
      expect(mockOrder.update).toHaveBeenCalledWith({ totalAmount: 2300 });
    });

    it('should return 404 if order not found', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { productId: 3, quantity: 1, price: 800 };
      
      (Order.findByPk as jest.Mock).mockResolvedValue(null);
      
      await orderController.addOrderItem(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toHaveProperty('message', 'Order not found');
    });

    it('should return 400 if order is not in PENDING state', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { productId: 3, quantity: 1, price: 800 };
      
      const mockOrder = {
        id: 1,
        status: 'SHIPPED',
        totalAmount: 1500
      };
      
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      
      await orderController.addOrderItem(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toHaveProperty('message', 'Cannot modify a non-pending order');
    });
  });

  describe('updateOrderItem', () => {
    it('should update an order item quantity and price', async () => {
      mockRequest.params = { id: '1', itemId: '1' };
      mockRequest.body = { quantity: 2, price: 900 };
      
      const mockOrder = {
        id: 1,
        status: 'PENDING',
        totalAmount: 1500,
        update: jest.fn()
      };
      
      const mockItem = {
        id: 1,
        orderId: 1,
        productId: 1,
        quantity: 1,
        price: 1000,
        update: jest.fn().mockResolvedValue({
          id: 1,
          orderId: 1,
          productId: 1,
          quantity: 2,
          price: 900
        })
      };
      
      const mockItems = [
        mockItem,
        { id: 2, orderId: 1, productId: 2, quantity: 1, price: 500 }
      ];
      
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (OrderItem.findOne as jest.Mock).mockResolvedValue(mockItem);
      (OrderItem.findAll as jest.Mock).mockResolvedValue(mockItems);
      
      await orderController.updateOrderItem(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toHaveProperty('message', 'Order item updated successfully');
      expect(mockItem.update).toHaveBeenCalledWith({ quantity: 2, price: 900 });
      expect(mockOrder.update).toHaveBeenCalledWith({ totalAmount: 2300 });
    });

    it('should return 404 if order item not found', async () => {
      mockRequest.params = { id: '1', itemId: '999' };
      mockRequest.body = { quantity: 2 };
      
      (Order.findByPk as jest.Mock).mockResolvedValue({ id: 1, status: 'PENDING' });
      (OrderItem.findOne as jest.Mock).mockResolvedValue(null);
      
      await orderController.updateOrderItem(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toHaveProperty('message', 'Order item not found');
    });
  });

  describe('deleteOrderItem', () => {
    it('should delete an order item and update total amount', async () => {
      mockRequest.params = { id: '1', itemId: '1' };
      
      const mockOrder = {
        id: 1,
        status: 'PENDING',
        totalAmount: 1500,
        update: jest.fn()
      };
      
      const mockItem = {
        id: 1,
        orderId: 1,
        productId: 1,
        quantity: 1,
        price: 1000,
        destroy: jest.fn()
      };
      
      const remainingItems = [
        { id: 2, orderId: 1, productId: 2, quantity: 1, price: 500 }
      ];
      
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (OrderItem.findOne as jest.Mock).mockResolvedValue(mockItem);
      (OrderItem.findAll as jest.Mock).mockResolvedValue(remainingItems);
      
      await orderController.deleteOrderItem(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toHaveProperty('message', 'Order item deleted successfully');
      expect(mockItem.destroy).toHaveBeenCalled();
      expect(mockOrder.update).toHaveBeenCalledWith({ totalAmount: 500 });
    });

    it('should return 404 if order item not found', async () => {
      mockRequest.params = { id: '1', itemId: '999' };
      
      (Order.findByPk as jest.Mock).mockResolvedValue({ id: 1, status: 'PENDING' });
      (OrderItem.findOne as jest.Mock).mockResolvedValue(null);
      
      await orderController.deleteOrderItem(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toHaveProperty('message', 'Order item not found');
    });
  });
}); 