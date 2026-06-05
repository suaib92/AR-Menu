import { Request, Response, NextFunction } from 'express';
import Restaurant from '../models/Restaurant';
import { AuthRequest } from '../middleware/auth';

// @desc    Get public settings for a restaurant (used by customer menu)
// @route   GET /api/settings/public/:restaurantId
// @access  Public
export const getPublicSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) {
      res.status(404);
      throw new Error('Restaurant not found');
    }
    res.json({
      restaurantName: restaurant.name,
      upiId: restaurant.settings?.upiId || '',
      themeColor: restaurant.settings?.theme?.primaryColor || '#8b5cf6',
      currency: restaurant.settings?.currency || 'INR'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get settings for authenticated user's restaurant
// @route   GET /api/settings
// @access  Private
export const getSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      res.status(400);
      throw new Error('No restaurant associated with this account');
    }

    let restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      restaurant = await Restaurant.create({
        name: req.user?.name || 'My Restaurant',
        settings: {
          upiId: '',
          currency: 'INR',
          theme: { primaryColor: '#8b5cf6', secondaryColor: '#ffffff' }
        }
      });
    }

    res.json({
      restaurantName: restaurant.name,
      upiId: restaurant.settings?.upiId || '',
      themeColor: restaurant.settings?.theme?.primaryColor || '#8b5cf6',
      currency: restaurant.settings?.currency || 'INR'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update settings for authenticated user's restaurant
// @route   PUT /api/settings
// @access  Private
export const updateSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      res.status(400);
      throw new Error('No restaurant associated with this account');
    }

    const { restaurantName, upiId, themeColor, currency } = req.body as {
      restaurantName?: string;
      upiId?: string;
      themeColor?: string;
      currency?: string;
    };
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      res.status(404);
      throw new Error('Restaurant not found');
    }

    if (restaurantName) restaurant.name = restaurantName;
    if (!restaurant.settings) {
      restaurant.settings = {
        currency: 'INR',
        theme: { primaryColor: '#8b5cf6', secondaryColor: '#ffffff' },
      };
    }
    if (upiId !== undefined) restaurant.settings.upiId = upiId;
    if (themeColor) restaurant.settings.theme!.primaryColor = themeColor;
    if (currency) restaurant.settings.currency = currency;

    await restaurant.save();

    res.json({
      restaurantName: restaurant.name,
      upiId: restaurant.settings.upiId,
      themeColor: restaurant.settings.theme?.primaryColor,
      currency: restaurant.settings.currency,
    });
  } catch (error) {
    next(error);
  }
};
