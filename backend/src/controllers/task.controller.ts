import { Request, Response } from 'express';
import { Task, TaskStatus, TaskPriority } from '../models/task.model';
import { User } from '../models/user.model';
import { Op } from 'sequelize';

// Create a fallback logger in case the module is not found
const logger = (() => {
  try {
    return require('../utils/logger').logger;
  } catch (error) {
    // Fallback to console logging if the logger module is not found
    return {
      error: (message: string, error?: any) => console.error(message, error),
      info: (message: string) => console.info(message),
      warn: (message: string) => console.warn(message),
      debug: (message: string) => console.debug(message)
    };
  }
})();

/**
 * Get all tasks with filtering and pagination
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const {
      search,
      status,
      priority,
      category,
      assignedToId,
      dueFrom,
      dueTo,
      limit = 10,
      offset = 0,
      sortBy = 'dueDate',
      sortOrder = 'ASC'
    } = req.query;

    // Build the query options
    const query: any = {};
    const whereClause: any = {};

    // Apply filters if provided
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (category) {
      whereClause.category = category;
    }

    if (assignedToId) {
      whereClause.assignedToId = assignedToId;
    }

    // Date range filtering
    if (dueFrom || dueTo) {
      whereClause.dueDate = {};
      if (dueFrom) {
        whereClause.dueDate[Op.gte] = new Date(dueFrom as string);
      }
      if (dueTo) {
        whereClause.dueDate[Op.lte] = new Date(dueTo as string);
      }
    }

    query.where = whereClause;
    query.limit = Number(limit);
    query.offset = Number(offset);
    query.order = [[sortBy as string, sortOrder as string]];

    // Include associated user data
    query.include = [
      {
        model: User,
        as: 'assignedTo',
        attributes: ['id', 'firstName', 'lastName', 'email', 'role']
      },
      {
        model: User,
        as: 'assignedBy',
        attributes: ['id', 'firstName', 'lastName', 'email', 'role']
      }
    ];

    // Execute the query
    const { count, rows } = await Task.findAndCountAll(query);

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
    logger.error('Error getting tasks:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get tasks',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get a task by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.id);

    const task = await Task.findByPk(taskId, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        },
        {
          model: User,
          as: 'assignedBy',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        },
        {
          model: Task,
          as: 'subtasks',
          include: [
            {
              model: User,
              as: 'assignedTo',
              attributes: ['id', 'firstName', 'lastName']
            }
          ]
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    logger.error('Error getting task:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get task',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Create a new task
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const createTask = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      dueDate,
      priority,
      category,
      assignedToId,
      reminderDate,
      recurrence,
      parentTaskId,
      tags,
      attachments,
      notes
    } = req.body;

    // Get the current user ID (assuming it's set in the request by auth middleware)
    const assignedById = req.user?.id;

    if (!assignedById) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Validate required fields
    if (!title || !description || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and due date are required fields'
      });
    }

    // Create the task
    const task = await Task.create({
      title,
      description,
      dueDate,
      priority: priority || TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      category,
      assignedToId,
      assignedById,
      reminderDate,
      recurrence,
      parentTaskId,
      tags: tags || [],
      attachments: attachments || [],
      notes: notes || ''
    });

    // Fetch the created task with related data
    const createdTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        },
        {
          model: User,
          as: 'assignedBy',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        }
      ]
    });

    return res.status(201).json({
      success: true,
      data: createdTask,
      message: 'Task created successfully'
    });
  } catch (error) {
    logger.error('Error creating task:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update a task by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const updateTask = async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.id);
    const updateData = req.body;

    // Find the task
    const task = await Task.findByPk(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if the status is being changed to completed
    if (updateData.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    // Update the task
    await task.update(updateData);

    // Fetch the updated task with related data
    const updatedTask = await Task.findByPk(taskId, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        },
        {
          model: User,
          as: 'assignedBy',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        }
      ]
    });

    return res.status(200).json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully'
    });
  } catch (error) {
    logger.error('Error updating task:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete a task by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.id);

    // Find the task
    const task = await Task.findByPk(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if there are subtasks
    const subtasks = await Task.count({
      where: { parentTaskId: taskId }
    });

    if (subtasks > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a task with subtasks. Delete subtasks first or reassign them.'
      });
    }

    // Delete the task
    await task.destroy();

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting task:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 