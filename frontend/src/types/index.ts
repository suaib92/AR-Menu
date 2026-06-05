export interface IMenuItem {
  _id: string;
  restaurantId: string;
  name: string;
  price: string;
  description: string;
  category: string;
  calories?: string;
  time?: string;
  image?: string;     // emoji icon
  imageUrl?: string;  // high-res food photo for the 3D viewer
  status: 'Active' | 'Draft';
  variants?: { name: string; price: string }[];
}

export interface IOrder {
  _id: string;
  restaurantId: string;
  customerName: string;
  tableNumber: string;
  items: IMenuItem[];
  totalAmount: number | string;
  currency: string;
  ticketId?: string;
  status: 'pending' | 'preparing' | 'delivering' | 'completed' | 'paid' | 'payment_requested' | 'payment_verifying';
  createdAt: string;
  updatedAt: string;
}

export interface ITicket {
  _id: string;
  restaurantId: string;
  tableNumber: string;
  primaryName: string;
  status: 'open' | 'closed';
  totalAmount: number;
  createdBySession?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ISettings {
  restaurantName: string;
  upiId: string;
  themeColor: string;
  currency: string;
}
