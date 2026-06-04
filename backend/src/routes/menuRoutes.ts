import express from 'express';
import { getMenuItems, createMenuItem, deleteMenuItem, updateMenuItem } from '../controllers/menuController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Menu Items
router.route('/items')
  .post(protect, authorize('owner', 'manager'), createMenuItem);
  
router.route('/items/:restaurantId')
  .get(getMenuItems);

router.route('/items/:id')
  .put(protect, authorize('owner', 'manager'), updateMenuItem)
  .delete(protect, authorize('owner', 'manager'), deleteMenuItem);

export default router;
