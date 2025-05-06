import { Request, Response, NextFunction } from 'express';
import { DataPrivacy, ConsentType } from '../models/dataPrivacy.model';

// Extend Express Request interface to include session property
declare global {
  namespace Express {
    interface Request {
      session?: {
        returnTo?: string;
        [key: string]: any;
      };
    }
  }
}

/**
 * Middleware to verify if a user has given consent for a specific type of data processing
 *
 * @param consentType The type of consent to check
 * @param getUserId A function to extract the user ID from the request (defaults to req.user.id)
 * @param redirectOnFailure If true, redirect to consent page instead of returning error
 */
export const verifyConsent = (
  consentType: ConsentType,
  options?: {
    getUserId?: (req: Request) => number;
    redirectOnFailure?: boolean;
  }
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get user ID from request or from provided function
      const userId = options?.getUserId 
        ? options.getUserId(req) 
        : req.user?.id;

      // If no user ID is available, cannot check consent
      if (!userId) {
        res.status(401).json({ message: 'Authentication required to check consent' });
        return;
      }

      // Check if user has given consent for this type of data processing
      const consent = await DataPrivacy.findOne({
        where: {
          userId,
          consentType,
          hasConsented: true,
          isActive: true,
        },
      });

      // If consent exists and is active, proceed
      if (consent) {
        next();
        return;
      }

      // If consent doesn't exist or isn't active, handle according to options
      if (options?.redirectOnFailure) {
        // Store the original URL in session for redirect after consent
        if (req.session) {
          req.session.returnTo = req.originalUrl;
        }
        res.redirect(`/consent?type=${consentType}&returnTo=${encodeURIComponent(req.originalUrl)}`);
      } else {
        res.status(403).json({
          message: 'Consent required',
          consentType,
          consentRequired: true,
        });
      }
    } catch (error) {
      console.error('Consent verification error:', error);
      res.status(500).json({ message: 'Failed to verify consent', error: (error as Error).message });
    }
  };
};

/**
 * Middleware to register user consent from a request
 * This typically would be used in a route that handles a consent form submission
 */
export const registerConsent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { consentType, hasConsented } = req.body;

    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required to register consent' });
      return;
    }

    // Check if existing consent record exists
    let consent = await DataPrivacy.findOne({
      where: {
        userId: req.user.id,
        consentType,
      },
    });

    // Get IP address from request
    const ipAddress = 
      req.headers['x-forwarded-for'] as string || 
      req.socket.remoteAddress || 
      'unknown';

    // Prepare consent data
    const consentData: {
      userId: number;
      consentType: string;
      hasConsented: boolean;
      consentDate: Date;
      consentVersion: string;
      consentDetails?: string;
      ipAddress: string;
      isActive: boolean;
      consentWithdrawnDate?: Date;
    } = {
      userId: req.user.id,
      consentType,
      hasConsented: !!hasConsented, // Convert to boolean
      consentDate: new Date(),
      consentVersion: req.body.version || '1.0',
      consentDetails: req.body.details,
      ipAddress,
      isActive: !!hasConsented,
    };

    // If consent exists, update it; otherwise create new
    if (consent) {
      // If withdrawing consent, set withdrawal date
      if (!hasConsented && consent.hasConsented) {
        consentData.consentWithdrawnDate = new Date();
      }
      
      await consent.update(consentData);
    } else {
      await DataPrivacy.create(consentData);
    }

    // If this was a dedicated consent endpoint, send response
    if (req.path.includes('/consent')) {
      // Check if there's a return URL in the session or query
      const returnTo = (req.session?.returnTo || req.query.returnTo) as string | undefined;
      
      if (returnTo) {
        // Clear session return URL if it exists
        if (req.session) {
          delete req.session.returnTo;
        }
        res.redirect(returnTo);
      } else {
        res.status(200).json({ message: 'Consent recorded successfully' });
      }
    } else {
      // If this is part of another operation, just continue
      next();
    }
  } catch (error) {
    console.error('Error registering consent:', error);
    res.status(500).json({ message: 'Failed to register consent', error: (error as Error).message });
  }
}; 