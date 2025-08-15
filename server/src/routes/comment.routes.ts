import { Router, Request, Response, NextFunction } from 'express';
import AuthJwtMiddleware from '../middlewares/authJwt';
import CommentController from '../controllers/comment.controller';
import uploadUseCases from '../middlewares/upload';

type TargetModel = 'TravelPlan' | 'Post';

export function createCommentRoutes(onModel: TargetModel) {
  const router = Router({ mergeParams: true });

  router.get(
    '/:id/comments',
    (req: Request, res: Response, next: NextFunction) => {
      (req as any).onModel = onModel;
      next();
    },
    CommentController.getCommentsForTarget,
  );

  router.post(
    '/:id/comments',
    AuthJwtMiddleware.verifyToken,
    uploadUseCases.singleFileUpload('commentImage', 'comment-images'),
    (req: Request, res: Response, next: NextFunction) => {
      (req as any).onModel = onModel;
      next();
    },
    CommentController.addComment,
  );

  return router;
}

const commentActionRouter = Router();

commentActionRouter.patch(
  '/:commentId',
  AuthJwtMiddleware.verifyToken,
  CommentController.updateComment,
);

commentActionRouter.delete(
  '/:commentId',
  AuthJwtMiddleware.verifyToken,
  CommentController.deleteComment,
);

commentActionRouter.post(
  '/:commentId/like',
  AuthJwtMiddleware.verifyToken,
  CommentController.toggleLike,
);

commentActionRouter.get(
  '/:commentId/likes',
  AuthJwtMiddleware.optionalAuth,
  CommentController.getCommentLikers,
);

commentActionRouter.get(
  '/:commentId/replies',
  CommentController.getRepliesForComment,
);

export default commentActionRouter;
