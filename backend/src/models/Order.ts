import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  menuItemId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  notes?: string;
}

export interface IOrder extends Document {
  restaurantId: string;
  customerName: string;
  tableNumber: string;
  items: any[];
  totalAmount: number;
  currency: string;
  status: 'pending' | 'preparing' | 'delivering' | 'completed' | 'paid' | 'payment_requested' | 'payment_verifying';
}

const OrderItemSchema: Schema = new Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  notes: String,
});

const OrderSchema: Schema = new Schema(
  {
    restaurantId: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      default: 'Guest'
    },
    tableNumber: {
      type: String,
      required: true,
      default: 'Takeaway'
    },
    items: {
      type: Array,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'preparing', 'delivering', 'completed', 'paid', 'payment_requested', 'payment_verifying'],
      default: 'pending',
    }
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ restaurantId: 1, status: 1 });
OrderSchema.index({ customerName: 1 });

export default mongoose.model<IOrder>('Order', OrderSchema);
