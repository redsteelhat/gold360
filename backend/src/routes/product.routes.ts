import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Placeholder for product controller functions
// These will need to be implemented
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Get all products' });
});

router.get('/:id', (req, res) => {
  res.status(200).json({ message: `Get product with ID: ${req.params.id}` });
});

router.post('/', authMiddleware, (req, res) => {
  res.status(201).json({ message: 'Create new product', data: req.body });
});

router.put('/:id', authMiddleware, (req, res) => {
  res.status(200).json({ message: `Update product with ID: ${req.params.id}`, data: req.body });
});

router.delete('/:id', authMiddleware, (req, res) => {
  res.status(200).json({ message: `Delete product with ID: ${req.params.id}` });
});

export default router; 