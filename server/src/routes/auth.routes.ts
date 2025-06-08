import { Router } from 'express';
import authController from '../controllers/auth.controllers';
import uploadUseCases from '../middlewares/upload';

const authRouter: Router = Router();
authRouter.post(
  '/register',
  uploadUseCases.uploadMiddleware.single('avatar'),
  uploadUseCases.uploadToSupabase, // Middleware to handle file upload and upload to Supabase
  authController.register
);

export default authRouter;