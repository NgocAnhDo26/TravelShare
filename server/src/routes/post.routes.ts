import { Router, Request, Response, NextFunction } from 'express';
import PostController from '../controllers/post.controllers';
import uploadUseCases from '../middlewares/upload';
import AuthJwtMiddleware from '../middlewares/authJwt';

const postRouter: Router = Router();

// Create a more robust upload middleware
const handleUploads = [
  // First verify the user is authenticated
  AuthJwtMiddleware.verifyToken,

  // Handle the files using a single multer instance
  (req: Request, res: Response, next: NextFunction) => {
    // Use a single multer call that can handle both fields
    const uploadMiddleware = uploadUseCases.uploadMiddleware.fields([
      { name: 'coverImage', maxCount: 1 },
      { name: 'images', maxCount: 10 },
    ]);

    uploadMiddleware(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },

  // Process cover image if it exists
  (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files && files['coverImage'] && files['coverImage'][0]) {
      const file = files['coverImage'][0];
      uploadUseCases
        .uploadFileToSupabase(file, 'post-covers')
        .then((fileUrl) => {
          req.body.coverImageUrl = fileUrl; // Changed from fileUrl to coverImageUrl for clarity
          console.log('Cover image uploaded:', fileUrl);
          next();
        })
        .catch((error) => {
          console.error('Error uploading cover image:', error);
          return res.status(500).json({ error: 'Failed to upload cover image' });
        });
    } else {
      next();
    }
  },
  // Process additional images if they exist
  (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files && files['images'] && files['images'].length > 0) {
      const imageFiles = files['images'];
      const imagePromises = imageFiles.map((file) =>
        uploadUseCases.uploadFileToSupabase(file, 'post-images'),
      );

      Promise.all(imagePromises)
        .then((imageUrls) => {
          req.body.images = imageUrls;
          console.log('Images uploaded:', imageUrls);
          next();
        })
        .catch((error) => {
          console.error('Error uploading images:', error);
          return res.status(500).json({ error: 'Failed to upload images' });
        });
    } else {
      next();
    }
  },

  // Finally process the post
  PostController.createPost,
];

postRouter.post('/create', handleUploads);

export default postRouter;