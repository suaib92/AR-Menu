import express from 'express';
import { getRestaurants, getRestaurantById, updateRestaurant } from '../controllers/restaurantController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.route('/')
  .get(protect, authorize('super_admin'), getRestaurants);

router.route('/:id')
  .get(getRestaurantById)
  .put(protect, authorize('super_admin', 'owner'), updateRestaurant);

export default router;
