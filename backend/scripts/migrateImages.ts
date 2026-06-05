import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadsDir = path.resolve(process.cwd(), 'uploads/models');

async function migrate() {
  console.log('MONGO_URI:', process.env.MONGO_URI ? 'found' : 'missing');
  console.log('Uploads dir:', uploadsDir);
  console.log('Uploads exists:', fs.existsSync(uploadsDir));

  await mongoose.connect(process.env.MONGO_URI as string, {
    tlsAllowInvalidCertificates: true,
    serverSelectionTimeoutMS: 10000,
  });

  const items = await mongoose.connection.db.collection('menuitems').find({
    imageUrl: { $regex: '^/uploads/' }
  }).toArray();

  console.log(`Found ${items.length} menu items with local imageUrl`);

  for (const item of items) {
    const localPath = path.join(uploadsDir, path.basename(item.imageUrl));
    if (!fs.existsSync(localPath)) {
      console.log(`  ✗ File not found: ${localPath}`);
      continue;
    }
    try {
      const result = await cloudinary.uploader.upload(localPath, {
        folder: 'ar-menu',
        resource_type: 'image',
        transformation: [
          { aspect_ratio: '3:4', crop: 'fill', gravity: 'auto' },
          { effect: 'auto_brightness' },
          { effect: 'auto_contrast' },
          { effect: 'sharpen' },
        ],
      });
      await mongoose.connection.db.collection('menuitems').updateOne(
        { _id: item._id },
        { $set: { imageUrl: result.secure_url } }
      );
      console.log(`  ✓ ${item.name} → ${result.secure_url}`);
    } catch (err: any) {
      console.log(`  ✗ ${item.name}: ${err.message}`);
    }
  }

  await mongoose.disconnect();
  console.log('Done!');
}

migrate().catch(console.error);
