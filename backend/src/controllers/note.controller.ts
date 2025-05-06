import { Request, Response } from 'express';
import { Note, NoteVisibility } from '../models/note.model';
import { User, UserRole } from '../models/user.model';
import { Op } from 'sequelize';
import { logger } from '../utils/logger';

/**
 * Get all notes with filtering and pagination
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getAllNotes = async (req: Request, res: Response) => {
  try {
    const {
      search,
      targetType,
      targetId,
      visibility,
      isPinned,
      priority,
      createdById,
      limit = 10,
      offset = 0,
      sortBy = 'updatedAt',
      sortOrder = 'DESC'
    } = req.query;

    // Current user ID from auth middleware
    const userId = req.user?.id;
    const userRole = req.user?.role as string | undefined;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Build the query options
    const query: any = {};
    const whereClause: any = {};

    // Apply filters if provided
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (targetType) {
      whereClause.targetType = targetType;
    }

    if (targetId) {
      whereClause.targetId = targetId;
    }

    // Handle visibility based on user role
    if (visibility) {
      whereClause.visibility = visibility;
    } else {
      // If no specific visibility is requested, apply visibility rules based on user role
      const visibilityConditions = [];
      
      // Private notes - only created by the user
      visibilityConditions.push({
        [Op.and]: [
          { visibility: NoteVisibility.PRIVATE },
          { createdById: userId }
        ]
      });
      
      // Team notes - for all team members
      visibilityConditions.push({
        visibility: NoteVisibility.TEAM
      });
      
      // Management notes - only for managers and admins
      if (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) {
        visibilityConditions.push({
          visibility: NoteVisibility.MANAGEMENT
        });
      }
      
      // All notes - visible to everyone
      visibilityConditions.push({
        visibility: NoteVisibility.ALL
      });
      
      whereClause[Op.or] = visibilityConditions;
    }

    if (isPinned !== undefined) {
      whereClause.isPinned = isPinned === 'true';
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (createdById) {
      whereClause.createdById = createdById;
    }

    query.where = whereClause;
    query.limit = Number(limit);
    query.offset = Number(offset);
    query.order = [[sortBy as string, sortOrder as string]];
    query.include = [{
      model: User,
      as: 'createdBy',
      attributes: ['id', 'firstName', 'lastName', 'email']
    }];

    // Execute the query
    const { count, rows } = await Note.findAndCountAll(query);

    return res.status(200).json({
      success: true,
      count,
      data: rows,
      pagination: {
        totalItems: count,
        limit: Number(limit),
        currentPage: Math.floor(Number(offset) / Number(limit)) + 1,
        totalPages: Math.ceil(count / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error getting notes:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get notes',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get a note by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getNoteById = async (req: Request, res: Response) => {
  try {
    const noteId = Number(req.params.id);
    const userId = req.user?.id;
    const userRole = req.user?.role as string | undefined;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Find the note
    const note = await Note.findByPk(noteId, {
      include: [{
        model: User,
        as: 'createdBy',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check visibility permissions
    if (
      (note.visibility === NoteVisibility.PRIVATE && note.createdById !== userId) ||
      (note.visibility === NoteVisibility.MANAGEMENT && 
       userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER)
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this note'
      });
    }

    return res.status(200).json({
      success: true,
      data: note
    });
  } catch (error) {
    logger.error('Error getting note:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get note',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Create a new note
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const createNote = async (req: Request, res: Response) => {
  try {
    const {
      title,
      content,
      targetType,
      targetId,
      isPinned,
      color,
      visibility,
      priority,
      tags,
      reminderDate
    } = req.body;

    // Get the current user ID
    const createdById = req.user?.id;

    if (!createdById) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Validate required fields
    if (!title || !content || !targetType) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and target type are required fields'
      });
    }

    // Create the note
    const note = await Note.create({
      title,
      content,
      createdById,
      targetType,
      targetId: targetId || null,
      isPinned: isPinned || false,
      color: color || null,
      visibility: visibility || NoteVisibility.PRIVATE,
      priority,
      tags: tags || [],
      reminderDate: reminderDate || null
    });

    // Fetch the created note with user data
    const createdNote = await Note.findByPk(note.id, {
      include: [{
        model: User,
        as: 'createdBy',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    return res.status(201).json({
      success: true,
      data: createdNote,
      message: 'Note created successfully'
    });
  } catch (error) {
    logger.error('Error creating note:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create note',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update a note by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const updateNote = async (req: Request, res: Response) => {
  try {
    const noteId = Number(req.params.id);
    const updateData = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role as string | undefined;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Find the note
    const note = await Note.findByPk(noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if user has permission to update the note
    if (note.createdById !== userId && userRole !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this note'
      });
    }

    // Update the note
    await note.update(updateData);

    // Fetch the updated note with user data
    const updatedNote = await Note.findByPk(noteId, {
      include: [{
        model: User,
        as: 'createdBy',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    return res.status(200).json({
      success: true,
      data: updatedNote,
      message: 'Note updated successfully'
    });
  } catch (error) {
    logger.error('Error updating note:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update note',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete a note by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const deleteNote = async (req: Request, res: Response) => {
  try {
    const noteId = Number(req.params.id);
    const userId = req.user?.id;
    const userRole = req.user?.role as string | undefined;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Find the note
    const note = await Note.findByPk(noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if user has permission to delete the note
    if (note.createdById !== userId && userRole !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this note'
      });
    }

    // Delete the note
    await note.destroy();

    return res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting note:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete note',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 