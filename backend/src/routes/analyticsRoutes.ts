import express from 'express';
import {
  trackView,
  getOverview,
  getAdminOverview,
  getUsers,
} from '../controllers/analyticsController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public fire-and-forget analytics beacon
router.post('/track', trackView);

// Owner / manager / staff dashboard
router.get('/overview', protect, getOverview);

// Super admin platform overview
router.get('/admin/overview', protect, authorize('super_admin'), getAdminOverview);

// Super admin user list
router.get('/admin/users', protect, authorize('super_admin'), getUsers);

export default router;
