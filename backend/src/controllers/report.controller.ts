import { Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import { Order, OrderStatus, PaymentStatus } from '../models/order.model';
import { OrderItem } from '../models/orderItem.model';
import { Product } from '../models/product.model';
import { StockTransaction, TransactionType } from '../models/stockTransaction.model';
import { User } from '../models/user.model';
import { Customer, CustomerType, CustomerLoyaltyTier } from '../models/customer.model';

// Generate sales report
export const getSalesReport = async (req: Request, res: Response) => {
  try {
    const { 
      startDate, 
      endDate, 
      groupBy = 'day', 
      productId,
      category
    } = req.query;

    // Validate dates
    const start = startDate ? new Date(startDate as string) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate as string) : new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    // Base query filter
    const whereClause: any = {
      createdAt: {
        [Op.between]: [start, end]
      },
      status: {
        [Op.notIn]: [OrderStatus.CANCELLED]
      }
    };

    // Product-specific filtering
    const itemWhereClause: any = {};
    if (productId) {
      itemWhereClause.productId = productId;
    }

    // Include category filter for product data
    const productWhereClause: any = {};
    if (category) {
      productWhereClause.category = category;
    }

    let timeGroupFormat: string;
    switch (groupBy) {
      case 'month':
        timeGroupFormat = '%Y-%m';
        break;
      case 'year':
        timeGroupFormat = '%Y';
        break;
      case 'week':
        timeGroupFormat = '%Y-%U';
        break;
      case 'day':
      default:
        timeGroupFormat = '%Y-%m-%d';
        break;
    }

    // 1. Overall sales summary
    const salesSummary = await Order.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalSales'],
        [sequelize.fn('AVG', sequelize.col('totalAmount')), 'averageOrderValue']
      ],
      where: whereClause
    });

    // 2. Sales over time
    const salesOverTime = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), timeGroupFormat), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalSales']
      ],
      where: whereClause,
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), timeGroupFormat)],
      order: [sequelize.literal('date ASC')]
    });

    // 3. Top selling products
    const topProducts = await OrderItem.findAll({
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.col('subtotal')), 'totalRevenue']
      ],
      include: [
        {
          model: Order,
          attributes: [],
          where: whereClause,
          required: true
        },
        {
          model: Product,
          attributes: ['name', 'sku', 'category'],
          where: productWhereClause,
          required: true
        }
      ],
      where: itemWhereClause,
      group: ['productId'],
      order: [sequelize.literal('totalQuantity DESC')],
      limit: 10
    });

    // 4. Sales by payment method
    const salesByPaymentMethod = await Order.findAll({
      attributes: [
        'paymentMethod',
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalSales']
      ],
      where: whereClause,
      group: ['paymentMethod']
    });

    // 5. Sales by status
    const salesByStatus = await Order.findAll({
      attributes: [
        'status',
        'paymentStatus',
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalSales']
      ],
      where: {
        createdAt: {
          [Op.between]: [start, end]
        }
      },
      group: ['status', 'paymentStatus']
    });

    // 6. Revenue breakdown (tax, shipping, discounts)
    const revenueBreakdown = await Order.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('subtotal')), 'totalSubtotal'],
        [sequelize.fn('SUM', sequelize.col('taxAmount')), 'totalTax'],
        [sequelize.fn('SUM', sequelize.col('shippingAmount')), 'totalShipping'],
        [sequelize.fn('SUM', sequelize.col('discountAmount')), 'totalDiscounts']
      ],
      where: whereClause
    });

    return res.status(200).json({
      success: true,
      data: {
        period: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        },
        summary: salesSummary[0],
        salesOverTime,
        topProducts,
        salesByPaymentMethod,
        salesByStatus,
        revenueBreakdown: revenueBreakdown[0]
      }
    });
  } catch (error: any) {
    console.error('Error generating sales report:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while generating sales report',
      error: error.message
    });
  }
};

