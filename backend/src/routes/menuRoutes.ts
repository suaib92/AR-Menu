import express from 'express';
import { getMenuItems, getMyMenuItems, createMenuItem, deleteMenuItem, updateMenuItem } from '../controllers/menuController';
import { protect, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { menuItemSchema } from '../schemas';

const router = express.Router();

router.route('/items')
  .get(protect, getMyMenuItems)
  .post(protect, authorize('owner', 'manager'), validate(menuItemSchema), createMenuItem);

router.route('/items/restaurant/:restaurantId')
  .get(getMenuItems);

router.route('/items/:id')
  .put(protect, authorize('owner', 'manager'), validate(menuItemSchema), updateMenuItem)
  .delete(protect, authorize('owner', 'manager'), deleteMenuItem);

export default router;
