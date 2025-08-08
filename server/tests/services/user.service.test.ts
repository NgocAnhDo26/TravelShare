import { vi, describe, it, expect, afterEach } from 'vitest';
import { FollowService, UserService } from '../../src/services/user.service';
import User from '../../src/models/user.model';
import Follow from '../../src/models/follow.model';
import { Types } from 'mongoose';
import * as TravelPlanServiceModule from '../../src/services/travelPlan.service';

// Mock TravelPlanService.getTravelPlansByAuthor to return an empty array
vi.spyOn(
  TravelPlanServiceModule.TravelPlanService,
  'getTravelPlansByAuthor',
).mockResolvedValue([]);

// Mock the Mongoose models
vi.mock('../../src/models/user.model');
vi.mock('../../src/models/follow.model');

const mockedUser = User as any;
const mockedFollow = Follow as any;

describe('UserService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getEditProfile', () => {
    it('should return user profile for editing', async () => {
      const userId = new Types.ObjectId().toHexString();
      const userProfile = { _id: userId, displayName: 'Test User' };
      mockedUser.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(userProfile),
      });

      const result = await UserService.getEditProfile(userId);

      expect(mockedUser.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(userProfile);
    });

    it('should throw an error if user not found', async () => {
      const userId = new Types.ObjectId().toHexString();
      mockedUser.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(null),
      });

      await expect(UserService.getEditProfile(userId)).rejects.toThrow(
        'User not found.',
      );
    });
  });

  describe('updateProfile', () => {
    it('should update a user profile successfully', async () => {
      const userId = new Types.ObjectId().toHexString();
      const updateData = { displayName: 'Updated Name' };
      const updatedUser = { _id: userId, ...updateData };

      mockedUser.findByIdAndUpdate.mockReturnValue({
        select: vi.fn().mockResolvedValue(updatedUser),
      });

      const result = await UserService.updateProfile(userId, updateData);

      expect(mockedUser.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $set: updateData },
        { new: true, runValidators: true },
      );
      expect(result).toEqual(updatedUser);
    });

    it('should throw an error if username already exists', async () => {
      const userId = new Types.ObjectId().toHexString();
      const updateData = { username: 'existinguser' };
      mockedUser.findOne.mockResolvedValue({ _id: new Types.ObjectId() });

      await expect(
        UserService.updateProfile(userId, updateData),
      ).rejects.toThrow('Username already exists.');
    });

    it('should throw an error if email already exists', async () => {
      const userId = new Types.ObjectId().toHexString();
      const updateData = { email: 'existing@test.com' };
      mockedUser.findOne.mockResolvedValue({ _id: new Types.ObjectId() });

      await expect(
        UserService.updateProfile(userId, updateData),
      ).rejects.toThrow('Email already exists.');
    });
  });

  describe('getProfile', () => {
    it('should return a user public profile', async () => {
      const userId = new Types.ObjectId().toHexString();
      const userProfile = {
        username: 'testuser',
        displayName: 'Test User',
        avatarUrl: '',
        bio: '',
        followerCount: 0,
        followingCount: 0,
      };
      mockedUser.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(userProfile),
      });

      const result = await UserService.getProfile(userId);

      expect(mockedUser.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        ...userProfile,
      });
    });

    it('should throw an error if user not found', async () => {
      const userId = new Types.ObjectId().toHexString();
      mockedUser.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(null),
      });

      await expect(UserService.getProfile(userId)).rejects.toThrow(
        'User not found.',
      );
    });
  });
});

