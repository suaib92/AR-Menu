import mongoose, { Schema, Document } from 'mongoose';

export type ViewType = 'menu_open' | 'item_view' | 'ar_session' | 'order_placed' | 'qr_scan';

export interface IPageView extends Document {
  restaurantId?: mongoose.Types.ObjectId;
  viewType: ViewType;
  menuItemId?: mongoose.Types.ObjectId;
  sessionId?: string;
  userAgent?: string;
  countryCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PageViewSchema: Schema = new Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      index: true,
    },
    viewType: {
      type: String,
      enum: ['menu_open', 'item_view', 'ar_session', 'order_placed', 'qr_scan'],
      required: true,
      index: true,
    },
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
    },
    sessionId: { type: String, index: true },
    userAgent: { type: String },
    countryCode: { type: String },
  },
  { timestamps: true }
);

PageViewSchema.index({ restaurantId: 1, viewType: 1, createdAt: -1 });
PageViewSchema.index({ createdAt: -1 });

export default mongoose.model<IPageView>('PageView', PageViewSchema);
