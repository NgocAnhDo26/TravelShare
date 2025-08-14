import { Router, Request, Response, NextFunction } from 'express';
import AuthJwtMiddleware from '../middlewares/authJwt';
import BookmarkController from '../controllers/bookmark.controller';
import { SupportedModels } from '../models/bookmark.model';

export function createBookmarkRoutes(onModel: SupportedModels) {
  const router = Router({ mergeParams: true });

  router.post(
    '/:id/bookmark',
    AuthJwtMiddleware.verifyToken,
    (req: Request, res: Response, next: NextFunction) => {
      (req as any).onModel = onModel;
      next();
    },
    BookmarkController.toggleBookmark,
  );

  return router;
}

const bookmarkRouter = Router();

bookmarkRouter.get(
  '/me',
  AuthJwtMiddleware.verifyToken,
  BookmarkController.getMyBookmarks,
);

bookmarkRouter.get(
  '/me/ids',
  AuthJwtMiddleware.verifyToken,
  BookmarkController.getMyBookmarkIds,
);

export default bookmarkRouter;
