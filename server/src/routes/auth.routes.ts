import { Router } from 'express';
import authController from '../controllers/auth.controllers';
import uploadUseCases from '../middlewares/upload';

const authRouter: Router = Router();
authRouter.post(
  '/register',
  uploadUseCases.uploadMiddleware.single('avatar'),
  uploadUseCases.uploadToSupabase, // Middleware to handle file upload and upload to Supabase
  authController.register,
);

authRouter.post('/login', authController.login);
authRouter.post('/verify-token', authController.verifyToken);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password', authController.resetPassword);

export default authRouter;
