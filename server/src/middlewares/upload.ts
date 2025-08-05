import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import supabase from '../config/supabase.config';

// Add a function to check if bucket exists and create it if it doesn't
async function ensureBucketExists(bucketName: string): Promise<void> {
  try {
    // Check if bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('Error checking buckets:', error);
      throw error;
    }

    console.log(
      'Available buckets:',
      buckets.map((b) => b.name),
    );
    const bucketExists = buckets.some((bucket) => bucket.name === bucketName);

    if (!bucketExists) {
      console.log(`Bucket ${bucketName} doesn't exist, creating...`);
      try {
        const { error: createError } = await supabase.storage.createBucket(
          bucketName,
          {
            public: true, // Make bucket public so files can be accessed
          },
        );

        if (createError) {
          // Check if error indicates the bucket already exists
          const errorStatus = (createError as any).status;
          const isAlreadyExistsError =
            (errorStatus === 400 || errorStatus === '400') &&
            createError.message &&
            createError.message.includes('already exists');

          if (isAlreadyExistsError) {
            console.log(
              `Bucket ${bucketName} already exists (detected during creation)`,
            );
          } else {
            console.error(`Error creating bucket ${bucketName}:`, createError);
            throw createError;
          }
        } else {
          console.log(`Bucket ${bucketName} created successfully`);
        }
      } catch (createErr: any) {
        // Handle the specific "already exists" error
        const errorStatus = createErr.status;
        const isAlreadyExistsError =
          (errorStatus === 400 || errorStatus === '400') &&
          createErr.message &&
          createErr.message.includes('already exists');

        if (isAlreadyExistsError) {
          console.log(`Bucket ${bucketName} already exists (caught exception)`);
        } else {
          throw createErr;
        }
      }
    } else {
      console.log(`Bucket ${bucketName} already exists`);
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    throw error;
  }
}

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
  bucketName: string = 'avatars',
): Promise<string> {
  try {
    // Ensure bucket exists before uploading
    await ensureBucketExists(bucketName);

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;

    console.log(
      `Attempting to upload file ${fileName} to bucket ${bucketName}...`,
    );

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error(`Supabase upload error for ${fileName}:`, error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    console.log(
      `File uploaded successfully. Public URL: ${publicUrlData.publicUrl}`,
    );

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadFileToSupabase:', error);
    throw error;
  }
}

// Middleware to handle file upload and upload to Supabase
const uploadToSupabase = async (
  req: Request,
  res: Response,
  next: NextFunction,
  bucketName: string = 'avatars',
) => {
  if (!req.file) {
    return next(); // No file uploaded, continue
  }

  try {
    const publicUrl = await uploadFileToSupabase(req.file, bucketName);

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

// Middleware to handle multiple file uploads and upload to Supabase
const uploadMultipleToSupabase = async (
  req: Request,
  res: Response,
  next: NextFunction,
  bucketName: string = 'post-images',
) => {
  if (!req.files || req.files.length === 0) {
    return next(); // No files uploaded, continue
  }
  try {
    const fileUrls: string[] = [];

    for (const file of req.files as Express.Multer.File[]) {
      const publicUrl = await uploadFileToSupabase(file, bucketName);
      fileUrls.push(publicUrl);
    }

    // Add the Supabase URLs to the request object
    req.body.images = fileUrls;

    // Also update each file object with the Supabase URL
    (req.files as Express.Multer.File[]).forEach((file, index) => {
      file.path = fileUrls[index];
      file.filename = fileUrls[index].split('/').pop() || '';
    });

    console.log('Files uploaded to Supabase:', fileUrls);
    next();
  } catch (error) {
    console.error('Error uploading files to Supabase:', error);
    res.status(500).json({ error: 'Failed to upload files to storage' });
  }
};

const uploadUseCases = {
  uploadMiddleware: upload,
  uploadFileToSupabase,
  uploadToSupabase,

  // Convenience method that combines multer + Supabase upload
  singleFileUpload: (fieldName: string, bucketName: string) => [
    upload.single(fieldName),
    (req: Request, res: Response, next: NextFunction) =>
      uploadToSupabase(req, res, next, bucketName),
  ],
  multipleFilesUpload: (fieldName: string, bucketName: string) => [
    upload.array(fieldName, 10), // Limit to 10 files
    (req: Request, res: Response, next: NextFunction) =>
      uploadMultipleToSupabase(req, res, next, bucketName),
  ],
};

export default uploadUseCases;
