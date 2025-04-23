import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';

class AuthController {
  /**
   * Register a new user
   */
  public register = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { name, email, password, role } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        role: role || 'customer',
      });

      // Generate token
      const token = this.generateToken(user);

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }

  /**
   * Login user
   */
  public login = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide email and password',
        });
      }

      // Check if user exists
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check if password matches
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Update last login
      await user.update({
        lastLoginAt: new Date(),
      });

      // Generate token
      const token = this.generateToken(user);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }

  /**
   * Get current user
   */
  public getMe = async (req: Request, res: Response): Promise<Response> => {
    try {
      // User is attached to request in auth middleware
      const user = (req as any).user;
      
      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Get me error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken = (user: any): string => {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    
    // @ts-ignore - Ignoring type issues with JWT
    return jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret_key', {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    });
  }
}

export default new AuthController(); 