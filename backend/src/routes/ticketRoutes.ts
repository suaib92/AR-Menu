import express from 'express';
import {
  getActiveTicket,
  getTicketById,
  closeTicket,
  listOpenTickets,
} from '../controllers/ticketController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/active', getActiveTicket);
router.get('/', protect, listOpenTickets);
router.get('/:id', getTicketById);
router.post('/:id/close', protect, authorize('owner', 'manager'), closeTicket);

export default router;
