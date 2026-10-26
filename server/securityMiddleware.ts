/**
 * server/securityMiddleware.ts
 * Enterprise Security and Zero-Trust Guardrails for KLE Technological University
 * Enforces Firebase ID Token verification, Role-Based Access Control (RBAC),
 * Zod request validation, rate-limiting, and structured audit telemetry.
 */

import type { Request, Response, NextFunction } from 'express';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import rateLimit from 'express-rate-limit';
import { z, ZodSchema } from 'zod';
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ['req.headers.authorization', 'req.body.token', 'req.body.password', 'req.body.cameraFrameBase64'],
    censor: '[REDACTED]',
  },
});

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role: 'STUDENT' | 'FACULTY' | 'COE_AUTHOR';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
    }
  }
}

// Initialize Firebase Admin if not already initialized
const projectId = process.env.FIREBASE_PROJECT_ID || 'ai-studio-ea8ff412-651d-4d93-9ef2-360585997684';

if (!getApps().length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({
        credential: cert(sa),
        projectId,
      });
    } else {
      initializeApp({ projectId });
    }
    logger.info({ projectId }, 'Firebase Admin initialized successfully in security middleware');
  } catch (err: any) {
    logger.warn({ error: err.message }, 'Firebase Admin initialization notice; running in self-contained mode');
  }
}

/**
 * Firebase ID Token Verification Middleware
 * Validates cryptographic JWT signature and extracts role custom claims.
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  // Development & Test Sandbox Fallback
  if (process.env.NODE_ENV === 'test' || process.env.VITE_DEMO_MODE === 'true' || process.env.ALLOW_ANONYMOUS_TESTING === 'true') {
    if (!token) {
      // In explicit demo/test mode, assign student or header-specified test claim
      const testRole = (req.headers['x-test-role'] as string) || 'STUDENT';
      const testUid = (req.headers['x-test-uid'] as string) || 'test_demo_uid';
      req.user = {
        uid: testUid,
        email: `${testRole.toLowerCase()}@university.edu`,
        role: testRole as any,
      };
      return next();
    }
  }

  if (!token) {
    logger.warn({ path: req.path, ip: req.ip }, 'Unauthorized API access attempt: Missing Bearer token');
    return res.status(401).json({
      error: 'UNAUTHORIZED: Missing or invalid Firebase ID Token.',
      code: 'AUTH_TOKEN_REQUIRED',
    });
  }

  try {
    const auth = getAuth();
    const decoded = await auth.verifyIdToken(token);
    const role = (decoded.role as string)?.toUpperCase() || 'STUDENT';

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: (role === 'AUTHOR' ? 'COE_AUTHOR' : role) as any,
    };
    next();
  } catch (err: any) {
    logger.warn({ path: req.path, error: err.message }, 'Invalid Firebase ID token supplied');
    return res.status(401).json({
      error: 'UNAUTHORIZED: Firebase ID Token expired or invalid.',
      code: 'INVALID_TOKEN',
      details: err.message,
    });
  }
}

/**
 * Strict Role-Based Access Control (RBAC) Guardrail
 */
export function requireRole(allowedRoles: Array<'STUDENT' | 'FACULTY' | 'COE_AUTHOR'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED: Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        { path: req.path, userRole: req.user.role, requiredRoles: allowedRoles },
        'Forbidden access: User lacks required role'
      );
      return res.status(403).json({
        error: `FORBIDDEN: Access requires role in [${allowedRoles.join(', ')}]. Current role: '${req.user.role}'`,
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    next();
  };
}

/**
 * Zod Request Body Validation Middleware
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.body);
      req.body = parsed;
      next();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'BAD_REQUEST: Request payload failed schema validation.',
          issues: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        });
      }
      return res.status(400).json({ error: 'Malformed request payload.' });
    }
  };
}

/**
 * Tiered Rate Limiters
 */
export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS: Exceeded general API rate limit.', retryAfterSeconds: 60 },
});

export const geminiQuotaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS: Exceeded AI model generation rate limit.', retryAfterSeconds: 60 },
});

export const agentOrchestratorLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS: Exceeded Agent Coordinator dispatch limit.', retryAfterSeconds: 60 },
});
