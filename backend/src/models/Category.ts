import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string;
  restaurantId: mongoose.Types.ObjectId;
  order: number;
  isActive: boolean;
}

const CategorySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a category name'],
      trim: true,
    },
    description: {
      type: String,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    order: {
      type: Number,
      default: 0,
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

// Ensure index for faster queries
CategorySchema.index({ restaurantId: 1, order: 1 });

export default mongoose.model<ICategory>('Category', CategorySchema);
