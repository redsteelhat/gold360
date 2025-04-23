import { Request, Response } from 'express';
import { Customer, LoyaltyProgram, LoyaltyTransaction, Order } from '../models';
import { Op } from 'sequelize';

/**
 * @swagger
 * tags:
 *   name: Loyalty
 *   description: Loyalty program management
 */

/**
 * @swagger
 * /api/loyalty/programs:
 *   get:
 *     summary: Get all loyalty programs
 *     tags: [Loyalty]
 *     responses:
 *       200:
 *         description: List of loyalty programs
 *       500:
 *         description: Server error
 */
export const getAllPrograms = async (req: Request, res: Response) => {
  try {
    const programs = await LoyaltyProgram.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json(programs);
  } catch (error) {
    console.error('Error fetching loyalty programs:', error);
    return res.status(500).json({ error: 'Failed to fetch loyalty programs' });
  }
};

/**
 * @swagger
 * /api/loyalty/programs/{id}:
 *   get:
 *     summary: Get loyalty program by ID
 *     tags: [Loyalty]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Loyalty program details
 *       404:
 *         description: Program not found
 *       500:
 *         description: Server error
 */
export const getProgramById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const program = await LoyaltyProgram.findByPk(id);
    
    if (!program) {
      return res.status(404).json({ error: 'Loyalty program not found' });
    }
    
    return res.status(200).json(program);
  } catch (error) {
    console.error('Error fetching loyalty program:', error);
    return res.status(500).json({ error: 'Failed to fetch loyalty program' });
  }
};

/**
 * @swagger
 * /api/loyalty/programs:
 *   post:
 *     summary: Create a new loyalty program
 *     tags: [Loyalty]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - pointsPerCurrency
 *               - minimumPointsForRedemption
 *               - pointValueInCurrency
 *               - expiryMonths
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               pointsPerCurrency:
 *                 type: number
 *               minimumPointsForRedemption:
 *                 type: integer
 *               pointValueInCurrency:
 *                 type: number
 *               expiryMonths:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Loyalty program created
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
export const createProgram = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      pointsPerCurrency,
      minimumPointsForRedemption,
      pointValueInCurrency,
      expiryMonths,
      isActive
    } = req.body;
    
    if (!name || !pointsPerCurrency || !minimumPointsForRedemption || !pointValueInCurrency || !expiryMonths) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const newProgram = await LoyaltyProgram.create({
      name,
      description,
      pointsPerCurrency,
      minimumPointsForRedemption,
      pointValueInCurrency,
      expiryMonths,
      isActive: isActive !== undefined ? isActive : true
    });
    
    return res.status(201).json(newProgram);
  } catch (error) {
    console.error('Error creating loyalty program:', error);
    return res.status(500).json({ error: 'Failed to create loyalty program' });
  }
};

/**
 * @swagger
 * /api/loyalty/programs/{id}:
 *   put:
 *     summary: Update loyalty program
 *     tags: [Loyalty]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *               pointsPerCurrency:
 *                 type: number
 *               minimumPointsForRedemption:
 *                 type: integer
 *               pointValueInCurrency:
 *                 type: number
 *               expiryMonths:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Loyalty program updated
 *       404:
 *         description: Program not found
 *       500:
 *         description: Server error
 */
export const updateProgram = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      pointsPerCurrency,
      minimumPointsForRedemption,
      pointValueInCurrency,
      expiryMonths,
      isActive
    } = req.body;
    
    const program = await LoyaltyProgram.findByPk(id);
    
    if (!program) {
      return res.status(404).json({ error: 'Loyalty program not found' });
    }
    
    await program.update({
      name: name || program.name,
      description: description !== undefined ? description : program.description,
      pointsPerCurrency: pointsPerCurrency || program.pointsPerCurrency,
      minimumPointsForRedemption: minimumPointsForRedemption || program.minimumPointsForRedemption,
      pointValueInCurrency: pointValueInCurrency || program.pointValueInCurrency,
      expiryMonths: expiryMonths || program.expiryMonths,
      isActive: isActive !== undefined ? isActive : program.isActive
    });
    
    return res.status(200).json(program);
  } catch (error) {
    console.error('Error updating loyalty program:', error);
    return res.status(500).json({ error: 'Failed to update loyalty program' });
  }
};

