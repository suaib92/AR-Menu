import { Request, Response, NextFunction } from 'express';
import MenuItem from '../models/MenuItem';
import { AuthRequest } from '../middleware/auth';

// @desc    Get all ACTIVE menu items (public - by restaurantId)
// @route   GET /api/menu/items/restaurant/:restaurantId
// @access  Public
export const getMenuItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params;
    if (!restaurantId) {
      res.status(400);
      throw new Error('Restaurant ID is required');
    }
    const items = await MenuItem.find({
      restaurantId: String(restaurantId),
      status: 'Active',
    }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
};

// @desc    Get ALL menu items (including Drafts) for the authenticated user's restaurant
// @route   GET /api/menu/items
// @access  Private
export const getMyMenuItems = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      res.status(400);
      throw new Error('No restaurant associated with this account');
    }
    const items = await MenuItem.find({ restaurantId: String(restaurantId) }).sort({
      createdAt: -1,
    });
    res.json(items);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a menu item
// @route   POST /api/menu/items
// @access  Private
export const createMenuItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      res.status(400);
      throw new Error('No restaurant associated with this account');
    }
    req.body.restaurantId = String(restaurantId);
    const menuItem = await MenuItem.create(req.body);
    res.status(201).json(menuItem);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a menu item
// @route   DELETE /api/menu/items/:id
// @access  Private
export const deleteMenuItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error('Menu item not found');
    }
    if (String(item.restaurantId) !== String(req.user?.restaurantId)) {
      res.status(403);
      throw new Error('Not authorized to delete this item');
    }
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a menu item
// @route   PUT /api/menu/items/:id
// @access  Private
export const updateMenuItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await MenuItem.findById(req.params.id);
    if (!existing) {
      res.status(404);
      throw new Error('Menu item not found');
    }
    if (String(existing.restaurantId) !== String(req.user?.restaurantId)) {
      res.status(403);
      throw new Error('Not authorized to update this item');
    }
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
};
