import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../models/user.model';

// JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'gold360_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'User with this email already exists' });
      return;
    }

    // Only allow admins to create admin or manager accounts
    if ((role === UserRole.ADMIN || role === UserRole.MANAGER) && 
        (!req.user || req.user.role !== UserRole.ADMIN)) {
      res.status(403).json({ message: 'You do not have permission to create this user type' });
      return;
    }

    // Create new user
    const newUser = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: role || UserRole.CUSTOMER,
      isActive: true,
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user info and token
    res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: (error as Error).message });
  }
};

/**
 * User login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({ message: 'Your account has been deactivated' });
      return;
    }

    // Verify password
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user info and token
    res.status(200).json({
      message: 'Login successful',
      user,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: (error as Error).message });
  }
};

/**
 * Get the current user's profile
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // User should be attached by the auth middleware
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      message: 'Profile retrieved successfully',
      user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile', error: (error as Error).message });
  }
};

/**
 * Change password
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Verify current password
    const isPasswordValid = await user.validatePassword(currentPassword);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password', error: (error as Error).message });
  }
};

/**
 * Verify JWT Token
 */
export const verifyToken = async (req: Request, res: Response): Promise<void> => {
  try {
    // At this point, the user has been authenticated by the middleware
    res.status(200).json({ valid: true, user: req.user });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Failed to verify token', error: (error as Error).message });
  }
}; 