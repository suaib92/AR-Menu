import express from 'express';
import {
  createOrder,
  getOrders,
  updateOrderStatus,
  getPublicOrders,
  getOrdersByTicket,
} from '../controllers/orderController';
import { protect, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { orderSchema, orderStatusSchema } from '../schemas';

const router = express.Router();

router.get('/public/:restaurantId', getPublicOrders);
router.get('/ticket/:ticketId', getOrdersByTicket);

router.route('/')
  .post(validate(orderSchema), createOrder)
  .get(protect, getOrders);

router.route('/:id/status')
  .put(protect, authorize('owner', 'manager', 'staff'), validate(orderStatusSchema), updateOrderStatus);

export default router;
