import { Router } from 'express';
import AuthJwtMiddleware from '../middlewares/authJwt';
import { getUsersWhoLiked, getCurrentUserLikesForTargets } from '../controllers/like.controllers';
import { Like } from '../models/like.model';
import { likeTarget, unlikeTarget } from '../controllers/like.controllers';

/**
 * Factory to create like routes for a given model (TravelPlan or Post)
 * Merges like/unlike into a single POST /:id/like endpoint (toggle)
 */
export function createLikeRoutes(onModel: 'TravelPlan' | 'Post') {
  const router = Router();

  // Toggle Like/Unlike
  router.post(
    '/:id/like',
    AuthJwtMiddleware.verifyToken,
    async (req, res, next) => {
      try {
        const userId = req.user as string;
        const targetId = req.params.id;
        (req.params as any).onModel = onModel;
        (req.params as any).targetId = targetId;

        // Check if already liked
        const existing = await Like.findOne({
          user: userId,
          targetId,
          onModel,
        });

        if (existing) {
          // Unlike if already liked
          return unlikeTarget(req, res, next);
        } else {
          // Like if not liked yet
          return likeTarget(req, res, next);
        }
      } catch (err) {
        next(err);
      }
    }
  );

  // Get users who liked
  router.get(
    '/:id/likes',
    (req, res, next) => {
      (req.params as any).onModel = onModel;
      (req.params as any).targetId = req.params.id;
      return getUsersWhoLiked(req, res, next);
    }
  );

  return router;
}
const likeRouter = Router();

likeRouter.get(
    '/me/targets',
    AuthJwtMiddleware.verifyToken,
    getCurrentUserLikesForTargets
);

export { likeRouter };