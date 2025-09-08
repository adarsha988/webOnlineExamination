import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';

const JWT_SECRET = config.jwt.secret;

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user as { userId: string; email: string; role: string };
    next();
  });
};

export const authorizeRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Convenience middleware for common role checks
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  return authorizeRole(['admin'])(req, res, next);
};

export const requireInstructor = (req: Request, res: Response, next: NextFunction) => {
  return authorizeRole(['instructor', 'admin'])(req, res, next);
};

export const requireStudent = (req: Request, res: Response, next: NextFunction) => {
  return authorizeRole(['student', 'instructor', 'admin'])(req, res, next);
};
