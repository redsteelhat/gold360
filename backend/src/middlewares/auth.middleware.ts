import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/user.model';

// JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'gold360_jwt_secret';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: UserRole;
      };
    }
  }
}

/**
 * Middleware to authenticate the JWT token
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        res.status(401).json({ message: 'Invalid or expired token' });
        return;
      }

      // Set user information in request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
      
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication failed', error: (error as Error).message });
  }
};

/**
 * Middleware to check if user has required role
 */
export const authorize = (roles: UserRole | UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const userRole = req.user.role;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({ message: 'You do not have permission to access this resource' });
        return;
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({ message: 'Authorization failed', error: (error as Error).message });
    }
  };
};

/**
 * Middleware to check if a user is accessing their own resource
 * For example, only allow user to update their own profile
 */
export const isResourceOwner = (paramIdField: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const resourceId = parseInt(req.params[paramIdField], 10);
      const userId = req.user.id;

      // Admin can access any resource
      if (req.user.role === UserRole.ADMIN) {
        next();
        return;
      }

      // Check if the user is accessing their own resource
      if (resourceId !== userId) {
        res.status(403).json({ message: 'You do not have permission to access this resource' });
        return;
      }

      next();
    } catch (error) {
      console.error('Resource ownership error:', error);
      res.status(500).json({ message: 'Authorization failed', error: (error as Error).message });
    }
  };
}; 