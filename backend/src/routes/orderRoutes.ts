import express from 'express';
import { createOrder, getOrders, updateOrderStatus } from '../controllers/orderController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.route('/')
  .post(createOrder)
  .get(getOrders);

router.route('/:id/status')
  .put(protect, authorize('owner', 'manager', 'staff'), updateOrderStatus);

export default router;
