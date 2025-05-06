import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../models/user.model';
import * as taskController from '../controllers/task.controller';
import * as shiftController from '../controllers/shift.controller';
import * as noteController from '../controllers/note.controller';

const router = express.Router();

// Task routes
/**
 * @swagger
 * /api/operational/tasks:
 *   get:
 *     summary: Get all tasks with filtering and pagination
 *     tags: [Operational Tools - Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled, blocked]
 *         description: Filter by task status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by task priority
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by task category
 *       - in: query
 *         name: assignedToId
 *         schema:
 *           type: integer
 *         description: Filter by assigned user ID
 *       - in: query
 *         name: dueFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tasks due from this date
 *       - in: query
 *         name: dueTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tasks due to this date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of tasks to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of tasks to skip
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: dueDate
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: ASC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of tasks
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/tasks', authenticate, taskController.getAllTasks);

/**
 * @swagger
 * /api/operational/tasks/{id}:
 *   get:
 *     summary: Get a task by ID
 *     tags: [Operational Tools - Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get('/tasks/:id', authenticate, taskController.getTaskById);

/**
 * @swagger
 * /api/operational/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Operational Tools - Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - dueDate
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               category:
 *                 type: string
 *                 enum: [inventory, sales, customer, marketing, administrative, finance, other]
 *               assignedToId:
 *                 type: integer
 *               reminderDate:
 *                 type: string
 *                 format: date-time
 *               recurrence:
 *                 type: string
 *               parentTaskId:
 *                 type: integer
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/tasks', authenticate, taskController.createTask);

/**
 * @swagger
 * /api/operational/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Operational Tools - Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, cancelled, blocked]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               category:
 *                 type: string
 *               assignedToId:
 *                 type: integer
 *               reminderDate:
 *                 type: string
 *                 format: date-time
 *               recurrence:
 *                 type: string
 *               parentTaskId:
 *                 type: integer
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.put('/tasks/:id', authenticate, taskController.updateTask);

/**
 * @swagger
 * /api/operational/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Operational Tools - Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.delete('/tasks/:id', authenticate, taskController.deleteTask);

// Shift routes
/**
 * @swagger
 * /api/operational/shifts:
 *   get:
 *     summary: Get all shifts with filtering and pagination
 *     tags: [Operational Tools - Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [morning, afternoon, evening, night, full_day, custom]
 *         description: Filter by shift type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, active, completed, cancelled]
 *         description: Filter by shift status
 *       - in: query
 *         name: startFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter shifts starting from this date
 *       - in: query
 *         name: startTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter shifts starting to this date
 *       - in: query
 *         name: isOvertime
 *         schema:
 *           type: boolean
 *         description: Filter by overtime status
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: integer
 *         description: Filter by location ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of shifts to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of shifts to skip
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: startTime
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of shifts
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/shifts', authenticate, shiftController.getAllShifts);

/**
 * @swagger
 * /api/operational/shifts/{id}:
 *   get:
 *     summary: Get a shift by ID
 *     tags: [Operational Tools - Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shift ID
 *     responses:
 *       200:
 *         description: Shift details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shift not found
 *       500:
 *         description: Server error
 */
router.get('/shifts/:id', authenticate, shiftController.getShiftById);

/**
 * @swagger
 * /api/operational/shifts:
 *   post:
 *     summary: Create a new shift
 *     tags: [Operational Tools - Shifts]
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
 *               - type
 *               - startTime
 *               - endTime
 *             properties:
 *               userId:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [morning, afternoon, evening, night, full_day, custom]
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               breakDuration:
 *                 type: integer
 *                 description: Break duration in minutes
 *               notes:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [scheduled, active, completed, cancelled]
 *               isOvertime:
 *                 type: boolean
 *               locationId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Shift created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - No permission to create shifts for others
 *       500:
 *         description: Server error
 */
router.post('/shifts', authenticate, shiftController.createShift);

