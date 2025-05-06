import { Request, Response } from 'express';
import { DataRequest, RequestType, RequestStatus } from '../models/dataRequest.model';
import { DataPrivacy, ConsentType } from '../models/dataPrivacy.model';
import { DataBreachLog, BreachSeverity, BreachStatus } from '../models/dataBreachLog.model';
import { randomBytes } from 'crypto';
import { User, UserRole } from '../models/user.model';
import { Op } from 'sequelize';

/**
 * Controller for handling data subject requests (GDPR/KVKK)
 */
export const dataRequestController = {
  // Create a new data subject request
  createRequest: async (req: Request, res: Response): Promise<void> => {
    try {
      const { requestType, requestDetails } = req.body;

      if (!req.user?.id) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      // Validate request type
      if (!Object.values(RequestType).includes(requestType)) {
        res.status(400).json({ message: 'Invalid request type' });
        return;
      }

      // Generate a reference ID
      const referenceId = `REQ-${Date.now()}-${randomBytes(4).toString('hex')}`;

      // Get IP address from request
      const ipAddress = 
        req.headers['x-forwarded-for'] as string || 
        req.socket.remoteAddress || 
        'unknown';

      // Create the request
      const dataRequest = await DataRequest.create({
        userId: req.user.id,
        requestType,
        requestDetails,
        status: RequestStatus.PENDING,
        referenceId,
        ipAddress,
        userAgent: req.headers['user-agent'],
        userNotified: false,
      });

      res.status(201).json({
        message: 'Data request submitted successfully',
        referenceId,
        requestId: dataRequest.id,
      });
    } catch (error) {
      console.error('Error creating data request:', error);
      res.status(500).json({ message: 'Failed to create data request', error: (error as Error).message });
    }
  },

  // Get a specific data request
  getRequest: async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = parseInt(req.params.id, 10);

      // Get the request with user information
      const dataRequest = await DataRequest.findByPk(requestId, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] },
          { model: User, as: 'processedByUser', attributes: ['id', 'email', 'firstName', 'lastName'] },
        ],
      });

      if (!dataRequest) {
        res.status(404).json({ message: 'Data request not found' });
        return;
      }

      // Check if the user is accessing their own request or has admin/manager role
      if (
        dataRequest.userId !== req.user?.id &&
        req.user?.role !== UserRole.ADMIN &&
        req.user?.role !== UserRole.MANAGER
      ) {
        res.status(403).json({ message: 'You do not have permission to access this request' });
        return;
      }

      res.status(200).json(dataRequest);
    } catch (error) {
      console.error('Error fetching data request:', error);
      res.status(500).json({ message: 'Failed to fetch data request', error: (error as Error).message });
    }
  },

  // List data requests (for admins/managers, or a user's own requests)
  listRequests: async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, requestType } = req.query;
      const isAdmin = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.MANAGER;
      
      // Build filter conditions
      const where: any = {};
      
      // Normal users can only see their own requests
      if (!isAdmin) {
        where.userId = req.user?.id;
      }
      
      // Filter by status if provided
      if (status && Object.values(RequestStatus).includes(status as RequestStatus)) {
        where.status = status;
      }
      
      // Filter by request type if provided
      if (requestType && Object.values(RequestType).includes(requestType as RequestType)) {
        where.requestType = requestType;
      }
      
      // Include pagination parameters
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const offset = (page - 1) * limit;
      
      // Get the requests
      const dataRequests = await DataRequest.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] },
        ],
      });
      
      res.status(200).json({
        totalItems: dataRequests.count,
        requests: dataRequests.rows,
        totalPages: Math.ceil(dataRequests.count / limit),
        currentPage: page,
      });
    } catch (error) {
      console.error('Error listing data requests:', error);
      res.status(500).json({ message: 'Failed to list data requests', error: (error as Error).message });
    }
  },

  // Update the status of a data request (admin/manager only)
  updateRequestStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = parseInt(req.params.id, 10);
      const { status, rejectionReason } = req.body;

      // Check if user has appropriate role
      if (
        req.user?.role !== UserRole.ADMIN &&
        req.user?.role !== UserRole.MANAGER
      ) {
        res.status(403).json({ message: 'You do not have permission to update request status' });
        return;
      }

      // Validate status
      if (!Object.values(RequestStatus).includes(status)) {
        res.status(400).json({ message: 'Invalid status' });
        return;
      }

      // Find the request
      const dataRequest = await DataRequest.findByPk(requestId);

      if (!dataRequest) {
        res.status(404).json({ message: 'Data request not found' });
        return;
      }

      // Update the request
      const updateData: any = {
        status,
        processedBy: req.user.id,
      };

      // Add rejection reason if rejected
      if (status === RequestStatus.REJECTED) {
        if (!rejectionReason) {
          res.status(400).json({ message: 'Rejection reason is required when rejecting a request' });
          return;
        }
        updateData.rejectionReason = rejectionReason;
      }

      // Set completion date if completed or rejected
      if (status === RequestStatus.COMPLETED || status === RequestStatus.REJECTED) {
        updateData.completionDate = new Date();
      }

      await dataRequest.update(updateData);

      res.status(200).json({
        message: 'Request status updated successfully',
        request: dataRequest,
      });
    } catch (error) {
      console.error('Error updating request status:', error);
      res.status(500).json({ message: 'Failed to update request status', error: (error as Error).message });
    }
  },
};

