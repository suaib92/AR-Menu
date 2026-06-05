import express from 'express';
import {
  getActiveTicket,
  getTicketById,
  closeTicket,
  listOpenTickets,
  getTicketsBySession,
} from '../controllers/ticketController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Static routes first so 'by-session' isn't swallowed by /:id
router.get('/active', getActiveTicket);
router.get('/by-session/:sessionId', getTicketsBySession);
router.get('/', protect, listOpenTickets);
router.get('/:id', getTicketById);
router.post('/:id/close', protect, authorize('owner', 'manager'), closeTicket);

export default router;
