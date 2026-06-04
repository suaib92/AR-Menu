import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded 3D model files statically
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

import authRoutes from './routes/authRoutes';
import restaurantRoutes from './routes/restaurantRoutes';
import menuRoutes from './routes/menuRoutes';
import orderRoutes from './routes/orderRoutes';
import settingsRoutes from './routes/settingsRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { upload } from './controllers/uploadController';
import { analyzeFood } from './controllers/geminiController';
import { protect } from './middleware/auth';

// Basic Route
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'AR Smart Menu API is running...' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.post('/api/menu/analyze-food', protect, upload.single('image'), analyzeFood);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
