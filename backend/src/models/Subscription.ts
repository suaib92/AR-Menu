import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  restaurantId: mongoose.Types.ObjectId;
  plan: 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  startDate: Date;
  endDate: Date;
  paymentGatewaySubscriptionId?: string; // from Stripe/Razorpay
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
}

const SubscriptionSchema: Schema = new Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    plan: {
      type: String,
      enum: ['starter', 'pro', 'enterprise'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'past_due', 'canceled', 'trialing'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    paymentGatewaySubscriptionId: String,
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
  },
  {
    timestamps: true,
  }
);

SubscriptionSchema.index({ restaurantId: 1 });

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
