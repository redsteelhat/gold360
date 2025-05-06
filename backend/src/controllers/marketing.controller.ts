import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { MarketingCampaign } from '../models/marketingCampaign.model';
import { MarketingCampaignRecipient } from '../models/marketingCampaignRecipient.model';

// Campaign CRUD operations
export const getAllCampaigns = async (req: Request, res: Response) => {
  try {
    const { 
      search, 
      type, 
      status, 
      limit = 10, 
      offset = 0, 
      sortBy = 'createdAt', 
      sortOrder = 'DESC' 
    } = req.query;
    
    const whereClause: any = {};
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;
    
    const campaigns = await MarketingCampaign.findAndCountAll({
      where: whereClause,
      limit: Number(limit),
      offset: Number(offset),
      order: [[sortBy as string, sortOrder as string]],
    });
    
    return res.status(200).json(campaigns);
  } catch (error) {
    console.error('Error getting campaigns:', error);
    return res.status(500).json({ message: 'Failed to get campaigns', error });
  }
};

export const getCampaignById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const campaign = await MarketingCampaign.findByPk(id);
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    return res.status(200).json(campaign);
  } catch (error) {
    console.error('Error getting campaign:', error);
    return res.status(500).json({ message: 'Failed to get campaign', error });
  }
};

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      type,
      startDate,
      endDate,
      audienceSegments,
      content,
      budget,
      isAutomated,
      automationTriggers,
      tags
    } = req.body;
    
    if (!name || !type || !content) {
      return res.status(400).json({ message: 'Name, type, and content are required' });
    }
    
    const campaign = await MarketingCampaign.create({
      name,
      description,
      type,
      status: 'draft',
      startDate,
      endDate,
      audienceSegments,
      content,
      budget,
      isAutomated,
      automationTriggers,
      tags,
      createdBy: req.user?.id || null
    });
    
    return res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    return res.status(500).json({ message: 'Failed to create campaign', error });
  }
};

export const updateCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    
    const campaign = await MarketingCampaign.findByPk(id);
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    // Some validation rules
    if (campaign.status === 'active' && updatedData.status === 'draft') {
      return res.status(400).json({ message: 'Cannot change an active campaign to draft' });
    }
    
    await campaign.update(updatedData);
    
    return res.status(200).json(campaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return res.status(500).json({ message: 'Failed to update campaign', error });
  }
};

export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const campaign = await MarketingCampaign.findByPk(id);
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    if (campaign.status === 'active') {
      return res.status(400).json({ message: 'Cannot delete an active campaign' });
    }
    
    await campaign.destroy();
    
    return res.status(200).json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return res.status(500).json({ message: 'Failed to delete campaign', error });
  }
};

// Campaign recipients
export const addCampaignRecipients = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { customerIds, segmentCriteria } = req.body;
    
    const campaign = await MarketingCampaign.findByPk(id);
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    // Handle recipient addition logic
    let recipients = [];
    
    if (customerIds && customerIds.length > 0) {
      recipients = customerIds.map((customerId: number) => ({
        campaignId: Number(id),
        customerId,
        status: 'pending',
      }));
    } else if (segmentCriteria) {
      // Process segment criteria to find matching customers
      // This would involve more complex querying based on the criteria
      // For now, this is a placeholder
    } else {
      return res.status(400).json({ message: 'Either customerIds or segmentCriteria must be provided' });
    }
    
    if (recipients.length > 0) {
      await MarketingCampaignRecipient.bulkCreate(recipients);
    }
    
    return res.status(200).json({ message: 'Recipients added successfully', count: recipients.length });
  } catch (error) {
    console.error('Error adding recipients:', error);
    return res.status(500).json({ message: 'Failed to add recipients', error });
  }
};

export const getCampaignRecipients = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, limit = 10, offset = 0 } = req.query;
    
    const campaign = await MarketingCampaign.findByPk(id);
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    const whereClause: any = { campaignId: id };
    if (status) whereClause.status = status;
    
    const recipients = await MarketingCampaignRecipient.findAndCountAll({
      where: whereClause,
      limit: Number(limit),
      offset: Number(offset),
    });
    
    return res.status(200).json(recipients);
  } catch (error) {
    console.error('Error getting recipients:', error);
    return res.status(500).json({ message: 'Failed to get recipients', error });
  }
};

// Campaign operations
export const launchCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const campaign = await MarketingCampaign.findByPk(id);
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    if (campaign.status !== 'draft' && campaign.status !== 'paused' && campaign.status !== 'scheduled') {
      return res.status(400).json({ message: `Cannot launch campaign with status: ${campaign.status}` });
    }
    
    // Check if there are recipients
    const recipientCount = await MarketingCampaignRecipient.count({ where: { campaignId: id } });
    
    if (recipientCount === 0) {
      return res.status(400).json({ message: 'Cannot launch campaign with no recipients' });
    }
    
    // Update campaign status
    await campaign.update({ status: 'active' });
    
    // Trigger the actual sending process (this would be implemented elsewhere)
    // For now, just a placeholder
    
    return res.status(200).json({ message: 'Campaign launched successfully', campaign });
  } catch (error) {
    console.error('Error launching campaign:', error);
    return res.status(500).json({ message: 'Failed to launch campaign', error });
  }
};

export const pauseCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const campaign = await MarketingCampaign.findByPk(id);
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    if (campaign.status !== 'active') {
      return res.status(400).json({ message: 'Only active campaigns can be paused' });
    }
    
    // Update campaign status
    await campaign.update({ status: 'paused' });
    
    return res.status(200).json({ message: 'Campaign paused successfully', campaign });
  } catch (error) {
    console.error('Error pausing campaign:', error);
    return res.status(500).json({ message: 'Failed to pause campaign', error });
  }
};

export const completeCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const campaign = await MarketingCampaign.findByPk(id);
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    if (campaign.status !== 'active' && campaign.status !== 'paused') {
      return res.status(400).json({ message: 'Only active or paused campaigns can be completed' });
    }
    
    // Update campaign status
    await campaign.update({ status: 'completed' });
    
    return res.status(200).json({ message: 'Campaign marked as completed', campaign });
  } catch (error) {
    console.error('Error completing campaign:', error);
    return res.status(500).json({ message: 'Failed to complete campaign', error });
  }
};

export const getCampaignPerformance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const campaign = await MarketingCampaign.findByPk(id);
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    // Calculate performance metrics
    const recipients = await MarketingCampaignRecipient.findAll({ where: { campaignId: id } });
    
    const totalRecipients = recipients.length;
    const deliveredCount = recipients.filter(r => r.status === 'delivered').length;
    const failedCount = recipients.filter(r => r.status === 'failed').length;
    const bouncedCount = recipients.filter(r => r.status === 'bounced').length;
    
    // For email campaigns, we would calculate opens, clicks, etc.
    // This is a simplified version
    
    const performanceMetrics = {
      totalRecipients,
      delivered: deliveredCount,
      deliveryRate: totalRecipients > 0 ? (deliveredCount / totalRecipients) * 100 : 0,
      failed: failedCount,
      bounced: bouncedCount,
      // Add more metrics as needed
    };
    
    return res.status(200).json(performanceMetrics);
  } catch (error) {
    console.error('Error getting campaign performance:', error);
    return res.status(500).json({ message: 'Failed to get performance metrics', error });
  }
}; 