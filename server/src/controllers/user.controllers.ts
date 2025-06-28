import { Request, Response, NextFunction } from 'express';
import { FollowService, UserService } from '../services/user.service';
import { Types } from 'mongoose';

/**
 * @interface IFollowController
 * @description Defines the shape of the FollowController, outlining all its methods.
 */
interface IFollowController {
  follow(req: Request, res: Response, next: NextFunction): Promise<void>;
  unfollow(req: Request, res: Response, next: NextFunction): Promise<void>;
  getFollowerCount(req: Request, res: Response, next: NextFunction): Promise<void>;
  getFollowingCount(req: Request, res: Response, next: NextFunction): Promise<void>;
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
      const followerId = req.user;
      const followingId = req.params.id;

      if (!followerId) {
        res.status(401).json({ message: 'Authentication required. Please log in.' });
        return;
      }
      if (!Types.ObjectId.isValid(followingId)) {
        res.status(400).json({ message: 'The provided user ID has an invalid format.' });
        return;
      }

      const result = await FollowService.followUser(followerId, followingId);
      res.status(201).json({ message: 'User followed successfully.', data: result });

    } catch (error: any) {
      if (error.message.includes('follow yourself')) {
        res.status(400).json({ message: error.message });
      } else if (error.message.includes('already following')) {
        res.status(409).json({ message: error.message });
      } else if (error.message.includes('do not exist')) {
        res.status(404).json({ message: error.message });
      } else {
        next(error);
      }
    }
  },

  /**
   * @description Unfollow a user. Requires authentication.
   */
  async unfollow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const followerId = req.user;
      const followingId = req.params.id;

      if (!followerId) {
        res.status(401).json({ message: 'Authentication required. Please log in.' });
        return;
      }
      if (!Types.ObjectId.isValid(followingId)) {
        res.status(400).json({ message: 'The provided user ID has an invalid format.' });
        return;
      }

      await FollowService.unfollowUser(followerId, followingId);
      res.status(200).json({ message: 'User unfollowed successfully.' });

    } catch (error: any) {
      if (error.message.includes('not following')) {
        res.status(404).json({ message: error.message });
      } else {
        next(error);
      }
    }
  },

  /**
   * @description Get the number of followers for a given user. Public endpoint.
   */
  async getFollowerCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.params.id;
        if (!Types.ObjectId.isValid(userId)) {
            res.status(400).json({ message: 'Invalid user ID format.' });
            return;
        }
        
        const count = await FollowService.getFollowerCount(userId);
        res.status(200).json({ userId, followerCount: count });

    } catch (error: any) {
        next(error);
    }
  },

  /**
   * @description Get the number of users a given user is following. Public endpoint.
   */
  async getFollowingCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.params.id;
        if (!Types.ObjectId.isValid(userId)) {
            res.status(400).json({ message: 'Invalid user ID format.' });
            return;
        }
        
        const count = await FollowService.getFollowingCount(userId);
        res.status(200).json({ userId, followingCount: count });

    } catch (error: any) {
        next(error);
    }
  },

  /**
   * @description Get a list of followers for a given user. Public endpoint.
   */
  async getFollowers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.id;
      if (!Types.ObjectId.isValid(userId)) {
        res.status(400).json({ message: 'Invalid user ID format.' });
        return;
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const followers = await FollowService.getFollowers(userId, { page, limit });
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
  async getFollowing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.id;
       if (!Types.ObjectId.isValid(userId)) {
        res.status(400).json({ message: 'The provided user ID has an invalid format.' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const following = await FollowService.getFollowing(userId, { page, limit });
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
  getUserInfo(req: Request, res: Response, next: NextFunction): Promise<void>; // Add next for error handling
}

const UserController: IUserController = {
  getEditProfile: async (req: Request, res: Response) => {
    await UserService.getEditProfile(req, res);
  },

  updateProfile: async (req: Request, res: Response) => {
    await UserService.updateProfile(req, res);
  },

  getUserInfo: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id;
      if (!Types.ObjectId.isValid(userId)) {
        res.status(400).json({ error: 'Invalid user ID format.' });
        return;
      }

      const userInfo = await UserService.getUserInfo(userId);

      if (!userInfo) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      res.status(200).json(userInfo);
    } catch (error) {
      next(error);
    }
  },
};

export { FollowController, UserController };
