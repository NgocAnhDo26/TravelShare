import { Router } from 'express';
import authController from '../controllers/auth.controllers';
import uploadUseCases from '../middlewares/upload';

const authRouter: Router = Router();
authRouter.post(
  '/register',
  uploadUseCases.singleFileUpload('avatar'),
  authController.register,
);

authRouter.post('/login', authController.login);
authRouter.post('/verify-token', authController.verifyToken);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password', authController.resetPassword);
authRouter.post('/logout', authController.logout);
authRouter.post('/google-login', authController.googleLogin);
authRouter.post('/google-register', authController.googleRegister);

export default authRouter;
