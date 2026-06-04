import { Request, Response, NextFunction } from 'express';
import MenuItem from '../models/MenuItem';

// @desc    Get all menu items for a restaurant
// @route   GET /api/menu/items/:restaurantId
// @access  Public
export const getMenuItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter: any = {};
    if (req.params.restaurantId && req.params.restaurantId !== 'all') {
      filter.restaurantId = req.params.restaurantId;
    }
    const items = await MenuItem.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a menu item
// @route   POST /api/menu/items
// @access  Public (for MVP)
export const createMenuItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body.restaurantId = req.body.restaurantId || 'default_restaurant';
    const menuItem = await MenuItem.create(req.body);
    res.status(201).json(menuItem);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a menu item
// @route   DELETE /api/menu/items/:id
// @access  Public (for MVP)
export const deleteMenuItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error('Menu item not found');
    }
    res.json({ message: 'Item deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a menu item
// @route   PUT /api/menu/items/:id
// @access  Public (for MVP)
export const updateMenuItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) {
      res.status(404);
      throw new Error('Menu item not found');
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
};
