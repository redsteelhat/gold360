import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { registerConsent } from '../middlewares/dataConsent.middleware';
import { logDataAccess } from '../middlewares/dataAccessLog.middleware';
import { dataRequestController, consentController, dataBreachController } from '../controllers/security.controller';
import { UserRole } from '../models/user.model';
import { AccessType } from '../models/dataAccessLog.model';

const router = express.Router();

/**
 * Data Subject Request Routes (GDPR/KVKK)
 */
// Create a new data subject request
router.post(
  '/requests',
  authenticate,
  logDataAccess('data_request', AccessType.CREATE),
  dataRequestController.createRequest
);

// Get a specific data request
router.get(
  '/requests/:id',
  authenticate,
  logDataAccess('data_request', AccessType.READ),
  dataRequestController.getRequest
);

// List data requests (for admins/managers, or user's own requests)
router.get(
  '/requests',
  authenticate,
  logDataAccess('data_request', AccessType.READ),
  dataRequestController.listRequests
);

// Update request status (admin/manager only)
router.put(
  '/requests/:id/status',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  logDataAccess('data_request', AccessType.UPDATE),
  dataRequestController.updateRequestStatus
);

/**
 * Data Privacy Consent Routes
 */
// Get user consents
router.get(
  '/consents/:userId?',
  authenticate,
  logDataAccess('data_privacy', AccessType.READ),
  consentController.getUserConsents
);

// Update user consent
router.post(
  '/consents/:userId?',
  authenticate,
  logDataAccess('data_privacy', AccessType.UPDATE),
  consentController.updateUserConsent
);

// Register consent (dedicated endpoint)
router.post(
  '/consent',
  authenticate,
  logDataAccess('data_privacy', AccessType.CREATE),
  registerConsent
);

/**
 * Data Breach Routes (admin/manager only)
 */
// Report a new data breach
router.post(
  '/breaches',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  logDataAccess('data_breach', AccessType.CREATE),
  dataBreachController.reportBreach
);

// List data breaches
router.get(
  '/breaches',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  logDataAccess('data_breach', AccessType.READ),
  dataBreachController.listBreaches
);

// Get breach details
router.get(
  '/breaches/:id',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  logDataAccess('data_breach', AccessType.READ),
  dataBreachController.getBreachDetails
);

// Update a breach
router.put(
  '/breaches/:id',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  logDataAccess('data_breach', AccessType.UPDATE),
  dataBreachController.updateBreach
);

export default router; 