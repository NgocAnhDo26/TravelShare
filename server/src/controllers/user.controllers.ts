import { Request, Response, NextFunction } from 'express';
import { FollowService, UserService } from '../services/user.service';
import { isValidObjectId, Types } from 'mongoose';
import { HTTP_STATUS } from '../constants/http';

/**
 * @interface IFollowController
 * @description Defines the shape of the FollowController, outlining all its methods.
 */
interface IFollowController {
  follow(req: Request, res: Response, next: NextFunction): Promise<void>;
  unfollow(req: Request, res: Response, next: NextFunction): Promise<void>;
  getFollowers(req: Request, res: Response, next: NextFunction): Promise<void>;
  getFollowing(req: Request, res: Response, next: NextFunction): Promise<void>;
}

/**
 * @const FollowController
 * @description A controller object to handle all follow-related API requests.
 */
const FollowController: IFollowController = {
  /**
   * @description Follow a user. Requires authentication.
   */
  async follow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const followerId = req.user as string; // The logged-in user is the follower
      const followingId = req.params.id; // The user in the URL is being followed

      if (!followerId) {
        res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ message: 'You are not authorized to perform this action.' });
        return;
      }
      if (!isValidObjectId(followingId)) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ message: 'The provided user ID has an invalid format.' });
        return;
      }

      const result = await FollowService.followUser(followerId, followingId);
      res
        .status(HTTP_STATUS.CREATED)
        .json({ message: 'User followed successfully.', data: result });
    } catch (error: any) {
      if (error.message.includes('follow yourself')) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ message: error.message });
      } else if (error.message.includes('already following')) {
        res.status(HTTP_STATUS.CONFLICT).json({ message: error.message });
      } else if (error.message.includes('do not exist')) {
        res.status(HTTP_STATUS.NOT_FOUND).json({ message: error.message });
      } else {
        next(error);
      }
    }
  },

  /**
   * @description Unfollow a user. Requires authentication.
   */
  async unfollow(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const followerId = req.user as string; // The logged-in user is the follower
      const followingId = req.params.id; // The user in the URL is being unfollowed

      if (!followerId) {
        res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ message: 'You are not authorized to perform this action.' });
        return;
      }
      if (!isValidObjectId(followingId)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'The user ID to unfollow has an invalid format.',
        });
        return;
      }

      await FollowService.unfollowUser(followerId, followingId);
      res
        .status(HTTP_STATUS.OK)
        .json({ message: 'User unfollowed successfully.' });
    } catch (error: any) {
      if (error.message.includes('not following')) {
        res.status(HTTP_STATUS.NOT_FOUND).json({ message: error.message });
      } else {
        next(error);
      }
    }
  },

  /**
   * @description Get a list of followers for a given user. Public endpoint.
   */
  async getFollowers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user as string; // The logged-in user is the follower
      if (!isValidObjectId(userId)) {
        res.status(400).json({ message: 'Invalid user ID format.' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const followers = await FollowService.getFollowers(userId, {
        page,
        limit,
      });
      const totalFollowers = await FollowService.getFollowerCount(userId);

      res.status(200).json({
        data: followers,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalFollowers / limit),
          totalItems: totalFollowers,
        },
      });
    } catch (error: any) {
      next(error);
    }
  },

  /**
   * @description Get a list of users a given user is following. Public endpoint.
   */
  async getFollowing(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user as string; // The logged-in user is the follower
      if (!isValidObjectId(userId)) {
        res
          .status(400)
          .json({ message: 'The provided user ID has an invalid format.' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const following = await FollowService.getFollowing(userId, {
        page,
        limit,
      });
      const totalFollowing = await FollowService.getFollowingCount(userId);

      res.status(200).json({
        data: following,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalFollowing / limit),
          totalItems: totalFollowing,
        },
      });
    } catch (error: any) {
      next(error);
    }
  },
};

interface IUserController {
  getEditProfile(req: Request, res: Response): Promise<void>;
  updateProfile(req: Request, res: Response): Promise<void>;
  getProfile(req: Request, res: Response): Promise<void>;
}

const UserController: IUserController = {
  getEditProfile: async (req: Request, res: Response) => {
    const userId = req.user as string;
    if (!isValidObjectId(userId)) {
      res.status(400).json({ error: 'Invalid user ID format.' });
      return;
    }

    try {
      const userProfile = await UserService.getEditProfile(userId);
      res.status(200).json(userProfile);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error.' });
      }
    }
  },

  updateProfile: async (req: Request, res: Response) => {
    const userId = req.user as string;
    const { displayName, username, email, fileUrl } = req.body;

    if (!isValidObjectId(userId)) {
      res.status(400).json({ error: 'Invalid user ID format.' });
      return;
    }

    try {
      const updatedUser = await UserService.updateProfile(userId, {
        displayName,
        username,
        email,
        fileUrl,
      });
      res.status(200).json({
        message: 'Profile updated successfully.',
        user: updatedUser,
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error.' });
      }
    }
  },

  getProfile: async (req: Request, res: Response) => {
    const userId = req.user as string;
    if (!isValidObjectId(userId)) {
      res.status(400).json({ error: 'Invalid user ID format.' });
      return;
    }

    try {
      const userProfile = await UserService.getProfile(userId);
      res.status(200).json(userProfile);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        console.error('Get public profile error:', error);
        res.status(500).json({ error: 'Internal server error.' });
      }
    }
  },
};

export { FollowController, UserController };