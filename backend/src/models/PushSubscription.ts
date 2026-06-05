import mongoose, { Document, Schema } from 'mongoose';

export interface IPushSubscription extends Document {
  restaurantId: mongoose.Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
}

const pushSubscriptionSchema = new Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'restaurantId is required'],
    index: true,
  },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  createdAt: { type: Date, default: Date.now },
});

pushSubscriptionSchema.index({ restaurantId: 1, endpoint: 1 });

export default mongoose.model<IPushSubscription>('PushSubscription', pushSubscriptionSchema);
