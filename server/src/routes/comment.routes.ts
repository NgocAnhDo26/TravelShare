import { Router } from 'express';
import CommentController from '../controllers/comment.controller';

import AuthJwtMiddleware from '../middlewares/authJwt';

const commentRouter: Router = Router();

commentRouter.get('/', CommentController.getCommentsForTarget);
commentRouter.post(
  '/',
  [AuthJwtMiddleware.verifyToken],
  CommentController.addComment,
);
commentRouter.delete(
  '/:commentId',
  [AuthJwtMiddleware.verifyToken],
  CommentController.deleteComment,
);

export default commentRouter;
