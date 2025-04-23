import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Order, OrderItem, Product, Customer, Inventory, Shipment } from '../models';
import analyticsService from '../services/analytics.service';

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Raporlama ve analitik işlemleri
 */

/**
 * @swagger
 * /api/analytics/sales/summary:
 *   get:
 *     summary: Get sales summary for dashboard
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           default: monthly
 *         description: Time period for the report
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for custom period (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for custom period (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Sales summary data
 *       500:
 *         description: Server error
 */
export const getSalesSummary = async (req: Request, res: Response) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;
    
    const summary = await analyticsService.getSalesSummary(
      period as string, 
      startDate as string, 
      endDate as string
    );
    
    return res.status(200).json(summary);
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    return res.status(500).json({ error: 'Failed to fetch sales summary' });
  }
};

/**
 * @swagger
 * /api/analytics/inventory/status:
 *   get:
 *     summary: Get inventory status report
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: integer
 *         description: Filter by warehouse ID
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Filter for low stock items only
 *     responses:
 *       200:
 *         description: Inventory status data
 *       500:
 *         description: Server error
 */
export const getInventoryStatus = async (req: Request, res: Response) => {
  try {
    const { warehouseId, lowStock } = req.query;
    
    const status = await analyticsService.getInventoryStatus(
      warehouseId ? parseInt(warehouseId as string) : undefined,
      lowStock === 'true'
    );
    
    return res.status(200).json(status);
  } catch (error) {
    console.error('Error fetching inventory status:', error);
    return res.status(500).json({ error: 'Failed to fetch inventory status' });
  }
};

/**
 * @swagger
 * /api/analytics/customer/insights:
 *   get:
 *     summary: Get customer insights
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: segment
 *         schema:
 *           type: string
 *           enum: [vip, regular, new, all]
 *           default: all
 *         description: Filter by customer segment
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [30days, 90days, 6months, 1year]
 *           default: 90days
 *         description: Time period for analysis
 *     responses:
 *       200:
 *         description: Customer insights data
 *       500:
 *         description: Server error
 */
export const getCustomerInsights = async (req: Request, res: Response) => {
  try {
    const { segment = 'all', period = '90days' } = req.query;
    
    const insights = await analyticsService.getCustomerInsights(
      segment as string,
      period as string
    );
    
    return res.status(200).json(insights);
  } catch (error) {
    console.error('Error fetching customer insights:', error);
    return res.status(500).json({ error: 'Failed to fetch customer insights' });
  }
};

/**
 * @swagger
 * /api/analytics/product/performance:
 *   get:
 *     summary: Get product performance analytics
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [30days, 90days, 6months, 1year]
 *           default: 90days
 *         description: Time period for analysis
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of products to include
 *     responses:
 *       200:
 *         description: Product performance data
 *       500:
 *         description: Server error
 */
export const getProductPerformance = async (req: Request, res: Response) => {
  try {
    const { 
      period = '90days',
      category,
      limit = '10'
    } = req.query;
    
    const performance = await analyticsService.getProductPerformance(
      period as string,
      category as string,
      parseInt(limit as string)
    );
    
    return res.status(200).json(performance);
  } catch (error) {
    console.error('Error fetching product performance:', error);
    return res.status(500).json({ error: 'Failed to fetch product performance' });
  }
};

/**
 * @swagger
 * /api/analytics/campaign/effectiveness:
 *   get:
 *     summary: Get campaign effectiveness metrics
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: campaignId
 *         schema:
 *           type: integer
 *         description: Specific campaign ID to analyze
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for campaign analysis
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for campaign analysis
 *     responses:
 *       200:
 *         description: Campaign effectiveness data
 *       500:
 *         description: Server error
 */
export const getCampaignEffectiveness = async (req: Request, res: Response) => {
  try {
    const { campaignId, startDate, endDate } = req.query;
    
    const effectiveness = await analyticsService.getCampaignEffectiveness(
      campaignId ? parseInt(campaignId as string) : undefined,
      startDate as string,
      endDate as string
    );
    
    return res.status(200).json(effectiveness);
  } catch (error) {
    console.error('Error fetching campaign effectiveness:', error);
    return res.status(500).json({ error: 'Failed to fetch campaign effectiveness' });
  }
};

/**
 * @swagger
 * /api/analytics/shipping/performance:
 *   get:
 *     summary: Get shipping and delivery performance
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [30days, 90days, 6months, 1year]
 *           default: 90days
 *         description: Time period for analysis
 *       - in: query
 *         name: carrier
 *         schema:
 *           type: string
 *         description: Filter by shipping carrier
 *     responses:
 *       200:
 *         description: Shipping performance data
 *       500:
 *         description: Server error
 */
