import { Router } from 'express';
import UserController from '../controllers/user.controllers';
import AuthJwtMiddleware from '../middlewares/authJwt';
import uploadUseCases from '../middlewares/upload';


const router = Router();


router.get(
  '/profile',
  AuthJwtMiddleware.verifyToken, 
  UserController.getProfile
);


router.put(
  '/profile',
  [
    AuthJwtMiddleware.verifyToken,
    uploadUseCases.uploadMiddleware.single('avatar'),
  uploadUseCases.uploadToSupabase,
  ],
  UserController.updateProfile
);

export default router;