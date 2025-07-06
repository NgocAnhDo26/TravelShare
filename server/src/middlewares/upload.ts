import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import supabase from '../config/supabase.config';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
  ) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
        ),
      );
    }
    cb(null, true);
  },
});

async function uploadFileToSupabase(
  file: Express.Multer.File,
): Promise<string> {
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

// Middleware to handle file upload and upload to Supabase
const uploadToSupabase = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.file) {
    return next(); // No file uploaded, continue
  }

  try {
    const publicUrl = await uploadFileToSupabase(req.file);

    // Add the Supabase URL to the request object
    req.body.fileUrl = publicUrl;

    // Also update the file object with the Supabase URL
    req.file.path = publicUrl;
    req.file.filename = publicUrl.split('/').pop() || '';

    console.log('File uploaded to Supabase:', publicUrl);
    next();
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    res.status(500).json({ error: 'Failed to upload file to storage' });
  }
};

const uploadUseCases = {
  uploadMiddleware: upload,
  uploadFileToSupabase,
  uploadToSupabase,

  // Convenience method that combines multer + Supabase upload
  singleFileUpload: (fieldName: string) => [
    upload.single(fieldName),
    uploadToSupabase,
  ],
};

export default uploadUseCases;