// Generate inventory report
export const getInventoryReport = async (req: Request, res: Response) => {
  try {
    const { 
      category,
      lowStock = false,
      warehouseId
    } = req.query;

    // Base filter
    const whereClause: any = {};
    
    if (category) {
      whereClause.category = category;
    }
    
    if (lowStock) {
      whereClause.stockQuantity = {
        [Op.lt]: sequelize.col('minStockLevel')
      };
    }

    // 1. Current inventory summary
    const inventorySummary = await Product.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalProducts'],
        [sequelize.fn('SUM', sequelize.col('stockQuantity')), 'totalStock'],
        [
          sequelize.literal('SUM(stockQuantity * price)'),
          'totalInventoryValue'
        ]
      ],
      where: whereClause
    });

    // 2. Inventory by category
    const inventoryByCategory = await Product.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'productCount'],
        [sequelize.fn('SUM', sequelize.col('stockQuantity')), 'totalStock'],
        [
          sequelize.literal('SUM(stockQuantity * price)'),
          'inventoryValue'
        ]
      ],
      where: whereClause,
      group: ['category']
    });

    // 3. Low stock items
    const lowStockItems = await Product.findAll({
      where: {
        ...whereClause,
        stockQuantity: {
          [Op.lt]: sequelize.col('minStockLevel')
        }
      },
      order: [
        [sequelize.literal('stockQuantity / minStockLevel'), 'ASC']
      ],
      limit: 20
    });

    // 4. Recent inventory movements (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentMovements = await StockTransaction.findAll({
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'transactionCount'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity']
      ],
      where: {
        ...(warehouseId ? { warehouseId: Number(warehouseId) } : {}),
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      group: ['type'],
      order: [['type', 'ASC']]
    });

    // 5. Stock turnover rate (ratio of sales to inventory)
    // This query gets products sold in the last 30 days and compares with current inventory
    const stockTurnover = await sequelize.query(`
      SELECT 
        p.id, 
        p.name,
        p.category,
        p.stockQuantity as currentStock,
        COALESCE(SUM(oi.quantity), 0) as quantitySold,
        CASE 
          WHEN p.stockQuantity > 0 
          THEN COALESCE(SUM(oi.quantity), 0) / p.stockQuantity 
          ELSE 0 
        END as turnoverRate
      FROM products p
      LEFT JOIN orderItems oi ON p.id = oi.productId
      LEFT JOIN orders o ON oi.orderId = o.id AND o.createdAt >= :thirtyDaysAgo
      AND o.status != :cancelledStatus
      GROUP BY p.id
      ORDER BY turnoverRate DESC
      LIMIT 20
    `, {
      replacements: { 
        thirtyDaysAgo: thirtyDaysAgo,
        cancelledStatus: OrderStatus.CANCELLED
      },
      type: QueryTypes.SELECT
    });

    return res.status(200).json({
      success: true,
      data: {
        summary: inventorySummary[0],
        byCategory: inventoryByCategory,
        lowStockItems,
        recentMovements,
        stockTurnover
      }
    });
  } catch (error: any) {
    console.error('Error generating inventory report:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while generating inventory report',
      error: error.message
    });
  }
};

// Generate customer report
export const getCustomerReport = async (req: Request, res: Response) => {
  try {
    const { 
      startDate, 
      endDate,
      type,
      loyaltyTier
    } = req.query;

    // Validate dates
    const start = startDate ? new Date(startDate as string) : new Date(new Date().setMonth(new Date().getMonth() - 3));
    const end = endDate ? new Date(endDate as string) : new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    // Base filter
    const customerWhereClause: any = {};
    if (type) {
      customerWhereClause.type = type;
    }
    if (loyaltyTier) {
      customerWhereClause.loyaltyTier = loyaltyTier;
    }

    // Order date filter for relevant customer metrics
    const orderWhereClause: any = {
      createdAt: {
        [Op.between]: [start, end]
      },
      status: {
        [Op.notIn]: [OrderStatus.CANCELLED]
      }
    };

    // 1. Customer overview
    const customerOverview = await Customer.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalCustomers'],
        [sequelize.fn('AVG', sequelize.col('lifetimeValue')), 'averageLifetimeValue'],
        [sequelize.fn('SUM', sequelize.col('lifetimeValue')), 'totalLifetimeValue']
      ],
      where: customerWhereClause
    });

    // 2. Customers by type
    const customersByType = await Customer.findAll({
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'customerCount'],
        [sequelize.fn('SUM', sequelize.col('lifetimeValue')), 'totalValue']
      ],
      where: customerWhereClause,
      group: ['type']
    });

    // 3. Customers by loyalty tier
    const customersByLoyaltyTier = await Customer.findAll({
      attributes: [
        'loyaltyTier',
        [sequelize.fn('COUNT', sequelize.col('id')), 'customerCount'],
        [sequelize.fn('AVG', sequelize.col('loyaltyPoints')), 'averagePoints'],
        [sequelize.fn('SUM', sequelize.col('lifetimeValue')), 'totalValue']
      ],
      where: customerWhereClause,
      group: ['loyaltyTier']
    });

    // 4. New customers in period
    const newCustomers = await Customer.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        ...customerWhereClause,
        createdAt: {
          [Op.between]: [start, end]
        }
      }
    });

    // 5. Customer acquisition over time
    const customerAcquisition = await Customer.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'newCustomers']
      ],
      where: customerWhereClause,
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m')],
      order: [sequelize.literal('month ASC')]
    });

    // 6. Top customers by revenue
    const topCustomers = await Customer.findAll({
      attributes: [
        'id',
        'type',
        'loyaltyTier',
        'lifetimeValue',
        'loyaltyPoints'
      ],
      include: [
        {
          model: User,
          attributes: ['firstName', 'lastName', 'email']
        },
        {
          model: Order,
          attributes: [
            [sequelize.fn('COUNT', sequelize.col('Order.id')), 'orderCount'],
            [sequelize.fn('SUM', sequelize.col('Order.totalAmount')), 'totalSpent']
          ],
          where: orderWhereClause,
          required: false
        }
      ],
      where: customerWhereClause,
      order: [['lifetimeValue', 'DESC']],
      limit: 10,
      group: ['Customer.id']
    });

    // 7. Customer retention
    // This is a complex calculation to find repeat customers and purchase frequency
    const retention = await sequelize.query(`
      SELECT
        COUNT(DISTINCT c.id) as totalCustomers,
        COUNT(DISTINCT CASE WHEN orderCount > 1 THEN c.id END) as repeatCustomers,
        (COUNT(DISTINCT CASE WHEN orderCount > 1 THEN c.id END) * 100.0 / 
          COUNT(DISTINCT c.id)) as retentionRate,
        AVG(orderCount) as averageOrdersPerCustomer
      FROM customers c
      LEFT JOIN (
        SELECT 
          customerId, 
          COUNT(id) as orderCount
        FROM orders
        WHERE createdAt BETWEEN :startDate AND :endDate
        AND status != :cancelledStatus
        GROUP BY customerId
      ) o ON c.id = o.customerId
    `, {
      replacements: { 
        startDate: start,
        endDate: end,
        cancelledStatus: OrderStatus.CANCELLED
      },
      type: QueryTypes.SELECT
    });

    return res.status(200).json({
      success: true,
      data: {
        period: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        },
        overview: customerOverview[0],
        byType: customersByType,
        byLoyaltyTier: customersByLoyaltyTier,
        newCustomers: newCustomers[0],
        customerAcquisition,
        topCustomers,
        retention: retention[0]
      }
    });
  } catch (error: any) {
    console.error('Error generating customer report:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while generating customer report',
      error: error.message
    });
  }
};

