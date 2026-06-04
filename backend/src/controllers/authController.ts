import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import Restaurant from '../models/Restaurant';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRE as any,
  });
};

// Mock User ID
const mockUserId = '123456789012345678901234';
const mockRestaurantId = '223456789012345678901234';

// @desc    Register user (Owner)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, restaurantName } = req.body;

    res.status(201).json({
      _id: mockUserId,
      name: name || 'Test User',
      email: email || 'test@example.com',
      role: restaurantName ? 'owner' : 'customer',
      restaurantId: restaurantName ? mockRestaurantId : undefined,
      token: generateToken(mockUserId),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    res.json({
      _id: mockUserId,
      name: 'Test Owner',
      email: email || 'test@example.com',
      role: 'owner',
      restaurantId: mockRestaurantId,
      token: generateToken(mockUserId),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: any, res: Response, next: NextFunction) => {
  try {
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      restaurantId: req.user.restaurantId,
    });
  } catch (error) {
    next(error);
  }
};
