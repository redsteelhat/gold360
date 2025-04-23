import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Placeholder for inventory controller functions
// These will need to be implemented
router.get('/', authMiddleware, (req, res) => {
  res.status(200).json({ message: 'Get inventory status' });
});

router.post('/stock-in', authMiddleware, (req, res) => {
  res.status(201).json({ message: 'Stock in items', data: req.body });
});

router.post('/stock-out', authMiddleware, (req, res) => {
  res.status(201).json({ message: 'Stock out items', data: req.body });
});

router.get('/low-stock', authMiddleware, (req, res) => {
  res.status(200).json({ message: 'Get low stock items' });
});

router.get('/history', authMiddleware, (req, res) => {
  res.status(200).json({ message: 'Get inventory history' });
});

export default router; 