export const getShippingPerformance = async (req: Request, res: Response) => {
  try {
    const { period = '90days', carrier } = req.query;
    
    const performance = await analyticsService.getShippingPerformance(
      period as string,
      carrier as string
    );
    
    return res.status(200).json(performance);
  } catch (error) {
    console.error('Error fetching shipping performance:', error);
    return res.status(500).json({ error: 'Failed to fetch shipping performance' });
  }
};

/**
 * @swagger
 * /api/analytics/export/data:
 *   post:
 *     summary: Export analytics data to various formats
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportType
 *               - format
 *             properties:
 *               reportType:
 *                 type: string
 *                 enum: [sales, inventory, customer, product, campaign, shipping]
 *               format:
 *                 type: string
 *                 enum: [csv, excel, json, pdf]
 *               filters:
 *                 type: object
 *                 properties:
 *                   startDate:
 *                     type: string
 *                   endDate:
 *                     type: string
 *                   period:
 *                     type: string
 *                   category:
 *                     type: string
 *                   segment:
 *                     type: string
 *     responses:
 *       200:
 *         description: Analytics data export
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
export const exportAnalyticsData = async (req: Request, res: Response) => {
  try {
    const { reportType, format, filters } = req.body;
    
    if (!reportType || !format) {
      return res.status(400).json({ error: 'Report type and format are required' });
    }
    
    const exportData = await analyticsService.exportAnalyticsData(
      reportType,
      format,
      filters
    );
    
    // Format dosya adı
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${reportType}-report-${timestamp}.${format === 'excel' ? 'xlsx' : format}`;
    
    // Content-Type belirleme
    let contentType = 'application/json';
    switch (format) {
      case 'csv':
        contentType = 'text/csv';
        break;
      case 'excel':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'pdf':
        contentType = 'application/pdf';
        break;
    }
    
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', contentType);
    
    return res.status(200).send(exportData);
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    return res.status(500).json({ error: 'Failed to export analytics data' });
  }
};

/**
 * @swagger
 * /api/analytics/dashboard/data:
 *   get:
 *     summary: Get aggregated data for main dashboard
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, yesterday, thisWeek, thisMonth, lastMonth, thisYear]
 *           default: thisMonth
 *         description: Time period for dashboard data
 *     responses:
 *       200:
 *         description: Dashboard data
 *       500:
 *         description: Server error
 */
export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const { period = 'thisMonth' } = req.query;
    
    const dashboardData = await analyticsService.getDashboardData(period as string);
    
    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

/**
 * @swagger
 * /api/analytics/power-bi/data:
 *   get:
 *     summary: Get data for Power BI integration
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: dataset
 *         schema:
 *           type: string
 *           enum: [sales, inventory, customers, products, campaigns, shipping]
 *         description: Dataset type for Power BI
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for data range
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for data range
 *     responses:
 *       200:
 *         description: Data for Power BI
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
export const getPowerBIData = async (req: Request, res: Response) => {
  try {
    const { dataset, startDate, endDate } = req.query;
    
    if (!dataset) {
      return res.status(400).json({ error: 'Dataset type is required' });
    }
    
    const data = await analyticsService.getPowerBIData(
      dataset as string,
      startDate as string,
      endDate as string
    );
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching Power BI data:', error);
    return res.status(500).json({ error: 'Failed to fetch Power BI data' });
  }
};

/**
 * @swagger
 * /api/analytics/tableau/data:
 *   get:
 *     summary: Get data for Tableau integration
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: dataset
 *         schema:
 *           type: string
 *           enum: [sales, inventory, customers, products, campaigns, shipping]
 *         description: Dataset type for Tableau
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for data range
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for data range
 *     responses:
 *       200:
 *         description: Data for Tableau
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
export const getTableauData = async (req: Request, res: Response) => {
  try {
    const { dataset, startDate, endDate } = req.query;
    
    if (!dataset) {
      return res.status(400).json({ error: 'Dataset type is required' });
    }
    
    const data = await analyticsService.getTableauData(
      dataset as string,
      startDate as string,
      endDate as string
    );
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching Tableau data:', error);
    return res.status(500).json({ error: 'Failed to fetch Tableau data' });
  }
};

export default {
  getSalesSummary,
  getInventoryStatus,
  getCustomerInsights,
  getProductPerformance,
  getCampaignEffectiveness,
  getShippingPerformance,
  exportAnalyticsData,
  getDashboardData,
  getPowerBIData,
  getTableauData
}; 