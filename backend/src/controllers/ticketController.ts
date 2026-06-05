import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Ticket from '../models/Ticket';
import Order from '../models/Order';
import { AuthRequest } from '../middleware/auth';

// @desc    Get the open ticket for a given table (used by frontend to know
//          if "join existing bill" vs "start new bill" applies)
// @route   GET /api/tickets/active
// @access  Public
export const getActiveTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, tableNumber } = req.query;

    if (!restaurantId || !tableNumber) {
      res.status(400);
      throw new Error('restaurantId and tableNumber are required');
    }

    const restaurantIdStr = String(restaurantId);
    const tableNumberStr = String(tableNumber);

    if (!mongoose.Types.ObjectId.isValid(restaurantIdStr)) {
      res.json({ ticket: null });
      return;
    }

    const ticket = await Ticket.findOne({
      restaurantId: restaurantIdStr,
      tableNumber: tableNumberStr,
      status: 'open',
    });

    if (!ticket) {
      res.json({ ticket: null });
      return;
    }

    // Return ticket + a summary of its orders
    const orders = await Order.find({ ticketId: ticket._id }).sort({ createdAt: 1 }).lean();
    res.json({
      ticket,
      orders,
      orderCount: orders.length,
      totalAmount: ticket.totalAmount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a ticket by id with all its orders
// @route   GET /api/tickets/:id
// @access  Public (used by customer history view)
export const getTicketById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const idStr = String(id);
    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      res.status(400);
      throw new Error('Invalid ticket ID');
    }

    const ticket = await Ticket.findById(idStr);
    if (!ticket) {
      res.status(404);
      throw new Error('Ticket not found');
    }

    const orders = await Order.find({ ticketId: ticket._id }).sort({ createdAt: 1 });
    res.json({ ticket, orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Close a ticket (admin action — bill settled)
// @route   POST /api/tickets/:id/close
// @access  Private (owner/manager)
export const closeTicket = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;

    if (!restaurantId) {
      res.status(400);
      throw new Error('No restaurant associated with this account');
    }

    const idStr = String(id);
    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      res.status(400);
      throw new Error('Invalid ticket ID');
    }

    const ticket = await Ticket.findById(idStr);
    if (!ticket) {
      res.status(404);
      throw new Error('Ticket not found');
    }
    if (String(ticket.restaurantId) !== String(restaurantId)) {
      res.status(403);
      throw new Error('Not authorized to close this ticket');
    }

    ticket.status = 'closed';
    ticket.closedAt = new Date();
    await ticket.save();

    // Mark all in-flight orders on this ticket as paid
    await Order.updateMany(
      { ticketId: ticket._id, status: { $nin: ['paid'] } },
      { $set: { status: 'paid' } }
    );

    res.json(ticket);
  } catch (error) {
    next(error);
  }
};

// @desc    List all open tickets for the authenticated user's restaurant
// @route   GET /api/tickets
// @access  Private
export const listOpenTickets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      res.status(400);
      throw new Error('No restaurant associated with this account');
    }
    const tickets = await Ticket.find({
      restaurantId: String(restaurantId),
      status: 'open',
    }).sort({ updatedAt: -1 });
    res.json(tickets);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tickets created by a given session id (across all tables/statuses)
//          Used by the customer's menu page to render "Your Bill" history.
// @route   GET /api/tickets/by-session/:sessionId
// @access  Public
export const getTicketsBySession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      res.status(400);
      throw new Error('sessionId is required');
    }

    const tickets = await Ticket.find({ createdBySession: String(sessionId) })
      .sort({ updatedAt: -1 })
      .lean();

    // Attach orders per ticket so the frontend can render one round-trip
    const ticketIds = tickets.map((t) => t._id);
    const orders = ticketIds.length
      ? await Order.find({ ticketId: { $in: ticketIds } }).sort({ createdAt: 1 }).lean()
      : [];

    const byTicket: Record<string, typeof orders> = {};
    for (const o of orders) {
      const key = String(o.ticketId);
      if (!byTicket[key]) byTicket[key] = [];
      byTicket[key].push(o);
    }

    const payload = tickets.map((t) => ({
      ...t,
      orders: byTicket[String(t._id)] || [],
    }));

    res.json({ tickets: payload });
  } catch (error) {
    next(error);
  }
};
