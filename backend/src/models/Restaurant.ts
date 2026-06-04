import mongoose, { Schema, Document } from 'mongoose';

export interface IRestaurant extends Document {
  name: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  subscriptionPlan: 'starter' | 'pro' | 'enterprise';
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'trialing';
  settings: {
    currency: string;
    upiId?: string;
    theme: {
      primaryColor: string;
      secondaryColor: string;
    };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a restaurant name'],
      trim: true,
    },
    description: {
      type: String,
    },
    logoUrl: {
      type: String,
    },
    coverImageUrl: {
      type: String,
    },
    subscriptionPlan: {
      type: String,
      enum: ['starter', 'pro', 'enterprise'],
      default: 'starter',
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'past_due', 'canceled', 'trialing'],
      default: 'trialing',
    },
    settings: {
      currency: {
        type: String,
        default: 'INR',
      },
      upiId: {
        type: String,
      },
      theme: {
        primaryColor: {
          type: String,
          default: '#000000',
        },
        secondaryColor: {
          type: String,
          default: '#ffffff',
        },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IRestaurant>('Restaurant', RestaurantSchema);
