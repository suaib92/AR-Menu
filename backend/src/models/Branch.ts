import mongoose, { Schema, Document } from 'mongoose';

export interface IBranch extends Document {
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactNumber?: string;
  managers: mongoose.Types.ObjectId[];
  tableCount: number;
  isActive: boolean;
}

const BranchSchema: Schema = new Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a branch name'],
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    contactNumber: String,
    managers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    tableCount: {
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

export default mongoose.model<IBranch>('Branch', BranchSchema);
