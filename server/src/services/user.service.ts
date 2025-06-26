import mongoose, { Types } from 'mongoose';
import { Request, Response, NextFunction } from 'express';
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

interface UpdateProfileData {
  displayName?: string;
  username?: string;
  email?: string;
  fileUrl?: string;
}

interface UserInfo {
  username: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
}

interface IUserService {
  getEditProfile(req: Request, res: Response): Promise<void>;
  updateProfile(req: Request, res: Response): Promise<void>;
  getUserInfo(userId: string): Promise<UserInfo | null>;
}

const UserService: IUserService = {
 
  getEditProfile: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user as string;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ error: 'Invalid user ID format.' });
        return;
    }

    try {
     
      const userProfile = await User.findById(userId).select('displayName username email avatarUrl');

      if (!userProfile) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      res.status(200).json(userProfile);

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  },

  
  updateProfile: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user as string;
    const { displayName, username, email, fileUrl }: UpdateProfileData = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ error: 'Invalid user ID format.' });
        return;
    }
    
    try {
    
      if (username) {
        const existingUserByUsername = await User.findOne({ 
          username: username.trim().toLowerCase(),
          _id: { $ne: userId }
        });
        if (existingUserByUsername) {
          res.status(409).json({ error: 'Username already exists.' });
          return;
        }
      }
      if (email) {
        const existingUserByEmail = await User.findOne({ 
          email: email.trim().toLowerCase(),
          _id: { $ne: userId } 
        });
        if (existingUserByEmail) {
          res.status(409).json({ error: 'Email already exists.' });
          return;
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
        { new: true, runValidators: true }
      )
    
      .select('displayName username email avatarUrl');

      if (!updatedUser) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      res.status(200).json({
        message: 'Profile updated successfully.',
        user: updatedUser,
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  },

  getUserInfo: async (userId: string): Promise<UserInfo | null> => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return null;
    }

    const user = await User.findById(userId)
      .select('username email displayName firstName lastName bio')
      .lean();

    if (!user) {
      return null;
    }

    const [followerCount, followingCount] = await Promise.all([
      FollowService.getFollowerCount(userId),
      FollowService.getFollowingCount(userId),
    ]);

    return {
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
      followerCount,
      followingCount,
    };
  },
};

// Export the service object directly
export { FollowService, UserService };
