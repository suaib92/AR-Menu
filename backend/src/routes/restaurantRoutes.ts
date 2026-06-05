import express from 'express';
import { getRestaurants, getRestaurantById, updateRestaurant } from '../controllers/restaurantController';
import { protect, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { restaurantUpdateSchema } from '../schemas';

const router = express.Router();

router.route('/')
  .get(protect, authorize('super_admin'), getRestaurants);

router.route('/:id')
  .get(getRestaurantById)
  .put(
    protect,
    authorize('super_admin', 'owner'),
    validate(restaurantUpdateSchema),
    updateRestaurant
  );

export default router;
