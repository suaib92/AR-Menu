import { Request, Response } from 'express';
import mongoose from 'mongoose';
import PushSubscription from '../models/PushSubscription';
import { AuthRequest } from '../middleware/auth';

export const subscribe = async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      res.status(400).json({ message: 'No restaurant associated with this account' });
      return;
    }

    const { endpoint, keys } = req.body as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        restaurantId: new mongoose.Types.ObjectId(String(restaurantId)),
        endpoint,
        keys,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ message: 'Subscribed to push notifications successfully' });
  } catch (error) {
    console.error('Error in push subscribe:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
