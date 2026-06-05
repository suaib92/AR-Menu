import express from 'express';
import { getUpiLink } from '../controllers/paymentController';
import { validate } from '../middleware/validate';
import { upiLinkSchema } from '../schemas';

const router = express.Router();

router.post('/upi-link', validate(upiLinkSchema), getUpiLink);

export default router;
