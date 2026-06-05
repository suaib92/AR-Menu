import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  restaurantId: string;
  tableNumber: string;
  primaryName: string;
  status: 'open' | 'closed';
  totalAmount: number;
  createdBySession?: string;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema: Schema = new Schema(
  {
    restaurantId: {
      type: String,
      required: true,
      index: true,
    },
    tableNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    primaryName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
      index: true,
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBySession: {
      type: String,
      trim: true,
      maxlength: 128,
      index: true,
    },
    closedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Only one OPEN ticket per (restaurant, table). Closed tickets don't conflict,
// so historic bills remain intact and a new open ticket can start fresh later.
TicketSchema.index(
  { restaurantId: 1, tableNumber: 1 },
  { unique: true, partialFilterExpression: { status: 'open' } }
);

export default mongoose.model<ITicket>('Ticket', TicketSchema);
