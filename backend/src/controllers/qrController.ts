import { Request, Response, NextFunction } from 'express';
import QrCode from '../models/QrCode';
import PageView from '../models/PageView';
import { AuthRequest } from '../middleware/auth';

// List QR codes for the authenticated user's restaurant.
export const listQrCodes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      res.status(400);
      throw new Error('No restaurant associated with this account');
    }
    const codes = await QrCode.find({ restaurantId: String(restaurantId) }).sort({ createdAt: -1 });
    res.json(codes);
  } catch (error) {
    next(error);
  }
};

// Create a new QR code for the authenticated user's restaurant.
export const createQrCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      res.status(400);
      throw new Error('No restaurant associated with this account');
    }
    const { label, tableNumber, targetUrl } = req.body as {
      label?: string;
      tableNumber?: string;
      targetUrl?: string;
    };
    if (!targetUrl) {
      res.status(400);
      throw new Error('targetUrl is required');
    }
    const code = await QrCode.create({
      restaurantId: String(restaurantId),
      createdBy: String(req.user!._id),
      label: (label || 'Table QR').toString().slice(0, 64),
      tableNumber: tableNumber ? tableNumber.toString().slice(0, 32) : undefined,
      targetUrl: targetUrl.toString().slice(0, 1024),
    });
    res.status(201).json(code);
  } catch (error) {
    next(error);
  }
};

// Update a QR code (label, table, active).
export const updateQrCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      res.status(400);
      throw new Error('No restaurant associated with this account');
    }
    const existing = await QrCode.findById(req.params.id);
    if (!existing) {
      res.status(404);
      throw new Error('QR code not found');
    }
    if (String(existing.restaurantId) !== String(restaurantId)) {
      res.status(403);
      throw new Error('Not authorized');
    }
    const updated = await QrCode.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// Delete a QR code.
export const deleteQrCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      res.status(400);
      throw new Error('No restaurant associated with this account');
    }
    const existing = await QrCode.findById(req.params.id);
    if (!existing) {
      res.status(404);
      throw new Error('QR code not found');
    }
    if (String(existing.restaurantId) !== String(restaurantId)) {
      res.status(403);
      throw new Error('Not authorized');
    }
    await QrCode.findByIdAndDelete(req.params.id);
    res.json({ message: 'QR code deleted' });
  } catch (error) {
    next(error);
  }
};

// Public endpoint: record a QR scan (called when a customer opens the menu URL).
export const recordScan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const code = await QrCode.findById(id);
    if (!code || !code.isActive) {
      res.status(404);
      throw new Error('QR code not found');
    }
    code.scanCount += 1;
    code.lastScannedAt = new Date();
    await code.save();

    // Best-effort analytics event
    try {
      await PageView.create({
        restaurantId: code.restaurantId,
        viewType: 'qr_scan',
      });
    } catch {
      /* swallow */
    }

    res.json({ ok: true, scanCount: code.scanCount });
  } catch (error) {
    next(error);
  }
};
