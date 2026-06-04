import { Request, Response } from 'express';
import PushSubscription from '../models/PushSubscription';

export const subscribe = async (req: Request, res: Response) => {
  try {
    const subscription = req.body;
    
    // Check if it already exists
    const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint });
    if (!existing) {
      await PushSubscription.create(subscription);
    }
    
    res.status(201).json({ message: 'Subscribed to push notifications successfully' });
  } catch (error) {
    console.error('Error in push subscribe:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
