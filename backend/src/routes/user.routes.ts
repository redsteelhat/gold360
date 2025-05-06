import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Failed to get users
 */
router.get('/', authenticate, authorize([UserRole.ADMIN]), (req, res) => {
  // Placeholder for user listing functionality
  res.status(200).json({ message: 'User listing functionality will be implemented' });
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to get user
 */
router.get('/:id', authenticate, (req, res) => {
  // Placeholder for get user functionality
  res.status(200).json({ message: 'Get user functionality will be implemented' });
});

export default router; 