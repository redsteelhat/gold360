import { Request, Response, NextFunction } from 'express';
import { DataAccessLog, AccessType } from '../models/dataAccessLog.model';

/**
 * Middleware to log data access events
 * 
 * @param entityType The type of entity being accessed (e.g., 'user', 'customer', 'order')
 * @param accessType The type of access performed (CREATE, READ, UPDATE, DELETE, EXPORT)
 * @param getEntityId A function to extract the entity ID from the request (defaults to req.params.id)
 * @param getDataSubjectId A function to extract the ID of the data subject (if different from entity ID)
 * @param accessDetails Additional details about the access
 * @param accessPurpose The purpose of the access (e.g., 'customer_support', 'administration')
 */
export const logDataAccess = (
  entityType: string,
  accessType: AccessType,
  options?: {
    getEntityId?: (req: Request) => number | null | undefined;
    getDataSubjectId?: (req: Request) => number | null | undefined;
    accessDetails?: string | ((req: Request) => string | undefined);
    accessPurpose?: string;
  }
) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // Call next immediately to avoid blocking the request
    next();

    try {
      // Only log if user is authenticated
      if (!req.user?.id) {
        return;
      }

      // Extract entity ID using the provided function or default to params.id
      const entityId = options?.getEntityId 
        ? options.getEntityId(req) 
        : req.params.id ? parseInt(req.params.id, 10) : undefined;

      // Extract data subject ID
      const dataSubjectId = options?.getDataSubjectId 
        ? options.getDataSubjectId(req) 
        : undefined;

      // Extract access details
      const accessDetails = typeof options?.accessDetails === 'function'
        ? options.accessDetails(req)
        : options?.accessDetails;

      // Get IP address from request (considering potential proxies)
      const ipAddress = 
        req.headers['x-forwarded-for'] as string || 
        req.socket.remoteAddress || 
        'unknown';

      // Create the log entry
      await DataAccessLog.create({
        accessedBy: req.user.id,
        dataSubjectId,
        entityType,
        entityId,
        accessType,
        accessDetails,
        ipAddress,
        userAgent: req.headers['user-agent'],
        accessPurpose: options?.accessPurpose,
        wasSuccessful: true, // Since this middleware runs after the successful execution, assuming success
      });
    } catch (error) {
      // Just log the error but don't affect the response
      console.error('Failed to log data access:', error);
    }
  };
};

/**
 * Middleware to log failed data access attempts
 */
export const logFailedAccess = (
  entityType: string,
  accessType: AccessType,
  failureDetails: string
) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get user ID if available (might not be for unauthorized access)
      const userId = req.user?.id;

      // Get IP address
      const ipAddress = 
        req.headers['x-forwarded-for'] as string || 
        req.socket.remoteAddress || 
        'unknown';

      // Create log entry for the failed access
      await DataAccessLog.create({
        accessedBy: userId || 0, // Use 0 for unauthorized or unknown users
        entityType,
        accessType,
        accessDetails: failureDetails,
        ipAddress,
        userAgent: req.headers['user-agent'],
        wasSuccessful: false,
      });
    } catch (error) {
      console.error('Failed to log access failure:', error);
    }

    // Continue to the next middleware or route handler
    next();
  };
};

// Implementation is commented out as it's not currently used
// export const logSensitiveDataAccess = (
//   entityType: string,
//   accessType: AccessType,
//   options?: {
//     getEntityId?: (req: Request) => number | null | undefined;
//     getDataSubjectId?: (req: Request) => number | null | undefined;
//     accessDetails?: string | ((req: Request) => string | undefined);
//     accessPurpose?: string;
//   }
// ) => {
//   return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
//     // Implementation details
//   };
// }; 