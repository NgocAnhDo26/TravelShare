import { Like, ILike } from '../models/like.model';
import TravelPlan from '../models/travelPlan.model';
import Post from '../models/post.model';
import { Types } from 'mongoose';
import Follow from '../models/follow.model';
type OnModel = 'Post' | 'TravelPlan' | 'Comment';

export interface LikeFilter {
  user: Types.ObjectId;
  onModel?: OnModel;
}

export class LikeService {
  /**
   * Like a post or travel plan (idempotent)
   */
  static async likeTarget({
    userId,
    targetId,
    onModel,
  }: {
    userId: Types.ObjectId;
    targetId: Types.ObjectId;
    onModel: OnModel;
  }): Promise<{ liked: boolean }> {
    // Check if already liked
    const existing = await Like.findOne({ user: userId, targetId, onModel });
    if (existing) return { liked: true };

    // Create like
    await Like.create({ user: userId, targetId, onModel });

    // Increment like count on target
    if (onModel === 'TravelPlan') {
      await TravelPlan.updateOne(
        { _id: targetId },
        { $inc: { likesCount: 1 } },
      );
    } else if (onModel === 'Post') {
      await Post.updateOne({ _id: targetId }, { $inc: { likesCount: 1 } });
    }

    return { liked: true };
  }

  /**
   * Unlike a post or travel plan (idempotent)
   */
  static async unlikeTarget({
    userId,
    targetId,
    onModel,
  }: {
    userId: Types.ObjectId;
    targetId: Types.ObjectId;
    onModel: OnModel;
  }): Promise<{ unliked: boolean }> {
    const result = await Like.deleteOne({ user: userId, targetId, onModel });
    if (result.deletedCount) {
      // Decrement like count on target
      if (onModel === 'TravelPlan') {
        await TravelPlan.updateOne(
          { _id: targetId },
          { $inc: { likesCount: -1 } },
        );
      } else if (onModel === 'Post') {
        await Post.updateOne({ _id: targetId }, { $inc: { likesCount: -1 } });
      }
      return { unliked: true };
    }
    return { unliked: false };
  }

  /**
   * Get users who liked a post or travel plan (paginated)
   */
  static async getUsersWhoLiked({
    targetId,
    onModel,
    page = 1,
    limit = 20,
    currentUserId,
  }: {
    targetId: Types.ObjectId;
    onModel: OnModel;
    page?: number;
    limit?: number;
    currentUserId?: Types.ObjectId;
  }) {
    const matchQuery = { targetId: new Types.ObjectId(targetId), onModel };
    const skip = (page - 1) * limit;

    const [likers, totalLikes] = await Promise.all([
      Like.aggregate([
        { $match: matchQuery },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userDetails',
          },
        },
        { $unwind: '$userDetails' },
        { $replaceRoot: { newRoot: '$userDetails' } },
        { $project: { _id: 1, username: 1, displayName: 1, avatarUrl: 1 } },
      ]),
      Like.countDocuments(matchQuery),
    ]);

    if (!likers.length) {
      return { users: [], totalPages: 0, currentPage: page };
    }

    let followingSet = new Set();
    if (currentUserId) {
      const likerIds = likers.map((l) => l._id);
      const followingRelations = await Follow.find({
        follower: currentUserId,
        following: { $in: likerIds },
      })
        .select('following')
        .lean();

      followingSet = new Set(
        followingRelations.map((f) => f.following.toString()),
      );
    }

    const usersWithFollowStatus = likers.map((user) => ({
      ...user,
      isFollowing: currentUserId
        ? followingSet.has(user._id.toString())
        : false,
    }));

    return {
      users: usersWithFollowStatus,
      totalPages: Math.ceil(totalLikes / limit),
      currentPage: page,
    };
  }

  /**
   * Check if a user has liked a specific target (TravelPlan or Post)
   */
  static async isLiked({
    userId,
    targetId,
    onModel,
  }: {
    userId: Types.ObjectId;
    targetId: Types.ObjectId;
    onModel: OnModel;
  }): Promise<boolean> {
    const existing = await Like.findOne({ user: userId, targetId, onModel });
    return !!existing;
  }

  /**
   * Get all Like documents for a user and a list of target IDs
   */
  static async getUserLikesForTargets({
    userId,
    targetIds,
    onModel,
  }: {
    userId: Types.ObjectId;
    targetIds: (Types.ObjectId | string)[];
    onModel: OnModel;
  }) {
    return Like.find({
      user: userId,
      targetId: { $in: targetIds },
      onModel,
    });
  }

  /**
   * Get all liked targets by user id (optionally filtered by onModel)
   */
  static async getLikedTargetsByUser({
    userId,
    onModel,
  }: {
    userId: Types.ObjectId;
    onModel?: OnModel;
  }) {
    const filter: LikeFilter = { user: userId };
    if (onModel) filter.onModel = onModel;
    return Like.find(filter);
  }
}
