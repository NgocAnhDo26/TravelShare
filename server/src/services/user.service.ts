import Follow, { IFollow } from '../models/follow.model';
import User, { IUser } from '../models/user.model';
import { isValidObjectId } from 'mongoose';
import { TravelPlanService } from './travelPlan.service';

/**
 * @interface IFollowService
 * @description Defines the shape of the FollowService, outlining all its methods.
 */
interface IFollowService {
  followUser(followerId: string, followingId: string): Promise<IFollow>;
  unfollowUser(
    followerId: string,
    followingId: string,
  ): Promise<{ deletedCount?: number }>;
  getFollowerCount(userId: string): Promise<number>;
  getFollowingCount(userId: string): Promise<number>;
  getFollowers(
    userId: string,
    options: { page: number; limit: number },
  ): Promise<any[]>;
  getFollowing(
    userId: string,
    options: { page: number; limit: number },
  ): Promise<any[]>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
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
    // Prevent a user from following themselves
    if (followerId === followingId) {
      throw new Error('You cannot follow yourself.');
    }

    // Verify both users exist and the follow relationship doesn't already exist
    const [usersExist, existingFollow] = await Promise.all([
      User.countDocuments({
        _id: { $in: [followerId, followingId] },
      }),
      Follow.findOne({
        follower: followerId,
        following: followingId,
      }),
    ]);

    if (usersExist !== 2) {
      throw new Error('One or both users do not exist.');
    }

    if (existingFollow) {
      throw new Error('You are already following this user.');
    }

    // Use Promise.all to run updates concurrently
    const [, , newFollow] = await Promise.all([
      User.updateOne({ _id: followerId }, { $inc: { followingCount: 1 } }),
      User.updateOne({ _id: followingId }, { $inc: { followerCount: 1 } }),
      Follow.create({
        follower: followerId,
        following: followingId,
      }),
    ]);

    return newFollow;
  },

  /**
   * Deletes a follow relationship between two users.
   */
  async unfollowUser(
    followerId: string,
    followingId: string,
  ): Promise<{ deletedCount?: number }> {
    const result = await Follow.deleteOne({
      follower: followerId,
      following: followingId,
    });

    if (result.deletedCount === 0) {
      throw new Error('You are not following this user.');
    }

    // Use Promise.all to run updates concurrently
    await Promise.all([
      User.updateOne({ _id: followerId }, { $inc: { followingCount: -1 } }),
      User.updateOne({ _id: followingId }, { $inc: { followerCount: -1 } }),
    ]);

    return result;
  },

  /**
   * Gets the total number of followers for a specific user.
   */
  async getFollowerCount(userId: string): Promise<number> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }
    return user.followerCount;
  },

  /**
   * Gets the total number of users a specific user is following.
   */
  async getFollowingCount(userId: string): Promise<number> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }
    return user.followingCount;
  },

  /**
   * Retrieves a paginated list of a user's followers with follow status.
   */
  async getFollowers(
    userId: string,
    options: { page: number; limit: number },
  ): Promise<any[]> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const followers = await Follow.find({ following: userId })
      .populate('follower', 'username displayName avatarUrl')
      .select('follower createdDate')
      .sort({ createdDate: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Return a flat array of follower user objects
    return followers.map((follow) => {
      const followerUser = follow.follower as unknown as IUser;
      return {
        _id: followerUser._id,
        username: followerUser.username,
        displayName: followerUser.displayName,
        avatarUrl: followerUser.avatarUrl,
        isFollowing: true,
        followedAt: follow.createdDate,
      };
    });
  },

  /**
   * Retrieves a paginated list of users a user is following with follow status.
   */
  async getFollowing(
    userId: string,
    options: { page: number; limit: number },
  ): Promise<any[]> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const following = await Follow.find({ follower: userId })
      .populate('following', 'username displayName avatarUrl')
      .select('following createdDate')
      .sort({ createdDate: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Return a flat array of following user objects
    return following.map((follow) => {
      const followingUser = follow.following as unknown as IUser;
      return {
        _id: followingUser._id,
        username: followingUser.username,
        displayName: followingUser.displayName,
        avatarUrl: followingUser.avatarUrl,
        isFollowing: true,
        followedAt: follow.createdDate,
      };
    });
  },

  /**
   * Checks if a user is following another user.
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await Follow.findOne({
      follower: followerId,
      following: followingId,
    });
    return !!follow;
  },
};

interface UpdateProfileData {
  displayName?: string;
  username?: string;
  email?: string;
  fileUrl?: string;
}

interface IUserService {
  getEditProfile(userId: string): Promise<IUser | null>;
  updateProfile(userId: string, data: UpdateProfileData): Promise<IUser | null>;
  getProfile(userId: string): Promise<IUser | null>;
}

const UserService: IUserService = {
  getEditProfile: async (userId: string): Promise<IUser | null> => {
    const userProfile = await User.findById(userId).select(
      'displayName username email avatarUrl',
    );

    if (!userProfile) {
      throw new Error('User not found.');
    }
    return userProfile;
  },

  updateProfile: async (
    userId: string,
    data: UpdateProfileData,
  ): Promise<IUser | null> => {
    const { displayName, username, email, fileUrl } = data;

    if (username) {
      const existingUserByUsername = await User.findOne({
        username: username.trim().toLowerCase(),
        _id: { $ne: userId },
      });
      if (existingUserByUsername) {
        throw new Error('Username already exists.');
      }
    }
    if (email) {
      const existingUserByEmail = await User.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: userId },
      });
      if (existingUserByEmail) {
        throw new Error('Email already exists.');
      }
    }

    const updateFields: any = {};
    if (displayName) updateFields.displayName = displayName;
    if (username) updateFields.username = username.trim().toLowerCase();
    if (email) updateFields.email = email.trim().toLowerCase();
    if (fileUrl) updateFields.avatarUrl = fileUrl;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true },
    ).select('displayName username email avatarUrl');

    if (!updatedUser) {
      throw new Error('User not found.');
    }

    return updatedUser;
  },

  getProfile: async (userId: string): Promise<any> => {
    const userProfile = await User.findById(userId).select(
      'displayName username email avatarUrl bio followerCount followingCount',
    );

    if (!userProfile) {
      throw new Error('User not found.');
    }

    // Fetch user's trip plans (light summary)
    const tripPlans = await TravelPlanService.getTravelPlansByAuthor(userId);
    const tripPlansSummary = tripPlans.map((plan) => ({
      _id: plan._id,
      title: plan.title,
      destination: plan.destination,
      coverImageUrl: plan.coverImageUrl,
      startDate: plan.startDate,
      endDate: plan.endDate,
      author: plan.author, // include author for permission checks
    }));

    return {
      _id: userProfile._id,
      username: userProfile.username,
      displayName: userProfile.displayName,
      email: userProfile.email,
      avatarUrl: userProfile.avatarUrl,
      bio: userProfile.bio,
      followerCount: userProfile.followerCount,
      followingCount: userProfile.followingCount,
      tripPlans: tripPlansSummary,
    };
  },
};

// Export the service object directly
export { FollowService, UserService };
