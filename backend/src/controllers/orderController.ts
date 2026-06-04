import { Request, Response, NextFunction } from 'express';
import webpush from 'web-push';
import Order from '../models/Order';
import PushSubscription from '../models/PushSubscription';

// Set VAPID details
webpush.setVapidDetails(
  'mailto:test@example.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

// Helper function to send push notification
const sendPushNotification = async (payload: any) => {
  try {
    const subscriptions = await PushSubscription.find({});
    const promises = subscriptions.map(sub => 
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys
        },
        JSON.stringify(payload)
      ).catch(err => {
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log('Subscription has expired or is no longer valid: ', err);
          return PushSubscription.findByIdAndDelete(sub._id);
        }
      })
    );
    await Promise.all(promises);
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
      restaurantId,
      customerName: customerName || 'Guest',
      tableNumber: tableNumber || 'Takeaway',
      items,
      totalAmount,
      status: 'pending',
    });

    // Send push notification
    sendPushNotification({
      title: 'New Order Received! 🍽️',
      body: `Table ${newOrder.tableNumber} - ${newOrder.customerName}`,
      icon: '/icon.png', // assuming icon in frontend/public
    });

    res.status(201).json(newOrder);
  } catch (error) {
    next(error);
  }
};

// @desc    Get orders for a restaurant
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, table } = req.query;
    
    let filter: any = {};
    
    if (name && table) {
      filter.customerName = name;
      filter.tableNumber = table;
    }
    
    // Sort so newest are first
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
export const updateOrderStatus = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (status === 'payment_verifying') {
      sendPushNotification({
        title: 'Payment Verification Requested 💸',
        body: `Table ${order.tableNumber} claims they have paid.`,
        icon: '/icon.png'
      });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};
