import express from 'express';
import {
  listQrCodes,
  createQrCode,
  updateQrCode,
  deleteQrCode,
  recordScan,
} from '../controllers/qrController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public scan tracking (called by menu page when ?qr=<id> is present)
router.post('/:id/scan', recordScan);

router.route('/')
  .get(protect, listQrCodes)
  .post(protect, createQrCode);

router.route('/:id')
  .put(protect, updateQrCode)
  .delete(protect, deleteQrCode);

export default router;
