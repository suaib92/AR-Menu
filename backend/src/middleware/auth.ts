import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Mocking the user for MVP so Admin dashboard works without full login flow
  req.user = {
    _id: 'mocked_id_123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'owner',
    restaurantId: '223456789012345678901234',
  } as any;

  next();
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(
        new Error(`User role ${req.user?.role} is not authorized to access this route`)
      );
    }
    next();
  };
};
