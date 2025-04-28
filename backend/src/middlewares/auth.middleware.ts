import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';

interface DecodedToken {
  id: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export const authMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void | Response> => {
  // Development mode bypass (only for development)
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Test için: "dummy-dev-token-for-testing" token'ını kabul et
  const authHeader = req.headers.authorization;
  if (isDevelopment && authHeader && authHeader.includes('dummy-dev-token-for-testing')) {
    console.log('Using dummy dev token authentication');
    (req as any).user = {
      id: 1,
      email: 'dev@example.com',
      role: 'admin'
    };
    return next();
  }
  
  if (isDevelopment && process.env.BYPASS_AUTH === 'true') {
    console.log('Auth middleware bypassed in development mode');
    // Add a default user for development
    (req as any).user = {
      id: 1,
      email: 'dev@example.com',
      role: 'admin'
    };
    return next();
  }

  // Get token from header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed: No token provided',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify token
    // @ts-ignore - Ignoring type issues with JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key') as DecodedToken;
    
    // Find user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: User not found',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: User is not active',
      });
    }

    // Add user to request object
    (req as any).user = user;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed: Invalid token',
    });
  }
}; 