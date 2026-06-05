import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/models');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Sanitize filename and add timestamp to avoid collisions
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}-${sanitized}`);
  }
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedImage = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];
  if (allowedImage.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only .jpg, .png, or .webp files are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

import { uploadToCloudinary } from '../utils/cloudinary';

export const uploadManualImage = async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ message: 'No image uploaded' });
    return;
  }
  const imagePath = req.file.path;
  try {
    const cloudinaryUrl = await uploadToCloudinary(imagePath);
    fs.unlink(imagePath, (err) => {
      if (err) console.error('Failed to delete temp file:', err);
    });
    res.json({ imageUrl: cloudinaryUrl });
  } catch (error: any) {
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    res.status(500).json({ message: error.message || 'Failed to upload image' });
  }
};
