import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../constants/http';
import DiscoveryService from '../services/discovery.service';
import { LikeService } from '../services/like.service';
import { Types } from 'mongoose'; // <-- Added import

/**
 * Attach isLiked to any array of items (plans, posts, etc.) based on likes array.
 * @param items Array of items (must have _id)
 * @param likes Array of likes (must have targetId)
 * @returns Array of items with isLiked property
 */
function attachIsLikedToItems(items: any[], likes: any[]): any[] {
  const likedMap: Record<string, boolean> = likes.reduce(
    (acc: Record<string, boolean>, like: any) => {
      acc[like.targetId.toString()] = true;
      return acc;
    },
    {},
  );
  return items.map((item: any) => ({
    ...(item.toObject?.() || item),
    isLiked: likedMap[item._id.toString()] || false,
  }));
}

class DiscoveryController {
  public async getTrendings(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const after = req.query.after as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;
      const userId = req.user as string | undefined;

      const trendings = await DiscoveryService.getTrendings({ limit, after });

      // Check for likes if user is authenticated
      let likes: any[] = [];
      if (userId && trendings.data.length > 0) {
        likes = await LikeService.getUserLikesForTargets({
          userId: new Types.ObjectId(userId),
          targetIds: trendings.data.map((plan: any) => plan._id),
          onModel: 'TravelPlan',
        });
      }

      res.status(HTTP_STATUS.OK).json({
        data: attachIsLikedToItems(trendings.data, likes),
        pagination: trendings.pagination,
      });
    } catch (error) {
      next(error); // Delegate to the central error handler
    }
  }

  public async getPlans(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { q: query } = req.query;
      const userId = req.user as string | undefined;
      const plans = await DiscoveryService.getPlans(query as string, userId);

      // Check for likes if user is authenticated
      let likes: any[] = [];
      if (userId && plans.length > 0) {
        likes = await LikeService.getUserLikesForTargets({
          userId: new Types.ObjectId(userId),
          targetIds: plans.map((plan: any) => plan._id),
          onModel: 'TravelPlan',
        });
      }

      res.status(HTTP_STATUS.OK).json(attachIsLikedToItems(plans, likes));
    } catch (error) {
      next(error);
    }
  }

  public async getPosts(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { q: query } = req.query;
      const userId = req.user as string | undefined;
      const posts = await DiscoveryService.getPosts(query as string, userId);

      // Check for likes if user is authenticated
      let likes: any[] = [];
      if (userId && posts.length > 0) {
        likes = await LikeService.getUserLikesForTargets({
          userId: new Types.ObjectId(userId),
          targetIds: posts.map((post: any) => post._id),
          onModel: 'Post', // Assuming 'Post' is a valid model for likes
        });
      }

      res.status(HTTP_STATUS.OK).json(attachIsLikedToItems(posts, likes));
    } catch (error) {
      next(error);
    }
  }

  public async getPeople(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { q: query } = req.query;
      const userId = req.user as string | undefined;
      const people = await DiscoveryService.getPeople(query as string, userId);
      res.status(HTTP_STATUS.OK).json(people);
    } catch (error) {
      next(error);
    }
  }
}

export const discoveryController = new DiscoveryController();
