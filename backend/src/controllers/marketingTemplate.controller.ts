import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { MarketingTemplate, TemplateType, TemplateCategory } from '../models/marketingTemplate.model';
import { User } from '../models/user.model';

// Get all templates with filtering and pagination
export const getAllTemplates = async (req: Request, res: Response) => {
  try {
    const {
      search,
      type,
      category,
      active,
      limit = 10,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (type && Object.values(TemplateType).includes(type as TemplateType)) {
      filter.type = type;
    }
    
    if (category && Object.values(TemplateCategory).includes(category as TemplateCategory)) {
      filter.category = category;
    }

    if (active !== undefined) {
      filter.active = active === 'true';
    }

    if (search) {
      filter[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const templates = await MarketingTemplate.findAndCountAll({
      where: filter,
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      limit: Number(limit),
      offset: Number(offset),
      order: [[sortBy as string, sortOrder as string]]
    });

    return res.status(200).json({
      total: templates.count,
      templates: templates.rows,
      limit: Number(limit),
      offset: Number(offset),
      totalPages: Math.ceil(templates.count / Number(limit))
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    return res.status(500).json({
      message: 'Server error while fetching templates',
      error: (error as Error).message
    });
  }
};

// Get a template by ID
export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id);
    
    if (isNaN(templateId)) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }

    const template = await MarketingTemplate.findByPk(templateId, {
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    return res.status(200).json(template);
  } catch (error) {
    console.error(`Error getting template ID ${req.params.id}:`, error);
    return res.status(500).json({
      message: 'Server error while fetching template',
      error: (error as Error).message
    });
  }
};

// Create a new template
export const createTemplate = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      type,
      category,
      content,
      subject,
      variables,
      attachments,
      imageUrls,
      metadata,
      tags,
      active
    } = req.body;

    // Validate required fields
    if (!name || !type || !content) {
      return res.status(400).json({ message: 'Name, type, and content are required' });
    }

    // Validate template type
    if (!Object.values(TemplateType).includes(type)) {
      return res.status(400).json({ message: 'Invalid template type' });
    }

    // Validate category if provided
    if (category && !Object.values(TemplateCategory).includes(category)) {
      return res.status(400).json({ message: 'Invalid template category' });
    }

    // Create the template
    const template = await MarketingTemplate.create({
      name,
      description,
      type,
      category: category || TemplateCategory.OTHER,
      content,
      subject,
      variables,
      attachments,
      imageUrls,
      createdById: req.user?.id,
      active: active !== undefined ? active : true,
      metadata,
      tags
    });

    return res.status(201).json({
      message: 'Template created successfully',
      template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    return res.status(500).json({
      message: 'Server error while creating template',
      error: (error as Error).message
    });
  }
};

// Update a template
export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id);
    
    if (isNaN(templateId)) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }

    const {
      name,
      description,
      type,
      category,
      content,
      subject,
      variables,
      attachments,
      imageUrls,
      metadata,
      tags,
      active
    } = req.body;

    // Find the template
    const template = await MarketingTemplate.findByPk(templateId);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Update the template
    await template.update({
      name: name || template.name,
      description: description !== undefined ? description : template.description,
      type: type || template.type,
      category: category || template.category,
      content: content || template.content,
      subject: subject !== undefined ? subject : template.subject,
      variables: variables || template.variables,
      attachments: attachments || template.attachments,
      imageUrls: imageUrls || template.imageUrls,
      active: active !== undefined ? active : template.active,
      metadata: metadata || template.metadata,
      tags: tags || template.tags
    });

    return res.status(200).json({
      message: 'Template updated successfully',
      template
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return res.status(500).json({
      message: 'Server error while updating template',
      error: (error as Error).message
    });
  }
};

// Delete a template
export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id);
    
    if (isNaN(templateId)) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }

    const template = await MarketingTemplate.findByPk(templateId);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Soft delete (paranoid is true for this model)
    await template.destroy();

    return res.status(200).json({
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return res.status(500).json({
      message: 'Server error while deleting template',
      error: (error as Error).message
    });
  }
};

// Clone a template
export const cloneTemplate = async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id);
    
    if (isNaN(templateId)) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }

    const template = await MarketingTemplate.findByPk(templateId);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Create a new template based on the existing one
    const clonedTemplate = await MarketingTemplate.create({
      name: `${template.name} (Copy)`,
      description: template.description,
      type: template.type,
      category: template.category,
      content: template.content,
      subject: template.subject,
      variables: template.variables,
      attachments: template.attachments,
      imageUrls: template.imageUrls,
      createdById: req.user?.id,
      active: true,
      metadata: template.metadata,
      tags: template.tags
    });

    return res.status(201).json({
      message: 'Template cloned successfully',
      template: clonedTemplate
    });
  } catch (error) {
    console.error('Error cloning template:', error);
    return res.status(500).json({
      message: 'Server error while cloning template',
      error: (error as Error).message
    });
  }
}; 