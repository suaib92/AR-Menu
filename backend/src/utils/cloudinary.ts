import { v2 as cloudinary } from 'cloudinary';
import path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (filePath: string): Promise<string> => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'ar-menu',
    resource_type: 'image',
  });
  return result.secure_url;
};

export const uploadPortraitMockup = async (filePath: string): Promise<string> => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'ar-menu',
    resource_type: 'image',
    transformation: [
      { aspect_ratio: '3:4', crop: 'fill', gravity: 'auto' },
      { effect: 'auto_brightness' },
      { effect: 'auto_contrast' },
      { effect: 'sharpen' },
    ],
  });
  return result.secure_url;
};

export const uploadBufferToCloudinary = async (
  buffer: Buffer,
  originalName: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'ar-menu',
        resource_type: 'image',
        public_id: `${Date.now()}-${path.parse(originalName).name}`,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary upload failed'));
        } else {
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(buffer);
  });
};
