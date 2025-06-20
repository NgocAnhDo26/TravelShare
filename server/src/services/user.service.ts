import { Types } from 'mongoose';
import Follow, { IFollow } from '../models/follow.model';
import User from '../models/user.model';

/**
 * @interface IFollowService
 * @description Defines the shape of the FollowService, outlining all its methods.
 */
interface IFollowService {
  followUser(followerId: string, followingId: string): Promise<IFollow>;
  unfollowUser(followerId: string, followingId: string): Promise<{ deletedCount?: number }>;
  getFollowerCount(userId: string): Promise<number>;
  getFollowingCount(userId: string): Promise<number>;
  getFollowers(userId: string, options: { page: number; limit: number }): Promise<IFollow[]>;
  getFollowing(userId: string, options: { page: number; limit: number }): Promise<IFollow[]>;
}

/**
 * @const FollowService
 * @description A service object to handle all follow-related business logic.
 */
const FollowService: IFollowService = {
  /**
   * Creates a follow relationship between two users.
   */
  async followUser(followerId: string, followingId: string): Promise<IFollow> {
    // 1. Prevent a user from following themselves
    if (followerId === followingId) {
      throw new Error('You cannot follow yourself.');
    }

    // 2. Verify both users exist in the database
    const usersExist = await User.countDocuments({
      _id: { $in: [followerId, followingId] },
    });

    if (usersExist !== 2) {
      throw new Error('One or both users do not exist.');
    }

    // 3. Check if the follow relationship already exists
    const existingFollow = await Follow.findOne({
      follower_id: followerId,
      following_id: followingId,
    });

    if (existingFollow) {
      throw new Error('You are already following this user.');
    }

    // 4. Create and save the new follow document
    const follow = new Follow({
      follower_id: followerId,
      following_id: followingId,
    });

    return follow.save();
  },

  /**
   * Deletes a follow relationship between two users.
   */
  async unfollowUser(followerId: string, followingId: string): Promise<{ deletedCount?: number }> {
    const result = await Follow.deleteOne({
      follower_id: followerId,
      following_id: followingId,
    });

    if (result.deletedCount === 0) {
      throw new Error('You are not following this user.');
    }

    return result;
  },

  /**
   * Gets the total number of followers for a specific user.
   */
  async getFollowerCount(userId: string): Promise<number> {
    return Follow.countDocuments({ following_id: userId });
  },

  /**
   * Gets the total number of users a specific user is following.
   */
  async getFollowingCount(userId: string): Promise<number> {
    return Follow.countDocuments({ follower_id: userId });
  },

  /**
   * Retrieves a paginated list of a user's followers.
   */
  async getFollowers(userId: string, options: { page: number; limit: number }): Promise<IFollow[]> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    return Follow.find({ following_id: userId })
      .populate('follower_id', 'username displayName avatarUrl')
      .sort({ created_date: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  },

  /**
   * Retrieves a paginated list of users a user is following.
   */
  async getFollowing(userId: string, options: { page: number; limit: number }): Promise<IFollow[]> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    return Follow.find({ follower_id: userId })
      .populate('following_id', 'username displayName avatarUrl')
      .sort({ created_date: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  },
};

// Export the service object directly
export default FollowService;