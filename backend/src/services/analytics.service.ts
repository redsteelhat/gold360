import { PrismaClient } from '@prisma/client';
import { Order, Product, Customer, Campaign, Shipment, Inventory } from '../models';
import { QueryTypes } from 'sequelize';
import db from '../config/database';
import { format } from 'date-fns';

class AnalyticsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getSalesSummary(startDate: string, endDate: string, groupBy: string) {
    try {
      // Perform query based on groupBy parameter
      let query = '';
      if (groupBy === 'day') {
        query = `
          SELECT DATE(created_at) as date, SUM(total_amount) as revenue, COUNT(*) as order_count
          FROM orders
          WHERE created_at BETWEEN ? AND ?
          GROUP BY DATE(created_at)
          ORDER BY date
        `;
      } else if (groupBy === 'month') {
        query = `
          SELECT 
            EXTRACT(YEAR FROM created_at) as year,
            EXTRACT(MONTH FROM created_at) as month,
            SUM(total_amount) as revenue,
            COUNT(*) as order_count
          FROM orders
          WHERE created_at BETWEEN ? AND ?
          GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
          ORDER BY year, month
        `;
      } else {
        // Default to week
        query = `
          SELECT 
            DATE_TRUNC('week', created_at) as week_start,
            SUM(total_amount) as revenue,
            COUNT(*) as order_count
          FROM orders
          WHERE created_at BETWEEN ? AND ?
          GROUP BY week_start
          ORDER BY week_start
        `;
      }

      const results = await db.query(query, {
        replacements: [startDate, endDate],
        type: QueryTypes.SELECT
      });

      return results;
    } catch (error) {
      throw new Error(`Error fetching sales summary: ${error.message}`);
    }
  }

  async getInventoryStatus(warehouseId?: string) {
    try {
      let inventoryData;
      if (warehouseId) {
        inventoryData = await Inventory.findAll({
          where: { warehouseId },
          include: [{ model: Product }]
        });
      } else {
        inventoryData = await Inventory.findAll({
          include: [{ model: Product }]
        });
      }

      const results = inventoryData.map(item => ({
        productId: item.productId,
        productName: item.Product?.name,
        sku: item.Product?.sku,
        quantity: item.quantity,
        warehouseId: item.warehouseId,
        lowStockThreshold: item.Product?.lowStockThreshold,
        isLowStock: item.quantity < (item.Product?.lowStockThreshold || 10)
      }));

      return results;
    } catch (error) {
      throw new Error(`Error fetching inventory status: ${error.message}`);
    }
  }

  async getCustomerInsights(segment?: string) {
    try {
      const whereClause = segment ? { segment } : {};
      
      const customers = await Customer.findAll({
        where: whereClause,
        include: [{ model: Order }]
      });

      const insights = customers.map(customer => ({
        customerId: customer.id,
        fullName: customer.fullName,
        email: customer.email,
        segment: customer.segment,
        loyaltyPoints: customer.loyaltyPoints,
        totalSpent: customer.totalSpent,
        orderCount: customer.Orders?.length || 0,
        lastPurchaseDate: customer.lastPurchaseDate,
        lifetimeValue: customer.totalSpent,
        avgOrderValue: customer.Orders?.length ? customer.totalSpent / customer.Orders.length : 0
      }));

      return insights;
    } catch (error) {
      throw new Error(`Error fetching customer insights: ${error.message}`);
    }
  }

  async getProductPerformance(categoryId?: string, period?: string) {
    try {
      const whereClause = categoryId ? { categoryId } : {};
      
      // Define date range based on period
      let dateFilter = {};
      if (period) {
        const now = new Date();
        const startDate = new Date();
        
        if (period === '30days') {
          startDate.setDate(now.getDate() - 30);
        } else if (period === '90days') {
          startDate.setDate(now.getDate() - 90);
        } else if (period === '12months') {
          startDate.setMonth(now.getMonth() - 12);
        }
        
        dateFilter = {
          created_at: {
            $gte: startDate,
            $lte: now
          }
        };
      }
      
      // Complex query to get product performance data
      const query = `
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.sku,
          p.category_id,
          SUM(oi.quantity) as units_sold,
          SUM(oi.price * oi.quantity) as revenue,
          COUNT(DISTINCT o.id) as order_count
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE p.category_id ${categoryId ? '= ?' : 'IS NOT NULL'}
        ${period ? 'AND o.created_at >= ?' : ''}
        GROUP BY p.id, p.name, p.sku, p.category_id
        ORDER BY revenue DESC
      `;
      
      const replacements = [];
      if (categoryId) replacements.push(categoryId);
      if (period) {
        const now = new Date();
        const startDate = new Date();
        
        if (period === '30days') {
          startDate.setDate(now.getDate() - 30);
        } else if (period === '90days') {
          startDate.setDate(now.getDate() - 90);
        } else if (period === '12months') {
          startDate.setMonth(now.getMonth() - 12);
        }
        
        replacements.push(format(startDate, 'yyyy-MM-dd'));
      }
      
      const results = await db.query(query, {
        replacements,
        type: QueryTypes.SELECT
      });
      
      return results;
    } catch (error) {
      throw new Error(`Error fetching product performance: ${error.message}`);
    }
  }

  async getCampaignEffectiveness(campaignId?: string) {
    try {
      let whereClause = {};
      if (campaignId) {
        whereClause = { id: campaignId };
      }
      
      const campaigns = await Campaign.findAll({
        where: whereClause,
        include: [{ model: Order }]
      });
      
      const effectiveness = campaigns.map(campaign => {
        const totalOrders = campaign.Orders?.length || 0;
        const totalRevenue = campaign.Orders?.reduce((sum, order) => sum + order.totalAmount, 0) || 0;
        
        return {
          campaignId: campaign.id,
          name: campaign.name,
          type: campaign.type,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          budget: campaign.budget,
          totalOrders,
          totalRevenue,
          roi: campaign.budget > 0 ? ((totalRevenue - campaign.budget) / campaign.budget) * 100 : 0,
          costPerOrder: totalOrders > 0 ? campaign.budget / totalOrders : 0,
          conversionRate: campaign.impressions > 0 ? (totalOrders / campaign.impressions) * 100 : 0
        };
      });
      
      return effectiveness;
    } catch (error) {
      throw new Error(`Error fetching campaign effectiveness: ${error.message}`);
    }
  }

  async getShippingPerformance(carrierId?: string, period?: string) {
    try {
      let whereClause = {};
      if (carrierId) {
        whereClause = { carrierId };
      }
      
      // Add date filtering if period specified
      if (period) {
        const now = new Date();
        const startDate = new Date();
        
        if (period === '30days') {
          startDate.setDate(now.getDate() - 30);
        } else if (period === '90days') {
          startDate.setDate(now.getDate() - 90);
        } else if (period === '12months') {
          startDate.setMonth(now.getMonth() - 12);
        }
        
        whereClause = {
          ...whereClause,
          createdAt: {
            $gte: startDate,
            $lte: now
          }
        };
      }
      
      const shipments = await Shipment.findAll({
        where: whereClause,
        include: [{ model: Order }]
      });
      
      const metrics = {};
      
      shipments.forEach(shipment => {
        const carrier = shipment.carrierName || 'Unknown';
        
        if (!metrics[carrier]) {
          metrics[carrier] = {
            totalShipments: 0,
            onTimeDeliveries: 0,
            lateDeliveries: 0,
            averageDeliveryTime: 0,
            totalDeliveryTime: 0
          };
        }
        
        metrics[carrier].totalShipments++;
        
        if (shipment.actualDeliveryDate && shipment.estimatedDeliveryDate) {
          const actualDate = new Date(shipment.actualDeliveryDate);
          const estimatedDate = new Date(shipment.estimatedDeliveryDate);
          
          if (actualDate <= estimatedDate) {
            metrics[carrier].onTimeDeliveries++;
          } else {
            metrics[carrier].lateDeliveries++;
          }
          
          if (shipment.shippedDate) {
            const shippedDate = new Date(shipment.shippedDate);
            const deliveryTime = (actualDate.getTime() - shippedDate.getTime()) / (1000 * 60 * 60 * 24); // in days
            
            metrics[carrier].totalDeliveryTime += deliveryTime;
          }
        }
      });
      
      // Calculate averages and percentages
      Object.keys(metrics).forEach(carrier => {
        const carrierData = metrics[carrier];
        carrierData.onTimePercentage = (carrierData.onTimeDeliveries / carrierData.totalShipments) * 100;
        carrierData.averageDeliveryTime = carrierData.totalDeliveryTime / carrierData.totalShipments;
      });
      
      return Object.keys(metrics).map(carrier => ({
        carrier,
        ...metrics[carrier]
      }));
    } catch (error) {
      throw new Error(`Error fetching shipping performance: ${error.message}`);
    }
  }

  async exportData(type: string, startDate: string, endDate: string, format: string) {
    try {
      let data;
      
      switch (type) {
        case 'sales':
          data = await this.getSalesSummary(startDate, endDate, 'day');
          break;
        case 'inventory':
          data = await this.getInventoryStatus();
          break;
        case 'customers':
          data = await this.getCustomerInsights();
          break;
        case 'products':
          data = await this.getProductPerformance();
          break;
        case 'campaigns':
          data = await this.getCampaignEffectiveness();
          break;
        case 'shipping':
          data = await this.getShippingPerformance();
          break;
        default:
          throw new Error('Invalid export type specified');
      }
      
      // In a real implementation, we would format the data according to the requested format
      // For now, we just return the raw data
      return {
        data,
        format,
        exportedAt: new Date(),
        type
      };
    } catch (error) {
      throw new Error(`Error exporting data: ${error.message}`);
    }
  }

  async getDashboardData() {
    try {
      // Get current date and 30 days ago for queries
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get sales data for last 30 days
      const salesData = await this.getSalesSummary(
        format(thirtyDaysAgo, 'yyyy-MM-dd'),
        format(now, 'yyyy-MM-dd'),
        'day'
      );
      
      // Get inventory overview
      const inventoryData = await this.getInventoryStatus();
      
      // Get recent customer insights
      const customerData = await this.getCustomerInsights();
      
      // Get top performing products
      const productData = await this.getProductPerformance(
        undefined,
        '30days'
      );
      
      // Get active campaign performance
      const campaignData = await this.getCampaignEffectiveness();
      
      // Get shipping metrics
      const shippingData = await this.getShippingPerformance(
        undefined,
        '30days'
      );
      
      // Calculate aggregate metrics
      const totalRevenue = salesData.reduce((sum, day) => sum + parseFloat(day.revenue), 0);
      const totalOrders = salesData.reduce((sum, day) => sum + parseInt(day.order_count), 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      const lowStockItems = inventoryData.filter(item => item.isLowStock).length;
      const totalProducts = inventoryData.length;
      
      const totalCustomers = customerData.length;
      const newCustomers = customerData.filter(customer => {
        if (!customer.lastPurchaseDate) return false;
        const purchaseDate = new Date(customer.lastPurchaseDate);
        return purchaseDate >= thirtyDaysAgo && purchaseDate <= now;
      }).length;
      
      return {
        summary: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          lowStockItems,
          totalProducts,
          totalCustomers,
          newCustomers
        },
        salesTrend: salesData,
        topProducts: productData.slice(0, 5),
        activeCampaigns: campaignData.filter(campaign => {
          if (!campaign.endDate) return true;
          const endDate = new Date(campaign.endDate);
          return endDate >= now;
        }),
        shippingPerformance: shippingData
      };
    } catch (error) {
      throw new Error(`Error fetching dashboard data: ${error.message}`);
    }
  }

  async getPowerBIData(dataset: string) {
    try {
      // This would normally contain logic to format data specifically for Power BI integration
      let data;
      
      switch (dataset) {
        case 'sales':
          const now = new Date();
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          
          data = await this.getSalesSummary(
            format(oneYearAgo, 'yyyy-MM-dd'),
            format(now, 'yyyy-MM-dd'),
            'month'
          );
          break;
        case 'inventory':
          data = await this.getInventoryStatus();
          break;
        case 'customers':
          data = await this.getCustomerInsights();
          break;
        default:
          throw new Error('Invalid dataset requested for Power BI');
      }
      
      return {
        dataset,
        data,
        timestamp: new Date(),
        schema: this.generateDataSchema(dataset, data)
      };
    } catch (error) {
      throw new Error(`Error fetching Power BI data: ${error.message}`);
    }
  }

  async getTableauData(dataset: string) {
    try {
      // This would normally contain logic to format data specifically for Tableau integration
      let data;
      
      switch (dataset) {
        case 'sales':
          const now = new Date();
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          
          data = await this.getSalesSummary(
            format(oneYearAgo, 'yyyy-MM-dd'),
            format(now, 'yyyy-MM-dd'),
            'month'
          );
          break;
        case 'inventory':
          data = await this.getInventoryStatus();
          break;
        case 'customers':
          data = await this.getCustomerInsights();
          break;
        default:
          throw new Error('Invalid dataset requested for Tableau');
      }
      
      return {
        dataset,
        data,
        timestamp: new Date(),
        format: 'Tableau Data Extract'
      };
    } catch (error) {
      throw new Error(`Error fetching Tableau data: ${error.message}`);
    }
  }

  // Helper method to generate data schema for BI tools
  private generateDataSchema(dataset: string, data: any[]) {
    if (!data || data.length === 0) {
      return {};
    }
    
    const sample = data[0];
    const schema = {};
    
    Object.keys(sample).forEach(key => {
      let type = typeof sample[key];
      
      if (type === 'object') {
        if (sample[key] instanceof Date) {
          type = 'date';
        } else if (sample[key] === null) {
          type = 'null';
        }
      }
      
      schema[key] = { type };
    });
    
    return schema;
  }
}

export default new AnalyticsService(); 