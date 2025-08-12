// tests/services/comment.service.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import mongoose, { Types } from 'mongoose';
import CommentService from '../../src/services/comment.service';
import Comment from '../../src/models/comment.model';
import TravelPlan from '../../src/models/travelPlan.model';
import Post from '../../src/models/post.model';
import { Like } from '../../src/models/like.model';
import User from '../../src/models/user.model';

// Mock các model
vi.mock('../../src/models/comment.model');
vi.mock('../../src/models/travelPlan.model');
vi.mock('../../src/models/post.model');
vi.mock('../../src/models/like.model');
vi.mock('../../src/models/user.model');

// Mock Mongoose session
const mockSession = {
  startTransaction: vi.fn(),
  commitTransaction: vi.fn(),
  abortTransaction: vi.fn(),
  endSession: vi.fn(),
};
vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as any);

const mockComment = vi.mocked(Comment);
const mockTravelPlan = vi.mocked(TravelPlan);
const mockLike = vi.mocked(Like);
const mockUser = vi.mocked(User);

describe('CommentService', () => {
  const userId = new Types.ObjectId().toString();
  const targetId = new Types.ObjectId().toString();

  const mockUserLean = {
    _id: new Types.ObjectId(userId),
    username: 'testuser',
    displayName: 'Test User',
    avatarUrl: 'http://example.com/avatar.jpg',
  };

  const mockCommentLean = {
    _id: new Types.ObjectId(),
    user: mockUserLean,
    content: 'This is a test comment',
    targetId: new Types.ObjectId(targetId),
    onModel: 'TravelPlan',
    likesCount: 0,
    replyCount: 0,
    mentions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // --- getCommentsForTarget ---
  describe('getCommentsForTarget', () => {
    it('should return comments for a target with pagination', async () => {
      const mockFind = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockCommentLean]),
      };
      mockComment.find.mockReturnValue(mockFind as any);
      mockComment.countDocuments.mockResolvedValue(1);

      const result = await CommentService.getCommentsForTarget(
        targetId,
        'TravelPlan',
        1,
        5,
      );

      expect(mockComment.find).toHaveBeenCalledWith({
        targetId,
        onModel: 'TravelPlan',
        parentId: null,
      });
      expect(mockFind.skip).toHaveBeenCalledWith(0);
      expect(mockFind.limit).toHaveBeenCalledWith(5);
      expect(result.comments).toEqual([mockCommentLean]);
      expect(result.totalPages).toBe(1);
      expect(result.currentPage).toBe(1);
    });
  });

  // --- addComment ---
  describe('addComment', () => {
    it('should add a new top-level comment and update target comment count', async () => {
      const newCommentId = new Types.ObjectId();
      const mockCommentInstance = {
        ...mockCommentLean,
        _id: newCommentId,
        save: vi.fn().mockResolvedValue(this),
      };
      (mockComment as any).mockImplementation(() => mockCommentInstance);

      mockTravelPlan.findById.mockReturnValue({
        session: vi.fn().mockResolvedValue({ _id: targetId }),
      } as any);
      mockTravelPlan.updateOne.mockResolvedValue({} as any);

      vi.spyOn(CommentService, 'getCommentById').mockResolvedValue({
        ...mockCommentLean,
        _id: newCommentId,
      } as any);

      const result = await CommentService.addComment(
        userId,
        targetId,
        'TravelPlan',
        { content: 'New comment' },
      );

      expect(mongoose.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockTravelPlan.findById).toHaveBeenCalledWith(targetId);
      expect(mockCommentInstance.save).toHaveBeenCalled(); // Kiểm tra hàm save đã được gọi
      expect(mockTravelPlan.updateOne).toHaveBeenCalledWith(
        { _id: targetId },
        { $inc: { commentsCount: 1 } },
        { session: mockSession },
      );
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(result?._id).toEqual(newCommentId);
    });

    it('should throw an error if content and imageUrl are missing', async () => {
      await expect(
        CommentService.addComment(userId, targetId, 'TravelPlan', {}),
      ).rejects.toThrow('Comment must have content or an image.');
    });

    it('should rollback transaction on error', async () => {
      mockTravelPlan.findById.mockReturnValue({
        session: vi.fn().mockRejectedValue(new Error('DB Error')),
      } as any);

      await expect(
        CommentService.addComment(userId, targetId, 'TravelPlan', {
          content: 'test',
        }),
      ).rejects.toThrow('DB Error');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });

  // --- updateComment ---
  describe('updateComment', () => {
    it('should update a comment successfully', async () => {
      const updatedContent = 'Updated content';
      const mockUpdatedComment = {
        ...mockCommentLean,
        content: updatedContent,
      };
      const mockFindOneAndUpdate = {
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockUpdatedComment),
      };
      mockComment.findOneAndUpdate.mockReturnValue(mockFindOneAndUpdate as any);

      const result = await CommentService.updateComment(
        mockCommentLean._id.toString(),
        userId,
        updatedContent,
      );

      expect(mockComment.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockCommentLean._id.toString(), user: userId },
        { content: updatedContent },
        { new: true },
      );
      expect(result).toEqual(mockUpdatedComment);
    });

    it('should throw error if comment not found or user is not authorized', async () => {
      const mockFindOneAndUpdate = {
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(null),
      };
      mockComment.findOneAndUpdate.mockReturnValue(mockFindOneAndUpdate as any);

      await expect(
        CommentService.updateComment('invalidId', userId, 'content'),
      ).rejects.toThrow(
        'Comment not found or you do not have permission to edit.',
      );
    });
  });

  // --- deleteComment ---
  describe('deleteComment', () => {
    it('should delete a comment and update counts', async () => {
      const commentToDelete = {
        ...mockCommentLean,
        deleteOne: vi.fn().mockResolvedValue({}),
      };
      mockComment.findOne.mockResolvedValue(commentToDelete as any);
      mockTravelPlan.updateOne.mockResolvedValue({} as any);
      mockComment.deleteMany.mockResolvedValue({} as any);

      await CommentService.deleteComment(
        commentToDelete._id.toString(),
        userId,
      );

      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockComment.findOne).toHaveBeenCalledWith(
        { _id: commentToDelete._id.toString(), user: userId },
        null,
        { session: mockSession },
      );
      expect(mockTravelPlan.updateOne).toHaveBeenCalledWith(
        { _id: commentToDelete.targetId },
        { $inc: { commentsCount: -1 } },
        { session: mockSession },
      );
      expect(commentToDelete.deleteOne).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });

  // --- toggleLike ---
  describe('toggleLike', () => {
    it('should add a like if not already liked', async () => {
      mockLike.findOne.mockResolvedValue(null);
      mockLike.create.mockResolvedValue([{} as any]);
      mockComment.findByIdAndUpdate.mockResolvedValue({} as any);
      vi.spyOn(CommentService, 'getCommentById').mockResolvedValue(
        mockCommentLean as any,
      );

      const result = await CommentService.toggleLike(
        mockCommentLean._id.toString(),
        userId,
      );

      expect(mockLike.findOne).toHaveBeenCalled();
      expect(mockLike.create).toHaveBeenCalled();
      expect(mockComment.findByIdAndUpdate).toHaveBeenCalledWith(
        mockCommentLean._id.toString(),
        { $inc: { likesCount: 1 } },
        { session: mockSession },
      );
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual(mockCommentLean);
    });

    it('should remove a like if already liked', async () => {
      const existingLike = { deleteOne: vi.fn().mockResolvedValue({}) };
      mockLike.findOne.mockResolvedValue(existingLike as any);
      mockComment.findByIdAndUpdate.mockResolvedValue({} as any);
      vi.spyOn(CommentService, 'getCommentById').mockResolvedValue(
        mockCommentLean as any,
      );

      await CommentService.toggleLike(mockCommentLean._id.toString(), userId);

      expect(existingLike.deleteOne).toHaveBeenCalledWith({
        session: mockSession,
      });
      expect(mockComment.findByIdAndUpdate).toHaveBeenCalledWith(
        mockCommentLean._id.toString(),
        { $inc: { likesCount: -1 } },
        { session: mockSession },
      );
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });
  });
});
