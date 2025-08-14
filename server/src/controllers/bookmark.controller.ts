import { Request, Response, NextFunction } from 'express';
import BookmarkService from '../services/bookmark.service';
import { SupportedModels } from '../models/bookmark.model';

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<Response | void>;
const asyncHandler =
  (fn: AsyncHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

const BookmarkController = {
  toggleBookmark: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user as string;
    const { id: targetId } = req.params;
    const onModel = (req as any).onModel as SupportedModels;

    const result = await BookmarkService.toggleBookmark(
      userId,
      targetId,
      onModel,
    );
    res.status(200).json(result);
  }),

  getMyBookmarks: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user as string;
    const filter = (req.query.filter as string) || 'all';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!['all', 'plans', 'posts'].includes(filter)) {
      return res.status(400).json({ message: 'Invalid filter type.' });
    }

    const result = await BookmarkService.getBookmarksForUser(
      userId,
      filter as 'all' | 'plans' | 'posts',
      page,
      limit,
    );
    res.status(200).json(result);
  }),

  getMyBookmarkIds: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user as string;
    const ids = await BookmarkService.getBookmarkIdsForUser(userId);
    res.status(200).json(ids);
  }),
};

export default BookmarkController;
