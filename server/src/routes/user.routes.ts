import { Router } from 'express';
import { FollowController, UserController } from '../controllers/user.controllers';
import AuthJwtMiddleware from '../middlewares/authJwt';
import uploadUseCases from '../middlewares/upload';

const router = Router();

router.get(
  '/edit-profile',
  AuthJwtMiddleware.verifyToken, 
  UserController.getEditProfile
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

// --- Authenticated Routes ---
router.post('/:id/follow', AuthJwtMiddleware.verifyToken, FollowController.follow);
router.delete('/:id/follow', AuthJwtMiddleware.verifyToken, FollowController.unfollow);

// --- Public Routes ---
router.get('/:id/followers', FollowController.getFollowers);
router.get('/:id/following', FollowController.getFollowing);

// --- Routes for Counts ---
router.get('/:id/followers/count', FollowController.getFollowerCount);
router.get('/:id/following/count', FollowController.getFollowingCount);

// --- Public Route to Get User Info ---
router.get('/:id', UserController.getUserInfo);

export default router;