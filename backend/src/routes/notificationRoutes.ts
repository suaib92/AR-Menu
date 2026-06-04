import express from 'express';
// @ts-ignore - temporary ignore to bypass IDE caching issue if it persists
import { subscribe } from '../controllers/notificationController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/subscribe', protect, subscribe);

export default router;
