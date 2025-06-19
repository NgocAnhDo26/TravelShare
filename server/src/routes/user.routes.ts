import { Router } from 'express';
import UserController from '../controllers/user.controllers';
import AuthJwtMiddleware from '../middlewares/authJwt';

const router = Router();

// --- Authenticated Routes ---
router.post('/:id/follow', AuthJwtMiddleware.verifyToken, UserController.follow);
router.delete('/:id/follow', AuthJwtMiddleware.verifyToken, UserController.unfollow);

// --- Public Routes ---
router.get('/:id/followers', UserController.getFollowers);
router.get('/:id/following', UserController.getFollowing);

// --- Routes for Counts ---
router.get('/:id/followers/count', UserController.getFollowerCount);
router.get('/:id/following/count', UserController.getFollowingCount);

export default router;