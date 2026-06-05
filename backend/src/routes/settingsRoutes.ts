import express from 'express';
import { getSettings, getPublicSettings, updateSettings } from '../controllers/settingsController';
import { protect, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { settingsSchema } from '../schemas';

const router = express.Router();

router.route('/')
  .get(protect, getSettings)
  .put(protect, authorize('owner', 'manager'), validate(settingsSchema), updateSettings);

router.get('/public/:restaurantId', getPublicSettings);

export default router;
