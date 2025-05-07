import { Request, Response } from 'express';
import { Shift, ShiftStatus } from '../models/shift.model';
import { User, UserRole } from '../models/user.model';
import { Op } from 'sequelize';
import { logger } from '../utils/logger';

/**
 * Get all shifts with filtering and pagination
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getAllShifts = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      type,
      status,
      startFrom,
      startTo,
      isOvertime,
      locationId,
      limit = 10,
      offset = 0,
      sortBy = 'startTime',
      sortOrder = 'DESC'
    } = req.query;

    // Build the query options
    const query: any = {};
    const whereClause: any = {};

    // Apply filters if provided
    if (userId) {
      whereClause.userId = userId;
    }

    if (type) {
      whereClause.type = type;
    }

    if (status) {
      whereClause.status = status;
    }

    // Date range filtering for start time
    if (startFrom || startTo) {
      whereClause.startTime = {};
      if (startFrom) {
        whereClause.startTime[Op.gte] = new Date(startFrom as string);
      }
      if (startTo) {
        whereClause.startTime[Op.lte] = new Date(startTo as string);
      }
    }

    if (isOvertime !== undefined) {
      whereClause.isOvertime = isOvertime === 'true';
    }

    if (locationId) {
      whereClause.locationId = locationId;
    }

    query.where = whereClause;
    query.limit = Number(limit);
    query.offset = Number(offset);
    query.order = [[sortBy as string, sortOrder as string]];

    // Include associated user data
    query.include = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'role']
      },
      {
        model: User,
        as: 'createdBy',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ];

    // Execute the query
    const { count, rows } = await Shift.findAndCountAll(query);

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
    logger.error('Error getting shifts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get shifts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get a shift by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getShiftById = async (req: Request, res: Response) => {
  try {
    const shiftId = Number(req.params.id);

    const shift = await Shift.findByPk(shiftId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: shift
    });
  } catch (error) {
    logger.error('Error getting shift:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get shift',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Create a new shift
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const createShift = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      type,
      startTime,
      endTime,
      breakDuration,
      notes,
      status,
      isOvertime,
      locationId
    } = req.body;

    // Get the current user ID (creator)
    const createdById = req.user?.id;
    const userRole = req.user?.role as string | undefined;

    if (!createdById) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Validate required fields
    if (!userId || !type || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'User ID, shift type, start time, and end time are required fields'
      });
    }

    // Validate time range
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Check if the creating user has the right to assign shifts
    // Only managers and admins can assign shifts to other users
    if (userId !== createdById && 
        userRole !== UserRole.ADMIN && 
        userRole !== UserRole.MANAGER) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to assign shifts to other users'
      });
    }

    // Check for overlapping shifts for the same user
    const overlappingShift = await Shift.findOne({
      where: {
        userId,
        [Op.or]: [
          {
            startTime: {
              [Op.lt]: end
            },
            endTime: {
              [Op.gt]: start
            }
          }
        ],
        status: {
          [Op.ne]: ShiftStatus.CANCELLED
        }
      }
    });

    if (overlappingShift) {
      return res.status(400).json({
        success: false,
        message: 'This shift overlaps with an existing shift for this user'
      });
    }

    // Create the shift
    const shift = await Shift.create({
      userId,
      type,
      startTime,
      endTime,
      breakDuration: breakDuration || 0,
      notes: notes || '',
      status: status || ShiftStatus.SCHEDULED,
      isOvertime: isOvertime || false,
      locationId: locationId || null,
      createdById
    });

    // Fetch the created shift with related data
    const createdShift = await Shift.findByPk(shift.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    return res.status(201).json({
      success: true,
      data: createdShift,
      message: 'Shift created successfully'
    });
  } catch (error) {
    logger.error('Error creating shift:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create shift',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update a shift by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const updateShift = async (req: Request, res: Response) => {
  try {
    const shiftId = Number(req.params.id);
    const updateData = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role as string | undefined;

    // Find the shift
    const shift = await Shift.findByPk(shiftId);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    // Check if user has permission to update the shift
    // Only the employee assigned to the shift, the shift creator, managers, and admins can update shifts
    if (shift.userId !== userId && 
        shift.createdById !== userId && 
        userRole !== UserRole.ADMIN && 
        userRole !== UserRole.MANAGER) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this shift'
      });
    }

    // Check if the update includes time changes and validate
    if (updateData.startTime || updateData.endTime) {
      const start = new Date(updateData.startTime || shift.startTime);
      const end = new Date(updateData.endTime || shift.endTime);

      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time'
        });
      }

      // Check for overlapping shifts if timeframe is changed
      if (updateData.startTime || updateData.endTime) {
        const overlappingShift = await Shift.findOne({
          where: {
            userId: updateData.userId || shift.userId,
            id: {
              [Op.ne]: shiftId // Exclude current shift
            },
            [Op.or]: [
              {
                startTime: {
                  [Op.lt]: end
                },
                endTime: {
                  [Op.gt]: start
                }
              }
            ],
            status: {
              [Op.ne]: ShiftStatus.CANCELLED
            }
          }
        });

        if (overlappingShift) {
          return res.status(400).json({
            success: false,
            message: 'This shift would overlap with an existing shift for this user'
          });
        }
      }
    }

    // Update the shift
    await shift.update(updateData);

    // Fetch the updated shift with related data
    const updatedShift = await Shift.findByPk(shiftId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    return res.status(200).json({
      success: true,
      data: updatedShift,
      message: 'Shift updated successfully'
    });
  } catch (error) {
    logger.error('Error updating shift:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update shift',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete a shift by ID (or cancel it)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const deleteShift = async (req: Request, res: Response) => {
  try {
    const shiftId = Number(req.params.id);
    const userId = req.user?.id;
    const userRole = req.user?.role as string | undefined;

    // Find the shift
    const shift = await Shift.findByPk(shiftId);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    // Check if user has permission to delete/cancel the shift
    if (shift.createdById !== userId && 
        userRole !== UserRole.ADMIN && 
        userRole !== UserRole.MANAGER) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this shift'
      });
    }

    // For past shifts, don't allow deletion, only cancellation
    const now = new Date();
    if (new Date(shift.startTime) < now) {
      // For past shifts, update status to cancelled instead of deleting
      await shift.update({ status: ShiftStatus.CANCELLED });
      
      return res.status(200).json({
        success: true,
        message: 'Shift cancelled successfully'
      });
    } else {
      // For future shifts, actually delete the record
      await shift.destroy();
      
      return res.status(200).json({
        success: true,
        message: 'Shift deleted successfully'
      });
    }
  } catch (error) {
    logger.error('Error deleting shift:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete shift',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 