/**
 * Controller for handling data privacy consent
 */
export const consentController = {
  // Get a user's consent settings
  getUserConsents: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId, 10) || req.user?.id;

      // Check if user is requesting their own consents or is admin/manager
      if (
        userId !== req.user?.id &&
        req.user?.role !== UserRole.ADMIN &&
        req.user?.role !== UserRole.MANAGER
      ) {
        res.status(403).json({ message: 'You do not have permission to access these consents' });
        return;
      }

      // Get all consents for the user
      const consents = await DataPrivacy.findAll({
        where: { userId },
        order: [['updatedAt', 'DESC']],
      });

      // Organize by consent type
      const consentByType: Record<string, any> = {};
      
      // Initialize all consent types with false (not consented)
      Object.values(ConsentType).forEach((type) => {
        consentByType[type] = {
          hasConsented: false,
          consentDate: null,
          consentVersion: null,
          lastUpdated: null,
        };
      });
      
      // Update with actual consent records
      consents.forEach((consent) => {
        if (consentByType[consent.consentType]) {
          consentByType[consent.consentType] = {
            hasConsented: consent.hasConsented,
            consentDate: consent.consentDate,
            consentVersion: consent.consentVersion,
            lastUpdated: consent.updatedAt,
          };
        }
      });

      res.status(200).json({
        userId,
        consents: consentByType,
      });
    } catch (error) {
      console.error('Error fetching user consents:', error);
      res.status(500).json({ message: 'Failed to fetch user consents', error: (error as Error).message });
    }
  },

  // Update a user's consent settings
  updateUserConsent: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId, 10) || req.user?.id;
      const { consentType, hasConsented, version, details } = req.body;

      // Check if user is updating their own consents or is admin/manager
      if (
        userId !== req.user?.id &&
        req.user?.role !== UserRole.ADMIN &&
        req.user?.role !== UserRole.MANAGER
      ) {
        res.status(403).json({ message: 'You do not have permission to update these consents' });
        return;
      }

      // Validate consent type
      if (!Object.values(ConsentType).includes(consentType)) {
        res.status(400).json({ message: 'Invalid consent type' });
        return;
      }

      // Get IP address from request
      const ipAddress = 
        req.headers['x-forwarded-for'] as string || 
        req.socket.remoteAddress || 
        'unknown';

      // Check if a consent record already exists
      let consent = await DataPrivacy.findOne({
        where: {
          userId,
          consentType,
        },
      });

      // Prepare consent data
      const consentData = {
        userId,
        consentType,
        hasConsented: !!hasConsented,
        consentDate: new Date(),
        consentVersion: version || '1.0',
        consentDetails: details,
        ipAddress,
        isActive: !!hasConsented,
        consentWithdrawnDate: !hasConsented ? new Date() : null,
      };

      // Update or create consent record
      if (consent) {
        await consent.update(consentData);
      } else {
        consent = await DataPrivacy.create(consentData);
      }

      res.status(200).json({
        message: 'Consent updated successfully',
        consent,
      });
    } catch (error) {
      console.error('Error updating consent:', error);
      res.status(500).json({ message: 'Failed to update consent', error: (error as Error).message });
    }
  },
};

