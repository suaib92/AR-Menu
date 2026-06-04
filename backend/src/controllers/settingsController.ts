import { Request, Response, NextFunction } from 'express';
import Restaurant from '../models/Restaurant';

// Helper to get or create the MVP singleton restaurant
const getMvpRestaurant = async () => {
  let restaurant = await Restaurant.findOne();
  if (!restaurant) {
    restaurant = await Restaurant.create({
      name: 'The French Laundry',
      settings: {
        upiId: 'restaurant@mockupi',
        currency: 'INR',
        theme: { primaryColor: '#8b5cf6', secondaryColor: '#ffffff' }
      }
    });
  }
  return restaurant;
};

// @desc    Get settings
// @route   GET /api/settings
// @access  Public
export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurant = await getMvpRestaurant();
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

// @desc    Update settings
// @route   POST /api/settings
// @access  Public
export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantName, upiId, themeColor, currency } = req.body;
    const restaurant = await getMvpRestaurant();
    
    if (restaurantName) restaurant.name = restaurantName;
    if (!restaurant.settings) restaurant.settings = { currency: 'INR', theme: { primaryColor: '#8b5cf6', secondaryColor: '#ffffff' } };
    if (upiId !== undefined) restaurant.settings.upiId = upiId;
    if (themeColor) restaurant.settings.theme.primaryColor = themeColor;
    if (currency) restaurant.settings.currency = currency;
    
    await restaurant.save();
    
    res.json({
      restaurantName: restaurant.name,
      upiId: restaurant.settings.upiId,
      themeColor: restaurant.settings.theme.primaryColor,
      currency: restaurant.settings.currency
    });
  } catch (error) {
    next(error);
  }
};
