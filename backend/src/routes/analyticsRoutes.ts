import express from 'express';
import { trackView, getOverview, getAdminOverview } from '../controllers/analyticsController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public fire-and-forget analytics beacon
router.post('/track', trackView);

// Owner / manager / staff dashboard
router.get('/overview', protect, getOverview);

// Super admin platform overview
router.get('/admin/overview', protect, authorize('super_admin'), getAdminOverview);

export default router;
