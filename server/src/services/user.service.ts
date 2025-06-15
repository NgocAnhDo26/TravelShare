import { Types } from 'mongoose';
import Follow, { IFollow } from '../models/follow.model';
import User from '../models/user.model'; // We need the User model for existence checks

/**
 * @class FollowService
 * @description A service class to handle all follow-related business logic.
 */
class FollowService {
  /**
   * Creates a follow relationship between two users.
   * @param {string} followerId - The ID of the user who is initiating the follow.
   * @param {string} followingId - The ID of the user who is being followed.
   * @returns {Promise<IFollow>} The created follow document.
   * @throws {Error} If users do not exist, if a user tries to follow themselves, or if the relationship already exists.
   */
  public async followUser(followerId: string, followingId: string): Promise<IFollow> {
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
  }

  /**
   * Deletes a follow relationship between two users.
   * @param {string} followerId - The ID of the user who is unfollowing.
   * @param {string} followingId - The ID of the user who is being unfollowed.
   * @returns {Promise<{deletedCount?: number}>} The result of the delete operation.
   * @throws {Error} If the follow relationship does not exist.
   */
  public async unfollowUser(followerId: string, followingId: string): Promise<{ deletedCount?: number }> {
    const result = await Follow.deleteOne({
      follower_id: followerId,
      following_id: followingId,
    });

    if (result.deletedCount === 0) {
      throw new Error('You are not following this user.');
    }

    return result;
  }

  /**
   * Gets the total number of followers for a specific user.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<number>} The number of followers.
   */
  public async getFollowerCount(userId: string): Promise<number> {
    // This query is highly efficient due to the index on `following_id`
    return Follow.countDocuments({ following_id: userId });
  }

  /**
   * Gets the total number of users a specific user is following.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<number>} The number of users they are following.
   */
  public async getFollowingCount(userId: string): Promise<number> {
    // This query is efficient as `follower_id` is the first field in a compound index
    return Follow.countDocuments({ follower_id: userId });
  }

  /**
   * Retrieves a paginated list of a user's followers.
   * @param {string} userId - The ID of the user whose followers are to be fetched.
   * @param {{ page: number, limit: number }} options - Pagination options.
   * @returns {Promise<IFollow[]>} A list of follow documents, populated with follower details.
   */
  public async getFollowers(userId: string, options: { page: number; limit: number }): Promise<IFollow[]> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    return Follow.find({ following_id: userId })
      .populate('follower_id', 'username displayName avatarUrl') // Select fields from the User model to return
      .sort({ created_date: -1 }) // Show most recent followers first
      .skip(skip)
      .limit(limit)
      .exec();
  }

  /**
   * Retrieves a paginated list of users a user is following.
   * @param {string} userId - The ID of the user whose followings are to be fetched.
   * @param {{ page: number, limit: number }} options - Pagination options.
   * @returns {Promise<IFollow[]>} A list of follow documents, populated with the details of the users being followed.
   */
  public async getFollowing(userId: string, options: { page: number; limit: number }): Promise<IFollow[]> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    return Follow.find({ follower_id: userId })
      .populate('following_id', 'username displayName avatarUrl') // Select fields from the User model to return
      .sort({ created_date: -1 }) // Show most recent follows first
      .skip(skip)
      .limit(limit)
      .exec();
  }
}

export default new FollowService();
