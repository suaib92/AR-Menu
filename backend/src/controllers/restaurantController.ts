import { Request, Response, NextFunction } from 'express';
import Restaurant from '../models/Restaurant';

// @desc    Get all restaurants (for super admin)
// @route   GET /api/restaurants
// @access  Private/SuperAdmin
export const getRestaurants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single restaurant
// @route   GET /api/restaurants/:id
// @access  Public
export const getRestaurantById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (restaurant) {
      res.json(restaurant);
    } else {
      res.status(404);
      throw new Error('Restaurant not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private/Owner
export const updateRestaurant = async (req: any, res: Response, next: NextFunction) => {
  try {
    // Only owner of this restaurant or super admin can update
    if (req.user.role !== 'super_admin' && req.user.restaurantId.toString() !== req.params.id) {
      res.status(403);
      throw new Error('Not authorized to update this restaurant');
    }

    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (restaurant) {
      res.json(restaurant);
    } else {
      res.status(404);
      throw new Error('Restaurant not found');
    }
  } catch (error) {
    next(error);
  }
};
