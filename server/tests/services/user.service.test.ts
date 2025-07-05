import { FollowService, UserService } from '../../src/services/user.service';
import User from '../../src/models/user.model';
import Follow from '../../src/models/follow.model';
import { Types } from 'mongoose';

// Mock the Mongoose models
jest.mock('../../src/models/user.model');
jest.mock('../../src/models/follow.model');

const mockedUser = User as jest.Mocked<typeof User>;
const mockedFollow = Follow as jest.Mocked<typeof Follow>;

describe('UserService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEditProfile', () => {
    it('should return user profile for editing', async () => {
      const userId = new Types.ObjectId().toHexString();
      const userProfile = { _id: userId, displayName: 'Test User' };
      (mockedUser.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(userProfile),
      });

      const result = await UserService.getEditProfile(userId);

      expect(mockedUser.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(userProfile);
    });

    it('should throw an error if user not found', async () => {
      const userId = new Types.ObjectId().toHexString();
      (mockedUser.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(UserService.getEditProfile(userId)).rejects.toThrow('User not found.');
    });
  });

  describe('updateProfile', () => {
    it('should update a user profile successfully', async () => {
      const userId = new Types.ObjectId().toHexString();
      const updateData = { displayName: 'Updated Name' };
      const updatedUser = { _id: userId, ...updateData };

      (mockedUser.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(updatedUser),
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
      (mockedUser.findOne as jest.Mock).mockResolvedValue({ _id: new Types.ObjectId() });

      await expect(UserService.updateProfile(userId, updateData)).rejects.toThrow('Username already exists.');
    });

    it('should throw an error if email already exists', async () => {
      const userId = new Types.ObjectId().toHexString();
      const updateData = { email: 'existing@test.com' };
      (mockedUser.findOne as jest.Mock).mockResolvedValue({ _id: new Types.ObjectId() });

      await expect(UserService.updateProfile(userId, updateData)).rejects.toThrow('Email already exists.');
    });
  });

  describe('getProfile', () => {
    it('should return a user public profile', async () => {
      const userId = new Types.ObjectId().toHexString();
      const userProfile = { _id: userId, username: 'testuser' };
      (mockedUser.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(userProfile),
      });

      const result = await UserService.getProfile(userId);

      expect(mockedUser.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(userProfile);
    });

    it('should throw an error if user not found', async () => {
      const userId = new Types.ObjectId().toHexString();
      (mockedUser.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(UserService.getProfile(userId)).rejects.toThrow('User not found.');
    });
  });
});

describe('FollowService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('followUser', () => {
    it('should allow a user to follow another', async () => {
      const followerId = new Types.ObjectId().toHexString();
      const followingId = new Types.ObjectId().toHexString();

      (mockedUser.countDocuments as jest.Mock).mockResolvedValue(2);
      (mockedFollow.findOne as jest.Mock).mockResolvedValue(null);
      (mockedFollow.create as jest.Mock).mockResolvedValue({ follower: followerId, following: followingId });

      await FollowService.followUser(followerId, followingId);

      expect(mockedUser.updateOne).toHaveBeenCalledTimes(2);
      expect(mockedFollow.create).toHaveBeenCalledWith({ follower: followerId, following: followingId });
    });

    it('should throw an error if user tries to follow themselves', async () => {
      const userId = new Types.ObjectId().toHexString();
      await expect(FollowService.followUser(userId, userId)).rejects.toThrow('You cannot follow yourself.');
    });

    it('should throw an error if already following', async () => {
      const followerId = new Types.ObjectId().toHexString();
      const followingId = new Types.ObjectId().toHexString();
      (mockedUser.countDocuments as jest.Mock).mockResolvedValue(2);
      (mockedFollow.findOne as jest.Mock).mockResolvedValue({});

      await expect(FollowService.followUser(followerId, followingId)).rejects.toThrow('You are already following this user.');
    });
  });

  describe('unfollowUser', () => {
    it('should allow a user to unfollow another', async () => {
      const followerId = new Types.ObjectId().toHexString();
      const followingId = new Types.ObjectId().toHexString();
      (mockedFollow.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      await FollowService.unfollowUser(followerId, followingId);

      expect(mockedFollow.deleteOne).toHaveBeenCalledWith({ follower: followerId, following: followingId });
      expect(mockedUser.updateOne).toHaveBeenCalledTimes(2);
    });

    it('should throw an error if not following the user', async () => {
      const followerId = new Types.ObjectId().toHexString();
      const followingId = new Types.ObjectId().toHexString();
      (mockedFollow.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 0 });

      await expect(FollowService.unfollowUser(followerId, followingId)).rejects.toThrow('You are not following this user.');
    });
  });

  describe('getFollowerCount', () => {
    it('should return the follower count', async () => {
      const userId = new Types.ObjectId().toHexString();
      (mockedUser.findById as jest.Mock).mockResolvedValue({ followerCount: 10 });
      const count = await FollowService.getFollowerCount(userId);
      expect(count).toBe(10);
    });
  });

  describe('getFollowingCount', () => {
    it('should return the following count', async () => {
      const userId = new Types.ObjectId().toHexString();
      (mockedUser.findById as jest.Mock).mockResolvedValue({ followingCount: 5 });
      const count = await FollowService.getFollowingCount(userId);
      expect(count).toBe(5);
    });
  });

  describe('getFollowers', () => {
    it('should return a paginated list of followers', async () => {
      const userId = new Types.ObjectId().toHexString();
      const followers = [{ _id: new Types.ObjectId() }];
      (mockedFollow.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(followers),
      });

      const result = await FollowService.getFollowers(userId, { page: 1, limit: 10 });
      expect(result).toEqual(followers);
    });
  });

  describe('getFollowing', () => {
    it('should return a paginated list of following users', async () => {
      const userId = new Types.ObjectId().toHexString();
      const following = [{ _id: new Types.ObjectId() }];
      (mockedFollow.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(following),
      });

      const result = await FollowService.getFollowing(userId, { page: 1, limit: 10 });
      expect(result).toEqual(following);
    });
  });
});