/**
 * Controller for handling data breach logging and reporting
 */
export const dataBreachController = {
  // Report a new data breach (admin/manager only)
  reportBreach: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        breachTitle,
        breachDescription,
        occurrenceDate,
        severity,
        affectedData,
        affectedUsersCount,
        mitigationSteps,
      } = req.body;

      // Check if user has appropriate role
      if (
        req.user?.role !== UserRole.ADMIN &&
        req.user?.role !== UserRole.MANAGER
      ) {
        res.status(403).json({ message: 'You do not have permission to report a data breach' });
        return;
      }

      // Validate required fields
      if (!breachTitle || !breachDescription || !severity) {
        res.status(400).json({ message: 'Title, description, and severity are required' });
        return;
      }

      // Validate severity
      if (!Object.values(BreachSeverity).includes(severity)) {
        res.status(400).json({ message: 'Invalid severity level' });
        return;
      }

      // Create the breach record
      const breach = await DataBreachLog.create({
        breachTitle,
        breachDescription,
        detectionDate: new Date(),
        occurrenceDate: occurrenceDate ? new Date(occurrenceDate) : null,
        severity,
        status: BreachStatus.DETECTED,
        affectedData,
        affectedUsersCount,
        mitigationSteps,
        authorityNotified: false,
        usersNotified: false,
        reportedBy: req.user.id,
      });

      res.status(201).json({
        message: 'Data breach reported successfully',
        breach,
      });
    } catch (error) {
      console.error('Error reporting data breach:', error);
      res.status(500).json({ message: 'Failed to report data breach', error: (error as Error).message });
    }
  },

  // List data breaches (admin/manager only)
  listBreaches: async (req: Request, res: Response): Promise<void> => {
    try {
      // Check if user has appropriate role
      if (
        req.user?.role !== UserRole.ADMIN &&
        req.user?.role !== UserRole.MANAGER
      ) {
        res.status(403).json({ message: 'You do not have permission to view data breaches' });
        return;
      }

      // Build filter conditions
      const where: any = {};
      
      // Filter by status if provided
      if (req.query.status && Object.values(BreachStatus).includes(req.query.status as BreachStatus)) {
        where.status = req.query.status;
      }
      
      // Filter by severity if provided
      if (req.query.severity && Object.values(BreachSeverity).includes(req.query.severity as BreachSeverity)) {
        where.severity = req.query.severity;
      }
      
      // Filter by date range if provided
      if (req.query.startDate && req.query.endDate) {
        where.detectionDate = {
          [Op.between]: [new Date(req.query.startDate as string), new Date(req.query.endDate as string)],
        };
      }
      
      // Include pagination parameters
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const offset = (page - 1) * limit;
      
      // Get the breaches
      const breaches = await DataBreachLog.findAndCountAll({
        where,
        limit,
        offset,
        order: [['detectionDate', 'DESC']],
        include: [
          { model: User, as: 'reportedByUser', attributes: ['id', 'email', 'firstName', 'lastName'] },
          { model: User, as: 'assignedToUser', attributes: ['id', 'email', 'firstName', 'lastName'] },
        ],
      });
      
      res.status(200).json({
        totalItems: breaches.count,
        breaches: breaches.rows,
        totalPages: Math.ceil(breaches.count / limit),
        currentPage: page,
      });
    } catch (error) {
      console.error('Error listing data breaches:', error);
      res.status(500).json({ message: 'Failed to list data breaches', error: (error as Error).message });
    }
  },

  // Get details of a specific data breach (admin/manager only)
  getBreachDetails: async (req: Request, res: Response): Promise<void> => {
    try {
      const breachId = parseInt(req.params.id, 10);

      // Check if user has appropriate role
      if (
        req.user?.role !== UserRole.ADMIN &&
        req.user?.role !== UserRole.MANAGER
      ) {
        res.status(403).json({ message: 'You do not have permission to view data breach details' });
        return;
      }

      // Get the breach with related users
      const breach = await DataBreachLog.findByPk(breachId, {
        include: [
          { model: User, as: 'reportedByUser', attributes: ['id', 'email', 'firstName', 'lastName'] },
          { model: User, as: 'assignedToUser', attributes: ['id', 'email', 'firstName', 'lastName'] },
        ],
      });

      if (!breach) {
        res.status(404).json({ message: 'Data breach not found' });
        return;
      }

      res.status(200).json(breach);
    } catch (error) {
      console.error('Error fetching data breach details:', error);
      res.status(500).json({ message: 'Failed to fetch data breach details', error: (error as Error).message });
    }
  },

  // Update a data breach (admin/manager only)
  updateBreach: async (req: Request, res: Response): Promise<void> => {
    try {
      const breachId = parseInt(req.params.id, 10);
      const {
        status,
        mitigationSteps,
        rootCauseAnalysis,
        preventiveMeasures,
        authorityNotified,
        authorityNotificationDate,
        usersNotified,
        userNotificationDate,
        assignedTo,
      } = req.body;

      // Check if user has appropriate role
      if (
        req.user?.role !== UserRole.ADMIN &&
        req.user?.role !== UserRole.MANAGER
      ) {
        res.status(403).json({ message: 'You do not have permission to update a data breach' });
        return;
      }

      // Validate status if provided
      if (status && !Object.values(BreachStatus).includes(status)) {
        res.status(400).json({ message: 'Invalid status' });
        return;
      }

      // Find the breach
      const breach = await DataBreachLog.findByPk(breachId);

      if (!breach) {
        res.status(404).json({ message: 'Data breach not found' });
        return;
      }

      // Prepare update data
      const updateData: any = {};
      
      if (status) updateData.status = status;
      if (mitigationSteps) updateData.mitigationSteps = mitigationSteps;
      if (rootCauseAnalysis) updateData.rootCauseAnalysis = rootCauseAnalysis;
      if (preventiveMeasures) updateData.preventiveMeasures = preventiveMeasures;
      
      if (authorityNotified !== undefined) {
        updateData.authorityNotified = authorityNotified;
        if (authorityNotified && !breach.authorityNotified) {
          updateData.authorityNotificationDate = new Date();
        } else if (authorityNotificationDate) {
          updateData.authorityNotificationDate = new Date(authorityNotificationDate);
        }
      }
      
      if (usersNotified !== undefined) {
        updateData.usersNotified = usersNotified;
        if (usersNotified && !breach.usersNotified) {
          updateData.userNotificationDate = new Date();
        } else if (userNotificationDate) {
          updateData.userNotificationDate = new Date(userNotificationDate);
        }
      }
      
      if (assignedTo) updateData.assignedTo = assignedTo;
      
      // Set resolution date if status is changing to RESOLVED
      if (status === BreachStatus.RESOLVED && breach.status !== BreachStatus.RESOLVED) {
        updateData.resolutionDate = new Date();
      }

      // Update the breach
      await breach.update(updateData);

      res.status(200).json({
        message: 'Data breach updated successfully',
        breach,
      });
    } catch (error) {
      console.error('Error updating data breach:', error);
      res.status(500).json({ message: 'Failed to update data breach', error: (error as Error).message });
    }
  },
}; 