// Dashboard overview report
export const getDashboardReport = async (req: Request, res: Response) => {
  try {
    // Today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    oneMonthAgo.setHours(0, 0, 0, 0);

    // Last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    // 1. Today's summary
    const todaySummary = await Order.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue']
      ],
      where: {
        createdAt: {
          [Op.gte]: today
        },
        status: {
          [Op.ne]: OrderStatus.CANCELLED
        }
      }
    });

    // 2. Weekly summary
    const weeklySummary = await Order.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue']
      ],
      where: {
        createdAt: {
          [Op.gte]: oneWeekAgo
        },
        status: {
          [Op.ne]: OrderStatus.CANCELLED
        }
      }
    });

    // 3. Monthly summary
    const monthlySummary = await Order.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue'],
        [sequelize.fn('AVG', sequelize.col('totalAmount')), 'averageOrderValue']
      ],
      where: {
        createdAt: {
          [Op.gte]: oneMonthAgo
        },
        status: {
          [Op.ne]: OrderStatus.CANCELLED
        }
      }
    });

    // 4. Recent orders
    const recentOrders = await Order.findAll({
      include: [
        {
          model: Customer,
          include: [
            {
              model: User,
              attributes: ['firstName', 'lastName', 'email']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // 5. Orders by status
    const ordersByStatus = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: oneMonthAgo
        }
      },
      group: ['status']
    });

    // 6. Inventory alerts (low stock)
    const lowStockItems = await Product.findAll({
      where: {
        stockQuantity: {
          [Op.lt]: sequelize.col('minStockLevel')
        }
      },
      order: [
        [sequelize.literal('stockQuantity / minStockLevel'), 'ASC']
      ],
      limit: 5
    });

    // 7. New customers this month
    const newCustomers = await Customer.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: oneMonthAgo
        }
      }
    });

    // 8. Sales by day (last 7 days)
    const salesByDay = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m-%d'), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue']
      ],
      where: {
        createdAt: {
          [Op.gte]: oneWeekAgo
        },
        status: {
          [Op.ne]: OrderStatus.CANCELLED
        }
      },
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m-%d')],
      order: [sequelize.literal('date ASC')]
    });

    return res.status(200).json({
      success: true,
      data: {
        today: todaySummary[0],
        thisWeek: weeklySummary[0],
        thisMonth: monthlySummary[0],
        recentOrders,
        ordersByStatus,
        lowStockItems,
        newCustomers: newCustomers[0],
        salesByDay
      }
    });
  } catch (error: any) {
    console.error('Error generating dashboard report:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while generating dashboard report',
      error: error.message
    });
  }
}; 