import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order';
import Ticket from '../models/Ticket';
import { AuthRequest } from '../middleware/auth';

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
//
// Tickets model:
// - A Ticket is a per-table bill. One OPEN ticket per (restaurant, table).
// - First order at a table creates the ticket (primaryName = first customer).
// - Subsequent orders from the same table APPEND to the existing ticket.
// - "Switch table" UX (frontend) simply means customer enters a different
//   table number, which triggers a new ticket because (restaurant, table) is new.
// - If the frontend sends a `sessionId`, we record it on the ticket so the
//   customer's QR scan is linked to the bill.
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, tableNumber, customerName, items, totalAmount, sessionId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      // Silently drop invalid ObjectIds (keep parity with analytics track endpoint)
      res.status(202).json({ skipped: true, reason: 'invalid restaurantId' });
      return;
    }

    // Find an open ticket for this table, or create one.
    let ticket = await Ticket.findOne({
      restaurantId: String(restaurantId),
      tableNumber: String(tableNumber),
      status: 'open',
    });

    if (!ticket) {
      ticket = await Ticket.create({
        restaurantId: String(restaurantId),
        tableNumber: String(tableNumber),
        primaryName: customerName || 'Guest',
        status: 'open',
        totalAmount: 0,
        createdBySession: sessionId || undefined,
      });
    }

    const newOrder = await Order.create({
      restaurantId: String(restaurantId),
      customerName: customerName || ticket.primaryName || 'Guest',
      tableNumber: String(tableNumber),
      items,
      totalAmount,
      ticketId: ticket._id,
      status: 'pending',
    });

    // Recalculate ticket total
    const ticketOrders = await Order.find({ ticketId: ticket._id });
    ticket.totalAmount = ticketOrders.reduce((sum, o) => {
      const amt = typeof o.totalAmount === 'number'
        ? o.totalAmount
        : parseInt(String(o.totalAmount).replace(/[^0-9]/g, ''), 10) || 0;
      return sum + amt;
    }, 0);
    await ticket.save();

    // Push notification (best-effort, fire-and-forget)
    const { sendPushNotification } = await import('./orderPushHelper.js').catch(() => ({
      sendPushNotification: async () => undefined,
    }));
    void sendPushNotification(String(restaurantId), {
      title: ticketOrders.length > 1 ? 'Items added to ticket 🍽️' : 'New Order Received! 🍽️',
      body: `Table ${newOrder.tableNumber} - ${ticket.primaryName}${ticketOrders.length > 1 ? ` (+${ticketOrders.length - 1} more)` : ''}`,
      icon: '/icon.png',
    });

    res.status(201).json({ ...newOrder.toObject(), ticketId: ticket._id });
  } catch (error) {
    next(error);
  }
};

// @desc    Get orders for authenticated user's restaurant
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      res.status(400);
      throw new Error('No restaurant associated with this account');
    }

    const { name, table } = req.query;
    const filter: Record<string, unknown> = { restaurantId: String(restaurantId) };

    if (typeof name === 'string' && typeof table === 'string' && name && table) {
      filter.customerName = name;
      filter.tableNumber = table;
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Get orders for a specific ticket (with all sibling orders)
// @route   GET /api/orders/ticket/:ticketId
// @access  Public (used by customer history view to see all items in their bill)
export const getOrdersByTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticketId } = req.params;
    const ticketIdStr = String(ticketId);
    if (!mongoose.Types.ObjectId.isValid(ticketIdStr)) {
      res.status(400);
      throw new Error('Invalid ticket ID');
    }
    const orders = await Order.find({ ticketId: ticketIdStr }).sort({ createdAt: 1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Get public orders for a specific table/customer (Live Tracking, legacy)
// @route   GET /api/orders/public/:restaurantId
// @access  Public
export const getPublicOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params;
    const { name, table } = req.query;

    if (!name || !table) {
      res.status(400);
      throw new Error('Name and table number are required');
    }

    const filter = {
      restaurantId: String(restaurantId),
      customerName: String(name),
      tableNumber: String(table),
    };

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body as { status: string };
    const restaurantId = req.user?.restaurantId;

    if (!restaurantId) {
      res.status(400);
      throw new Error('No restaurant associated with this account');
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    if (String(order.restaurantId) !== String(restaurantId)) {
      res.status(403);
      throw new Error('Not authorized to update this order');
    }

    order.status = status as typeof order.status;
    await order.save();

    if (status === 'payment_verifying') {
      const { sendPushNotification } = await import('./orderPushHelper.js').catch(() => ({
        sendPushNotification: async () => undefined,
      }));
      void sendPushNotification(String(restaurantId), {
        title: 'Payment Verification Requested 💸',
        body: `Table ${order.tableNumber} claims they have paid.`,
        icon: '/icon.png',
      });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};
