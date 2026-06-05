import { Request, Response, NextFunction } from 'express';
import webpush from 'web-push';
import Order from '../models/Order';
import PushSubscription from '../models/PushSubscription';
import { AuthRequest } from '../middleware/auth';

const vapidContact = process.env.VAPID_CONTACT || 'mailto:admin@example.com';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    vapidContact,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const sendPushNotification = async (restaurantId: string, payload: unknown) => {
  try {
    const subscriptions = await PushSubscription.find({ restaurantId });
    if (subscriptions.length === 0) return;

    await Promise.all(
      subscriptions.map((sub) =>
        webpush
          .sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            JSON.stringify(payload)
          )
          .catch(async (err: { statusCode?: number }) => {
            if (err.statusCode === 404 || err.statusCode === 410) {
              await PushSubscription.findByIdAndDelete(sub._id);
            }
          })
      )
    );
  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, tableNumber, customerName, items, totalAmount } = req.body;

    const newOrder = await Order.create({
      restaurantId: String(restaurantId),
      customerName: customerName || 'Guest',
      tableNumber: tableNumber || 'Takeaway',
      items,
      totalAmount,
      status: 'pending',
    });

    sendPushNotification(String(restaurantId), {
      title: 'New Order Received! 🍽️',
      body: `Table ${newOrder.tableNumber} - ${newOrder.customerName}`,
      icon: '/icon.png',
    });

    res.status(201).json(newOrder);
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

// @desc    Get public orders for a specific table/customer (Live Tracking)
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
      sendPushNotification(String(restaurantId), {
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
