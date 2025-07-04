import { Router } from 'express';
import {
  FollowController,
  UserController,
} from '../controllers/user.controllers';
import AuthJwtMiddleware from '../middlewares/authJwt';
import uploadUseCases from '../middlewares/upload';

const router = Router();

// --- Authenticated Routes ---
router.post(
  '/:id/follow',
  AuthJwtMiddleware.verifyToken,
  FollowController.follow,
);
router.delete(
  '/:id/unfollow',
  AuthJwtMiddleware.verifyToken,
  FollowController.unfollow,
);

router.get(
  '/followers',
  AuthJwtMiddleware.verifyToken,
  FollowController.getFollowers,
);
router.get(
  '/following',
  AuthJwtMiddleware.verifyToken,
  FollowController.getFollowing,
);
router.get(
  '/profile',
  AuthJwtMiddleware.verifyToken,
  UserController.getProfile,
);

router.get(
  '/edit-profile',
  AuthJwtMiddleware.verifyToken,
  UserController.getEditProfile,
);

router.put(
  '/edit-profile',
  AuthJwtMiddleware.verifyToken,
  uploadUseCases.singleFileUpload('avatar'),
  UserController.updateProfile,
);

export default router;
