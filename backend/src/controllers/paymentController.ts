import { Request, Response, NextFunction } from 'express';
import Restaurant from '../models/Restaurant';

// @desc    Generate UPI payment link
// @route   POST /api/payment/upi-link
// @access  Public
export const getUpiLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, amount, customerName, tableNumber } = req.body;

    if (!amount || amount <= 0) {
      res.status(400);
      throw new Error('Invalid payment amount');
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      res.status(404);
      throw new Error('Restaurant not found');
    }

    const upiId = restaurant.settings?.upiId;
    if (!upiId) {
      res.status(400);
      throw new Error('UPI ID not configured for this restaurant');
    }

    const restaurantName = restaurant.name || 'Restaurant';
    const formattedAmount = Number(amount).toFixed(2);
    const tn = `Bill Payment${tableNumber ? ` Table ${tableNumber}` : ''}${customerName ? ` - ${customerName}` : ''}`;

    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(restaurantName)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(tn)}`;

    res.json({ upiLink, upiId, amount: formattedAmount, restaurantName });
  } catch (error) {
    next(error);
  }
};