describe('FollowService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('followUser', () => {
    it('should allow a user to follow another', async () => {
      const followerId = new Types.ObjectId().toHexString();
      const followingId = new Types.ObjectId().toHexString();

      mockedUser.countDocuments.mockResolvedValue(2);
      mockedFollow.findOne.mockResolvedValue(null);
      mockedFollow.create.mockResolvedValue({
        follower: followerId,
        following: followingId,
      });

      await FollowService.followUser(followerId, followingId);

      expect(mockedUser.updateOne).toHaveBeenCalledTimes(2);
      expect(mockedFollow.create).toHaveBeenCalledWith({
        follower: followerId,
        following: followingId,
      });
    });

    it('should throw an error if user tries to follow themselves', async () => {
      const userId = new Types.ObjectId().toHexString();
      await expect(FollowService.followUser(userId, userId)).rejects.toThrow(
        'You cannot follow yourself.',
      );
    });

    it('should throw an error if already following', async () => {
      const followerId = new Types.ObjectId().toHexString();
      const followingId = new Types.ObjectId().toHexString();
      mockedUser.countDocuments.mockResolvedValue(2);
      mockedFollow.findOne.mockResolvedValue({});

      await expect(
        FollowService.followUser(followerId, followingId),
      ).rejects.toThrow('You are already following this user.');
    });
  });

  describe('unfollowUser', () => {
    it('should allow a user to unfollow another', async () => {
      const followerId = new Types.ObjectId().toHexString();
      const followingId = new Types.ObjectId().toHexString();
      mockedFollow.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await FollowService.unfollowUser(followerId, followingId);

      expect(mockedFollow.deleteOne).toHaveBeenCalledWith({
        follower: followerId,
        following: followingId,
      });
      expect(mockedUser.updateOne).toHaveBeenCalledTimes(2);
    });

    it('should throw an error if not following the user', async () => {
      const followerId = new Types.ObjectId().toHexString();
      const followingId = new Types.ObjectId().toHexString();
      mockedFollow.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await expect(
        FollowService.unfollowUser(followerId, followingId),
      ).rejects.toThrow('You are not following this user.');
    });
  });

  describe('getFollowerCount', () => {
    it('should return the follower count', async () => {
      const userId = new Types.ObjectId().toHexString();
      mockedUser.findById.mockResolvedValue({ followerCount: 10 });
      const count = await FollowService.getFollowerCount(userId);
      expect(count).toBe(10);
    });
  });

  describe('getFollowingCount', () => {
    it('should return the following count', async () => {
      const userId = new Types.ObjectId().toHexString();
      mockedUser.findById.mockResolvedValue({ followingCount: 5 });
      const count = await FollowService.getFollowingCount(userId);
      expect(count).toBe(5);
    });
  });

  describe('getFollowers', () => {
    it('should return a paginated list of followers with follow status', async () => {
      const userId = new Types.ObjectId().toHexString();
      const followerId = new Types.ObjectId();
      const followers = [
        {
          _id: new Types.ObjectId(),
          follower: {
            _id: followerId,
            username: 'testuser',
            displayName: 'Test User',
            avatarUrl: '',
          },
          createdDate: new Date(),
          toObject: vi.fn().mockReturnValue({
            follower: {
              _id: followerId,
              username: 'testuser',
              displayName: 'Test User',
              avatarUrl: '',
            },
            createdDate: new Date(),
          }),
        },
      ];

      // Mock the first query (main followers query)
      const mockQueryChain = {
        populate: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(followers),
      };

      mockedFollow.find.mockReturnValueOnce(mockQueryChain);

      const result = await FollowService.getFollowers(userId, {
        page: 1,
        limit: 10,
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('_id');
      expect(result[0]).toHaveProperty('username');
      expect(result[0]).toHaveProperty('displayName');
      expect(result[0]).toHaveProperty('avatarUrl');
      expect(result[0]).toHaveProperty('isFollowing');
      expect(result[0]).toHaveProperty('followedAt');
    });
  });

  describe('getFollowing', () => {
    it('should return a paginated list of following users with follow status', async () => {
      const userId = new Types.ObjectId().toHexString();
      const followingId = new Types.ObjectId();
      const following = [
        {
          _id: new Types.ObjectId(),
          following: {
            _id: followingId,
            username: 'testuser',
            displayName: 'Test User',
            avatarUrl: '',
          },
          createdDate: new Date(),
          toObject: vi.fn().mockReturnValue({
            following: {
              _id: followingId,
              username: 'testuser',
              displayName: 'Test User',
              avatarUrl: '',
            },
            createdDate: new Date(),
          }),
        },
      ];

      // Mock the first query (main following query)
      const mockQueryChain = {
        populate: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(following),
      };

      mockedFollow.find.mockReturnValueOnce(mockQueryChain);

      const result = await FollowService.getFollowing(userId, {
        page: 1,
        limit: 10,
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('_id');
      expect(result[0]).toHaveProperty('username');
      expect(result[0]).toHaveProperty('displayName');
      expect(result[0]).toHaveProperty('avatarUrl');
      expect(result[0]).toHaveProperty('isFollowing');
      expect(result[0]).toHaveProperty('followedAt');
    });
  });
});
