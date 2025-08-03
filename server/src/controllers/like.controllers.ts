import { Request, Response, NextFunction } from 'express';
import { LikeService } from '../services/like.service';
import { Types } from 'mongoose';
import TravelPlan from '../models/travelPlan.model';

/**
 * Like a target (TravelPlan or Post)
 * POST /api/v1/:onModel/:targetId/like
 */
export const likeTarget = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { onModel, targetId } = req.params;
    const userId = req.user as string;

    if (!userId) {
      res
        .status(401)
        .json({ message: 'You are not authorized to perform this action.' });
      return;
    }
    if (
      !Types.ObjectId.isValid(targetId) ||
      !['TravelPlan', 'Post'].includes(onModel)
    ) {
      res.status(400).json({ message: 'Invalid parameters.' });
      return;
    }

    const result = await LikeService.likeTarget({
      userId: new Types.ObjectId(userId),
      targetId: new Types.ObjectId(targetId),
      onModel: onModel as 'TravelPlan' | 'Post',
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * Unlike a target (TravelPlan or Post)
 * DELETE /api/v1/:onModel/:targetId/like
 */
export const unlikeTarget = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { onModel, targetId } = req.params;
    const userId = req.user as string;

    if (!userId) {
      res
        .status(401)
        .json({ message: 'You are not authorized to perform this action.' });
      return;
    }
    if (
      !Types.ObjectId.isValid(targetId) ||
      !['TravelPlan', 'Post'].includes(onModel)
    ) {
      res.status(400).json({ message: 'Invalid parameters.' });
      return;
    }

    const result = await LikeService.unlikeTarget({
      userId: new Types.ObjectId(userId),
      targetId: new Types.ObjectId(targetId),
      onModel: onModel as 'TravelPlan' | 'Post',
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * Get users who liked a target (TravelPlan or Post)
 * GET /api/v1/:onModel/:targetId/likes?page=1&limit=20
 */
export const getUsersWhoLiked = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { onModel, targetId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (
      !Types.ObjectId.isValid(targetId) ||
      !['TravelPlan', 'Post'].includes(onModel)
    ) {
      res.status(400).json({ message: 'Invalid parameters.' });
      return;
    }

    const users = await LikeService.getUsersWhoLiked({
      targetId: new Types.ObjectId(targetId),
      onModel: onModel as 'TravelPlan' | 'Post',
      page,
      limit,
    });

    res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all liked targets by user id (optionally filtered by onModel)
 * GET /api/v1/likes/user/:userId?onModel=TravelPlan|Post
 */
export const getLikedTargetsByUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user as string;
    const { onModel } = req.query;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: 'Invalid userId.' });
      return;
    }
    // Only support TravelPlan for now
    const model = (onModel as string) || 'TravelPlan';
    if (model !== 'TravelPlan') {
      res.status(400).json({
        message: 'Only TravelPlan likes are supported in this endpoint.',
      });
      return;
    }

    // 1. Get all Like docs for this user and TravelPlan
    const likes = await LikeService.getLikedTargetsByUser({
      userId: new Types.ObjectId(userId),
      onModel: 'TravelPlan',
    });
    const targetIds = likes.map((like) => like.targetId);

    // 2. Fetch all TravelPlans with those IDs
    let travelPlans: any[] = [];
    if (targetIds.length > 0) {
      travelPlans = await TravelPlan.find({ _id: { $in: targetIds } });
    }

    // 3. Attach isLiked: true to each plan
    const result = travelPlans.map((plan) => ({
      ...(plan.toObject?.() || plan),
      isLiked: true,
    }));

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getCurrentUserLikesForTargets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user as string;
    const { onModel, targetIds } = req.query;

    if (!onModel || !targetIds || typeof targetIds !== 'string' || !['TravelPlan', 'Post', 'Comment'].includes(onModel as string)) {
      return res.status(400).json({ error: 'onModel and targetIds (comma-separated string) are required.' });
    }

    const targetIdsArray = (targetIds as string).split(',').filter(id => Types.ObjectId.isValid(id));
    
    if (targetIdsArray.length === 0) {
        return res.status(200).json([]);
    }

    const likes = await LikeService.getUserLikesForTargets({
        userId: new Types.ObjectId(userId),
        targetIds: targetIdsArray,
        onModel: onModel as 'TravelPlan' | 'Post' | 'Comment'
    });
    
    const likedTargetIds = likes.map(like => like.targetId.toString());

    res.status(200).json(likedTargetIds);
  } catch (err) {
    next(err);
  }
};