/**
 * @swagger
 * /api/operational/shifts/{id}:
 *   put:
 *     summary: Update a shift
 *     tags: [Operational Tools - Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shift ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [morning, afternoon, evening, night, full_day, custom]
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               breakDuration:
 *                 type: integer
 *               notes:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [scheduled, active, completed, cancelled]
 *               isOvertime:
 *                 type: boolean
 *               locationId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Shift updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - No permission to update this shift
 *       404:
 *         description: Shift not found
 *       500:
 *         description: Server error
 */
router.put('/shifts/:id', authenticate, shiftController.updateShift);

/**
 * @swagger
 * /api/operational/shifts/{id}:
 *   delete:
 *     summary: Delete or cancel a shift
 *     tags: [Operational Tools - Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shift ID
 *     responses:
 *       200:
 *         description: Shift deleted or cancelled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - No permission to delete this shift
 *       404:
 *         description: Shift not found
 *       500:
 *         description: Server error
 */
router.delete('/shifts/:id', authenticate, shiftController.deleteShift);

// Note routes
/**
 * @swagger
 * /api/operational/notes:
 *   get:
 *     summary: Get all notes with filtering and pagination
 *     tags: [Operational Tools - Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and content
 *       - in: query
 *         name: targetType
 *         schema:
 *           type: string
 *           enum: [customer, product, order, user, task, inventory, general]
 *         description: Filter by note target type
 *       - in: query
 *         name: targetId
 *         schema:
 *           type: integer
 *         description: Filter by target ID
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [private, team, management, all]
 *         description: Filter by note visibility
 *       - in: query
 *         name: isPinned
 *         schema:
 *           type: boolean
 *         description: Filter by pinned status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, normal, high]
 *         description: Filter by note priority
 *       - in: query
 *         name: createdById
 *         schema:
 *           type: integer
 *         description: Filter by creator user ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of notes to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of notes to skip
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: updatedAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of notes
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/notes', authenticate, noteController.getAllNotes);

/**
 * @swagger
 * /api/operational/notes/{id}:
 *   get:
 *     summary: Get a note by ID
 *     tags: [Operational Tools - Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Note ID
 *     responses:
 *       200:
 *         description: Note details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - No permission to view this note
 *       404:
 *         description: Note not found
 *       500:
 *         description: Server error
 */
router.get('/notes/:id', authenticate, noteController.getNoteById);

/**
 * @swagger
 * /api/operational/notes:
 *   post:
 *     summary: Create a new note
 *     tags: [Operational Tools - Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - targetType
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               targetType:
 *                 type: string
 *                 enum: [customer, product, order, user, task, inventory, general]
 *               targetId:
 *                 type: integer
 *               isPinned:
 *                 type: boolean
 *               color:
 *                 type: string
 *               visibility:
 *                 type: string
 *                 enum: [private, team, management, all]
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               reminderDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Note created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/notes', authenticate, noteController.createNote);

/**
 * @swagger
 * /api/operational/notes/{id}:
 *   put:
 *     summary: Update a note
 *     tags: [Operational Tools - Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               targetType:
 *                 type: string
 *                 enum: [customer, product, order, user, task, inventory, general]
 *               targetId:
 *                 type: integer
 *               isPinned:
 *                 type: boolean
 *               color:
 *                 type: string
 *               visibility:
 *                 type: string
 *                 enum: [private, team, management, all]
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               reminderDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Note updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - No permission to update this note
 *       404:
 *         description: Note not found
 *       500:
 *         description: Server error
 */
router.put('/notes/:id', authenticate, noteController.updateNote);

/**
 * @swagger
 * /api/operational/notes/{id}:
 *   delete:
 *     summary: Delete a note
 *     tags: [Operational Tools - Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Note ID
 *     responses:
 *       200:
 *         description: Note deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - No permission to delete this note
 *       404:
 *         description: Note not found
 *       500:
 *         description: Server error
 */
router.delete('/notes/:id', authenticate, noteController.deleteNote);

export default router; 