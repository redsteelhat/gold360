import { Request, Response } from 'express';
import authController from '../../../controllers/auth.controller';
import { User } from '../../../models';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../../../models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-token')
}));

describe('Auth Controller', () => {
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

  describe('login', () => {
    it('should return 400 if email or password is missing', async () => {
      // Setup
      mockRequest.body = { email: 'test@example.com' }; // Missing password
      
      // Execute
      await authController.login(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toEqual({
        success: false,
        message: 'Please provide email and password'
      });
    });

    it('should return 401 if user is not found', async () => {
      // Setup
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      (User.findOne as jest.Mock).mockResolvedValue(null);
      
      // Execute
      await authController.login(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseObject).toEqual({
        success: false,
        message: 'Invalid credentials'
      });
    });

    it('should return 401 if password does not match', async () => {
      // Setup
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      const mockUser = {
        comparePassword: jest.fn().mockResolvedValue(false),
        update: jest.fn()
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      
      // Execute
      await authController.login(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseObject).toEqual({
        success: false,
        message: 'Invalid credentials'
      });
    });

    it('should return 200 with token if login is successful', async () => {
      // Setup
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer',
        comparePassword: jest.fn().mockResolvedValue(true),
        update: jest.fn()
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      
      // Execute
      await authController.login(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toEqual({
        success: true,
        message: 'Login successful',
        token: 'mock-token',
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'customer'
        }
      });
      expect(mockUser.update).toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should return 400 if email is already in use', async () => {
      // Setup
      mockRequest.body = { 
        name: 'Test User', 
        email: 'existing@example.com', 
        password: 'password123' 
      };
      (User.findOne as jest.Mock).mockResolvedValue({ id: 1 }); // Existing user
      
      // Execute
      await authController.register(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toEqual({
        success: false,
        message: 'Email already in use'
      });
    });

    it('should create a new user and return 201 with token', async () => {
      // Setup
      mockRequest.body = { 
        name: 'Test User', 
        email: 'new@example.com', 
        password: 'password123' 
      };
      (User.findOne as jest.Mock).mockResolvedValue(null); // No existing user
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'new@example.com',
        role: 'customer'
      };
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      
      // Execute
      await authController.register(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject).toEqual({
        success: true,
        message: 'User registered successfully',
        token: 'mock-token',
        user: {
          id: 1,
          name: 'Test User',
          email: 'new@example.com',
          role: 'customer'
        }
      });
    });
  });
}); 