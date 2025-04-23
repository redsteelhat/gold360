import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Placeholder for customer controller functions
// These will need to be implemented
router.get('/', authMiddleware, (req, res) => {
  res.status(200).json({ message: 'Get all customers' });
});

router.get('/:id', authMiddleware, (req, res) => {
  res.status(200).json({ message: `Get customer with ID: ${req.params.id}` });
});

router.post('/', authMiddleware, (req, res) => {
  res.status(201).json({ message: 'Create new customer', data: req.body });
});

router.put('/:id', authMiddleware, (req, res) => {
  res.status(200).json({ message: `Update customer with ID: ${req.params.id}`, data: req.body });
});

router.delete('/:id', authMiddleware, (req, res) => {
  res.status(200).json({ message: `Delete customer with ID: ${req.params.id}` });
});

export default router; 