import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuItem extends Document {
  restaurantId: string;
  name: string;
  price: string;
  description: string;
  category: string;
  calories?: string;
  time?: string;
  image?: string;
  imageUrl?: string;
  status: string; // 'Active' | 'Draft'
}

const MenuItemSchema: Schema = new Schema(
  {
    restaurantId: {
      type: String,
      default: 'default_restaurant'
    },
    name: {
      type: String,
      required: [true, 'Please add a menu item name'],
      trim: true,
    },
    price: {
      type: String,
      required: [true, 'Please add a price'],
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'Mains',
    },
    calories: {
      type: String,
    },
    time: {
      type: String,
    },
    image: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    status: {
      type: String,
      default: 'Active',
    }
  },
  {
    timestamps: true,
  }
);

MenuItemSchema.index({ restaurantId: 1, category: 1 });

export default mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