/**
 * @swagger
 * /api/loyalty/customer/{customerId}:
 *   get:
 *     summary: Get customer loyalty information
 *     tags: [Loyalty]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customer loyalty details
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
export const getCustomerLoyalty = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    
    const customer = await Customer.findByPk(customerId);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Get active loyalty program
    const activeProgram = await LoyaltyProgram.findOne({
      where: { isActive: true }
    });
    
    // Get loyalty transactions
    const transactions = await LoyaltyTransaction.findAll({
      where: { customerId },
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    // Calculate points value
    const pointsValue = activeProgram
      ? Math.floor(customer.loyaltyPoints * activeProgram.pointValueInCurrency)
      : 0;
    
    // Calculate customer tier/segment based on points or spending
    let tier = 'standard';
    if (customer.loyaltyPoints > 10000 || customer.totalSpent > 10000) {
      tier = 'vip';
    } else if (customer.loyaltyPoints > 5000 || customer.totalSpent > 5000) {
      tier = 'gold';
    } else if (customer.loyaltyPoints > 1000 || customer.totalSpent > 1000) {
      tier = 'silver';
    }
    
    return res.status(200).json({
      customer: {
        id: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        segment: customer.segment,
        loyaltyPoints: customer.loyaltyPoints,
        totalSpent: customer.totalSpent,
        lastPurchaseDate: customer.lastPurchaseDate
      },
      loyalty: {
        tier,
        points: customer.loyaltyPoints,
        pointsValue,
        transactions,
        program: activeProgram
      }
    });
  } catch (error) {
    console.error('Error fetching customer loyalty:', error);
    return res.status(500).json({ error: 'Failed to fetch customer loyalty information' });
  }
};

/**
 * @swagger
 * /api/loyalty/transactions/{customerId}:
 *   get:
 *     summary: Get customer loyalty transactions
 *     tags: [Loyalty]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customer loyalty transactions
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
export const getCustomerTransactions = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    
    const customer = await Customer.findByPk(customerId);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const transactions = await LoyaltyTransaction.findAll({
      where: { customerId },
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching customer transactions:', error);
    return res.status(500).json({ error: 'Failed to fetch customer transactions' });
  }
};

/**
 * @swagger
 * /api/loyalty/transactions:
 *   post:
 *     summary: Create a loyalty transaction (earn or redeem points)
 *     tags: [Loyalty]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - points
 *               - transactionType
 *               - referenceType
 *             properties:
 *               customerId:
 *                 type: integer
 *               points:
 *                 type: integer
 *               transactionType:
 *                 type: string
 *                 enum: [earn, redeem, expire, adjust]
 *               referenceType:
 *                 type: string
 *                 enum: [order, promotion, system, support]
 *               referenceId:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const {
      customerId,
      points,
      transactionType,
      referenceType,
      referenceId,
      description
    } = req.body;
    
    // Validate required fields
    if (!customerId || !points || !transactionType || !referenceType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Find customer
    const customer = await Customer.findByPk(customerId);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Get active loyalty program for expiry date calculation
    const activeProgram = await LoyaltyProgram.findOne({
      where: { isActive: true }
    });
    
    let expiryDate: Date | undefined = undefined;
    if (activeProgram && transactionType === 'earn') {
      expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + activeProgram.expiryMonths);
    }
    
    // Create transaction
    const transaction = await LoyaltyTransaction.create({
      customerId,
      points,
      transactionType,
      referenceType,
      referenceId,
      description,
      expiryDate,
      isExpired: false
    });
    
    // Update customer's loyalty points
    let newPoints = customer.loyaltyPoints;
    if (transactionType === 'earn' || transactionType === 'adjust') {
      newPoints += points;
    } else if (transactionType === 'redeem' || transactionType === 'expire') {
      newPoints -= points;
      if (newPoints < 0) newPoints = 0;
    }
    
    await customer.update({ loyaltyPoints: newPoints });
    
    // If this is related to an order, update the order's related fields if they exist
    if (referenceType === 'order' && referenceId) {
      try {
        const order = await Order.findByPk(referenceId);
        if (order) {
          // Check if the order model has a field for loyalty points
          if ('loyaltyPointsEarned' in order) {
            await order.update({ loyaltyPointsEarned: points } as any);
          }
        }
      } catch (orderError) {
        console.error('Error updating order loyalty points:', orderError);
        // Continue even if order update fails
      }
    }
    
    return res.status(201).json({
      transaction,
      customer: {
        id: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        loyaltyPoints: newPoints
      }
    });
  } catch (error) {
    console.error('Error creating loyalty transaction:', error);
    return res.status(500).json({ error: 'Failed to create loyalty transaction' });
  }
};

/**
 * @swagger
 * /api/loyalty/process-expired:
 *   post:
 *     summary: Process expired loyalty points
 *     tags: [Loyalty]
 *     responses:
 *       200:
 *         description: Expired points processed
 *       500:
 *         description: Server error
 */
export const processExpiredPoints = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    
    // Find transactions with expiry dates in the past that aren't already expired
    const expiredTransactions = await LoyaltyTransaction.findAll({
      where: {
        expiryDate: { [Op.lt]: now },
        isExpired: false,
        transactionType: 'earn'
      }
    });
    
    const results = {
      processedCount: 0,
      totalPointsExpired: 0,
      customerIds: new Set<number>()
    };
    
    // Process each expired transaction
    for (const transaction of expiredTransactions) {
      // Create expiry transaction
      await LoyaltyTransaction.create({
        customerId: transaction.customerId,
        points: transaction.points,
        transactionType: 'expire',
        referenceType: 'system',
        description: `Points expired from transaction ID ${transaction.id}`,
        isExpired: false
      });
      
      // Mark original transaction as expired
      await transaction.update({ isExpired: true });
      
      // Update customer points
      const customer = await Customer.findByPk(transaction.customerId);
      if (customer) {
        const newPoints = Math.max(0, customer.loyaltyPoints - transaction.points);
        await customer.update({ loyaltyPoints: newPoints });
        results.customerIds.add(customer.id);
      }
      
      results.processedCount++;
      results.totalPointsExpired += transaction.points;
    }
    
    return res.status(200).json({
      message: 'Expired points processed successfully',
      processedCount: results.processedCount,
      totalPointsExpired: results.totalPointsExpired,
      affectedCustomers: Array.from(results.customerIds).length
    });
  } catch (error) {
    console.error('Error processing expired points:', error);
    return res.status(500).json({ error: 'Failed to process expired points' });
  }
};

export default {
  getAllPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  getCustomerLoyalty,
  getCustomerTransactions,
  createTransaction,
  processExpiredPoints
}; 