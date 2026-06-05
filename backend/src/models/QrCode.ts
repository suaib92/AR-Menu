import mongoose, { Schema, Document } from 'mongoose';

export interface IQrCode extends Document {
  restaurantId: mongoose.Types.ObjectId;
  label: string;
  tableNumber?: string;
  targetUrl: string;
  scanCount: number;
  lastScannedAt?: Date;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QrCodeSchema: Schema = new Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    label: {
      type: String,
      required: [true, 'Please add a label for this QR code'],
      trim: true,
      default: 'Table QR',
    },
    tableNumber: { type: String, trim: true },
    targetUrl: { type: String, required: true },
    scanCount: { type: Number, default: 0, min: 0 },
    lastScannedAt: { type: Date },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

QrCodeSchema.index({ restaurantId: 1, createdAt: -1 });

export default mongoose.model<IQrCode>('QrCode', QrCodeSchema);
