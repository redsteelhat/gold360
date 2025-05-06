import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../models/user.model';
import * as customerController from '../controllers/customer.controller';

const router = express.Router();

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers with filtering and pagination
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [individual, business]
 *         description: Filter by customer type
 *       - in: query
 *         name: loyaltyTier
 *         schema:
 *           type: string
 *           enum: [bronze, silver, gold, platinum]
 *         description: Filter by loyalty tier
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of customers to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of customers to skip
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
 *         description: Sort order (ascending or descending)
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Failed to get customers
 */
router.get('/', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]), customerController.getAllCustomers);

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get a customer by ID
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Failed to get customer
 */
router.get('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]), customerController.getCustomerById);

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: User ID to associate with the customer
 *               type:
 *                 type: string
 *                 enum: [individual, business]
 *                 description: Customer type
 *               companyName:
 *                 type: string
 *                 description: Company name (for business customers)
 *               taxId:
 *                 type: string
 *                 description: Tax ID (for business customers)
 *               phoneNumber:
 *                 type: string
 *                 description: Customer phone number
 *               addresses:
 *                 type: array
 *                 description: Customer addresses
 *               preferences:
 *                 type: object
 *                 description: Customer preferences
 *               notes:
 *                 type: string
 *                 description: Notes about the customer
 *               marketingConsent:
 *                 type: boolean
 *                 description: Whether the customer has consented to marketing
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Customer already exists for this user
 *       500:
 *         description: Failed to create customer
 */
router.post('/', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), customerController.createCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Update a customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [individual, business]
 *               companyName:
 *                 type: string
 *               taxId:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               addresses:
 *                 type: array
 *               preferences:
 *                 type: object
 *               notes:
 *                 type: string
 *               marketingConsent:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Failed to update customer
 */
router.put('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), customerController.updateCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: Delete a customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Failed to delete customer
 */
router.delete('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), customerController.deleteCustomer);

/**
 * @swagger
 * /api/customers/{id}/loyalty:
 *   get:
 *     summary: Get a customer's loyalty information
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer loyalty information retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Failed to get customer loyalty information
 */
router.get('/:id/loyalty', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]), customerController.getCustomerLoyalty);

/**
 * @swagger
 * /api/customers/{id}/loyalty:
 *   put:
 *     summary: Update a customer's loyalty points or tier
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               points:
 *                 type: integer
 *                 description: Points to add (positive) or subtract (negative)
 *               tier:
 *                 type: string
 *                 enum: [bronze, silver, gold, platinum]
 *                 description: New loyalty tier
 *               reason:
 *                 type: string
 *                 description: Reason for the loyalty update
 *     responses:
 *       200:
 *         description: Customer loyalty updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Failed to update customer loyalty
 */
router.put('/:id/loyalty', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), customerController.updateCustomerLoyalty);

/**
 * @swagger
 * /api/customers/{id}/address:
 *   post:
 *     summary: Add a new address to a customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - street
 *               - city
 *               - postalCode
 *               - country
 *             properties:
 *               street:
 *                 type: string
 *                 description: Street address
 *               city:
 *                 type: string
 *                 description: City
 *               state:
 *                 type: string
 *                 description: State or province
 *               postalCode:
 *                 type: string
 *                 description: Postal or ZIP code
 *               country:
 *                 type: string
 *                 description: Country
 *               isDefault:
 *                 type: boolean
 *                 description: Whether this is the default address
 *     responses:
 *       200:
 *         description: Address added successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Failed to add address
 */
router.post('/:id/address', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]), customerController.addCustomerAddress);

/**
 * @swagger
 * /api/customers/{id}/address/{addressIndex}:
 *   put:
 *     summary: Update a customer address
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *       - in: path
 *         name: addressIndex
 *         required: true
 *         schema:
 *           type: integer
 *         description: Address index in the addresses array
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               street:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               country:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Customer or address not found
 *       500:
 *         description: Failed to update address
 */
router.put('/:id/address/:addressIndex', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]), customerController.updateCustomerAddress);

/**
 * @swagger
 * /api/customers/{id}/address/{addressIndex}:
 *   delete:
 *     summary: Delete a customer address
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *       - in: path
 *         name: addressIndex
 *         required: true
 *         schema:
 *           type: integer
 *         description: Address index in the addresses array
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Customer or address not found
 *       500:
 *         description: Failed to delete address
 */
router.delete('/:id/address/:addressIndex', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]), customerController.deleteCustomerAddress);

/**
 * @swagger
 * /api/customers/{id}/value:
 *   put:
 *     summary: Update a customer's lifetime value
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: number
 *                 description: Value to add (positive) or subtract (negative)
 *     responses:
 *       200:
 *         description: Customer lifetime value updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Failed to update customer lifetime value
 */
router.put('/:id/value', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), customerController.updateLifetimeValue);

export default router; 