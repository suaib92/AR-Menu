import express from 'express';
import { subscribe } from '../controllers/notificationController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { pushSubscribeSchema } from '../schemas';

const router = express.Router();

router.post('/subscribe', protect, validate(pushSubscribeSchema), subscribe);

export default router;
