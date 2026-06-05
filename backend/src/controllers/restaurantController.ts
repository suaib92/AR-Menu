import { Request, Response, NextFunction } from 'express';
import Restaurant from '../models/Restaurant';
import { AuthRequest } from '../middleware/auth';

// @desc    Get all active restaurants (for super admin)
// @route   GET /api/restaurants
// @access  Private/SuperAdmin
export const getRestaurants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '50'), 10) || 50, 1), 200);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { isActive: true };
    if (req.query.includeInactive === 'true') {
      delete filter.isActive;
    }

    const [restaurants, total] = await Promise.all([
      Restaurant.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Restaurant.countDocuments(filter),
    ]);

    res.json({ data: restaurants, page, limit, total });
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
    if (!restaurant || !restaurant.isActive) {
      res.status(404);
      throw new Error('Restaurant not found');
    }
    res.json(restaurant);
  } catch (error) {
    next(error);
  }
};

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private/Owner | SuperAdmin
export const updateRestaurant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const requester = req.user;
    if (!requester) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const isSuperAdmin = requester.role === 'super_admin';
    const isOwner =
      requester.role === 'owner' &&
      requester.restaurantId?.toString() === req.params.id;

    if (!isSuperAdmin && !isOwner) {
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
