import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Extend Express Response interface for cookie method
declare global {
  namespace Express {
    interface Response {
      cookie(name: string, value: string, options?: any): Response;
    }
  }
}

/**
 * Middleware to enhance security headers beyond what Helmet provides by default
 */
export const enhancedSecurityHeaders = (
  options?: {
    enableHSTS?: boolean;
    enableCSP?: boolean;
    enableReferrerPolicy?: boolean;
    enablePermissionsPolicy?: boolean;
  }
) => {
  return (_req: Request, res: Response, next: NextFunction): void => {
    // Generate a random nonce for CSP
    const nonce = crypto.randomBytes(16).toString('base64');
    res.locals.cspNonce = nonce;

    // Set HTTP Strict Transport Security header
    if (options?.enableHSTS !== false) {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // Content Security Policy
    if (options?.enableCSP !== false) {
      res.setHeader(
        'Content-Security-Policy',
        `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://trusted-cdn.com; style-src 'self' https://trusted-cdn.com; img-src 'self' data: https://trusted-cdn.com; font-src 'self' https://trusted-cdn.com; connect-src 'self' https://api.example.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests;`
      );
    }

    // Referrer Policy
    if (options?.enableReferrerPolicy !== false) {
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    // Permissions Policy (formerly Feature Policy)
    if (options?.enablePermissionsPolicy !== false) {
      res.setHeader(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), interest-cohort=()'
      );
    }

    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

    next();
  };
};

/**
 * Middleware to set secure cookie settings
 */
export const secureCookies = (_req: Request, res: Response, next: NextFunction): void => {
  // Override Express's cookie function to always use secure settings
  const originalCookie = res.cookie;
  res.cookie = function (name: string, value: string, options: any = {}): Response {
    // Set secure flags
    const secureOptions = {
      ...options,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: options.path || '/',
      maxAge: options.maxAge || 1000 * 60 * 60 * 24, // 24 hours default
    };
    
    // Call the original cookie method directly with the arguments
    return originalCookie.bind(this)(name, value, secureOptions);
  };
  
  next();
};

/**
 * SQL Injection protection middleware
 * Note: This is an additional layer of protection. ORM's like Sequelize already provide protection.
 */
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Create a list of common SQL injection patterns
  const sqlInjectionPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(\;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i,
    /exec(\s|\+)+(s|x)p/i,
    /UNION(\s+)ALL(\s+)SELECT/i,
  ];
  
  // Function to check for SQL injection patterns
  const checkForSQLInjection = (value: string) => {
    if (!value) return false;
    
    return sqlInjectionPatterns.some((pattern) => pattern.test(value));
  };
  
  // Check query parameters
  for (const key in req.query) {
    if (typeof req.query[key] === 'string' && checkForSQLInjection(req.query[key] as string)) {
      res.status(403).json({ 
        message: 'Forbidden: Possible SQL injection detected',
        securityViolation: true 
      });
      return;
    }
  }
  
  // Check request body if it's a JSON payload
  if (req.body && typeof req.body === 'object') {
    const checkNestedObject = (obj: any): boolean => {
      for (const key in obj) {
        if (!obj.hasOwnProperty(key)) continue;
        
        if (typeof obj[key] === 'string' && checkForSQLInjection(obj[key])) {
          return true;
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (checkNestedObject(obj[key])) return true;
        }
      }
      return false;
    };
    
    if (checkNestedObject(req.body)) {
      res.status(403).json({ 
        message: 'Forbidden: Possible SQL injection detected',
        securityViolation: true 
      });
      return;
    }
  }
  
  next();
};

/**
 * Rate limiting by IP with customizable rules per route or user role
 */
export const advancedRateLimit = (
  options: {
    windowMs?: number;
    maxRequests?: number;
    message?: string;
    keyGenerator?: (req: Request) => string;
    handler?: (req: Request, res: Response) => void;
  } = {}
) => {
  // Default options
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per windowMs
    message: 'Too many requests, please try again later.',
  };
  
  const settings = { ...defaultOptions, ...options };
  
  // Store request counts (in a real app, use Redis or similar for distributed systems)
  const requestCounts: Record<string, { count: number; resetTime: number }> = {};
  
  // Clean up expired entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const key in requestCounts) {
      if (requestCounts[key].resetTime <= now) {
        delete requestCounts[key];
      }
    }
  }, settings.windowMs);
  
  return (req: Request, res: Response, next: NextFunction): void => {
    // Generate key based on IP or custom function
    const key = settings.keyGenerator 
      ? settings.keyGenerator(req) 
      : (req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown-ip');
    
    const now = Date.now();
    
    // Initialize or reset if window expired
    if (!requestCounts[key] || requestCounts[key].resetTime <= now) {
      requestCounts[key] = {
        count: 1,
        resetTime: now + settings.windowMs,
      };
      return next();
    }
    
    // Increment request count
    requestCounts[key].count += 1;
    
    // Check if limit exceeded
    if (requestCounts[key].count > settings.maxRequests) {
      // Use custom handler or default response
      if (settings.handler) {
        settings.handler(req, res);
        return;
      }
      
      res.status(429).json({
        message: settings.message,
        retryAfter: Math.ceil((requestCounts[key].resetTime - now) / 1000),
      });
      return;
    }
    
    next();
  };
}; 