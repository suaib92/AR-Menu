import mongoose, { Document, Schema } from 'mongoose';

export interface IPushSubscription extends Document {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
}

const pushSubscriptionSchema = new Schema({
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IPushSubscription>('PushSubscription', pushSubscriptionSchema);
