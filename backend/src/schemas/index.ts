import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  restaurantName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const menuItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120, 'Name too long'),
  price: z.string().min(1, 'Price is required').max(40, 'Price too long'),
  description: z.string().max(2000, 'Description too long').optional().default(''),
  category: z.string().max(60).optional().default('Mains'),
  calories: z.string().max(40).optional(),
  time: z.string().max(40).optional(),
  image: z.string().max(2000).optional(),
  imageUrl: z.string().url('imageUrl must be a valid URL').max(2000).optional().or(z.literal('')),
  status: z.enum(['Active', 'Draft']).optional().default('Active'),
  variants: z
    .array(
      z.object({
        name: z.string().min(1).max(60),
        price: z.string().min(1).max(40),
      })
    )
    .max(20, 'Too many variants')
    .optional()
    .default([]),
});

export const orderSchema = z.object({
  restaurantId: z.string().min(1, 'Restaurant ID is required').max(64),
  customerName: z
    .string()
    .min(1, 'Customer name is required')
    .max(60, 'Customer name too long')
    .transform((s) => s.replace(/[\u0000-\u001F\u007F]/g, '').trim()),
  tableNumber: z.string().min(1, 'Table number is required').max(40),
  items: z.array(z.object({
    name: z.string().min(1).max(120),
    price: z.string().min(1).max(40),
    quantity: z.number().int().positive().optional(),
  })).min(1, 'At least one item is required').max(50, 'Too many items'),
  totalAmount: z.number().positive('Total amount must be positive').max(1_000_000, 'Amount too large'),
});

export const orderStatusSchema = z.object({
  status: z.enum(['pending', 'preparing', 'delivering', 'completed', 'paid', 'payment_requested', 'payment_verifying']),
});

export const settingsSchema = z.object({
  restaurantName: z.string().min(1).max(120).optional(),
  upiId: z
    .string()
    .max(120)
    .regex(/^[a-zA-Z0-9._\-@]{3,120}$/, 'Invalid UPI ID format')
    .optional()
    .or(z.literal('')),
  themeColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color')
    .optional(),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP']).optional(),
});

export const restaurantUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).optional(),
  logoUrl: z.string().url().max(2000).optional().or(z.literal('')),
  coverImageUrl: z.string().url().max(2000).optional().or(z.literal('')),
  settings: z
    .object({
      currency: z.enum(['INR', 'USD', 'EUR', 'GBP']).optional(),
      upiId: z.string().max(120).optional().or(z.literal('')),
      theme: z
        .object({
          primaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
          secondaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
        })
        .optional(),
    })
    .optional(),
  isActive: z.boolean().optional(),
});

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url('endpoint must be a valid URL'),
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(100),
  }),
  expirationTime: z.number().nullable().optional(),
});

export const upiLinkSchema = z.object({
  restaurantId: z.string().min(1, 'Restaurant ID is required'),
  amount: z.number().positive('Amount must be positive'),
  customerName: z.string().optional(),
  tableNumber: z.string().optional(),
});
