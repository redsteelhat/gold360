import express from 'express';
import { 
  getAllProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  updateProductStock 
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with pagination and filtering
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product name, description, or SKU
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, draft, sold_out, discontinued]
 *         description: Filter by product status
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       500:
 *         description: Failed to get products
 */
router.get('/', getAllProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Failed to get product
 */
router.get('/:id', getProductById);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - sku
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               salePrice:
 *                 type: number
 *               stockQuantity:
 *                 type: integer
 *               sku:
 *                 type: string
 *               barcode:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [active, draft, sold_out, discontinued]
 *               taxRate:
 *                 type: number
 *               isVisible:
 *                 type: boolean
 *               isFeatured:
 *                 type: boolean
 *               metadata:
 *                 type: object
 *               weight:
 *                 type: number
 *               length:
 *                 type: number
 *               width:
 *                 type: number
 *               height:
 *                 type: number
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: A product with this SKU already exists
 *       500:
 *         description: Failed to create product
 */
router.post('/', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               salePrice:
 *                 type: number
 *               stockQuantity:
 *                 type: integer
 *               sku:
 *                 type: string
 *               barcode:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [active, draft, sold_out, discontinued]
 *               taxRate:
 *                 type: number
 *               isVisible:
 *                 type: boolean
 *               isFeatured:
 *                 type: boolean
 *               metadata:
 *                 type: object
 *               weight:
 *                 type: number
 *               length:
 *                 type: number
 *               width:
 *                 type: number
 *               height:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: A product with this SKU already exists
 *       404:
 *         description: Product not found
 *       500:
 *         description: Failed to update product
 */
router.put('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Failed to delete product
 */
router.delete('/:id', authenticate, authorize([UserRole.ADMIN]), deleteProduct);

/**
 * @swagger
 * /api/products/{id}/stock:
 *   patch:
 *     summary: Update product stock
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stockQuantity
 *             properties:
 *               stockQuantity:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Product stock updated successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Failed to update product stock
 */
router.patch('/:id/stock', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]), updateProductStock);

export default router; 