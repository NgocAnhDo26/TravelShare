import { Router } from 'express';
import UserController from '../controllers/user.controllers';
// This import now works correctly because authJwt.ts exports a named `authenticate` function.
import { authenticate } from '../middlewares/authJwt';

const router = Router();

// --- Authenticated Routes ---
router.post('/:id/follow', authenticate, UserController.follow);
router.delete('/:id/follow', authenticate, UserController.unfollow);

// --- Public Routes ---
router.get('/:id/followers', UserController.getFollowers);
router.get('/:id/following', UserController.getFollowing);

// --- Routes for Counts ---
router.get('/:id/followers/count', UserController.getFollowerCount);
router.get('/:id/following/count', UserController.getFollowingCount);

export default router;