import { Router } from 'express';
import {
  FollowController,
  UserController,
} from '../controllers/user.controllers';
import AuthJwtMiddleware from '../middlewares/authJwt';
import uploadUseCases from '../middlewares/upload';
import { getLikedTargetsByUser } from '../controllers/like.controllers';

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
  '/:id/is-following',
  AuthJwtMiddleware.verifyToken,
  FollowController.isFollowing,
);

/** Get user (only current user) edit profile */
router.get(
  '/edit-profile',
  AuthJwtMiddleware.verifyToken,
  UserController.getEditProfile,
);

/** Update user profile (only current user) */
router.put(
  '/edit-profile',
  AuthJwtMiddleware.verifyToken,
  uploadUseCases.singleFileUpload('avatar', 'avatars'),
  UserController.updateProfile,
);

// Get all liked targets by current user (authenticated)
router.get('/likes', AuthJwtMiddleware.verifyToken, getLikedTargetsByUser);

// --- Public Routes ---
/** Get user profile (current user or any user) */
router.get('/:id/profile', UserController.getProfile);

export default router;
