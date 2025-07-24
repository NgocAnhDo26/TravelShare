import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import CommentService from '../../src/services/comment.service';
import Comment from '../../src/models/comment.model';
import TravelPlan from '../../src/models/travelPlan.model';
import Post from '../../src/models/post.model';

vi.mock('../../src/models/comment.model');
vi.mock('../../src/models/travelPlan.model');
vi.mock('../../src/models/post.model');

const mockedComment = Comment as any;
const mockedTravelPlan = TravelPlan as any;
const mockedPost = Post as any;

const mockSession = {
  startTransaction: vi.fn(),
  commitTransaction: vi.fn(),
  abortTransaction: vi.fn(),
  endSession: vi.fn(),
};

vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as any);

type MockRequest = Partial<Request> & {
  user?: string | object;
};

describe('CommentService - Unit Tests', () => {
  let mockRequest: MockRequest;
  let mockResponse: Partial<Response>;
  const mockUserId = new mongoose.Types.ObjectId().toHexString();
  const mockTargetId = new mongoose.Types.ObjectId().toHexString();
  const mockCommentId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as any);

    mockRequest = {
      params: {},
      body: {},
      query: {},
      user: mockUserId,
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe('addComment', () => {
    it('should add a comment and commit transaction on success, returning 201', async () => {
      mockRequest.body = {
        content: 'A new test comment',
        targetId: mockTargetId,
        onModel: 'TravelPlan',
      };

      mockedTravelPlan.findByIdAndUpdate.mockResolvedValue({ _id: mockTargetId });

      const mockSavedComment = {
        ...mockRequest.body,
        _id: mockCommentId,
        user: { _id: mockUserId },
      };
      mockedComment.prototype.save = vi.fn().mockResolvedValue(mockSavedComment);

      const mockPopulatedComment = {
        ...mockSavedComment,
        user: { _id: mockUserId, username: 'testuser' },
      };
      mockedComment.prototype.populate = vi.fn().mockResolvedValue(mockPopulatedComment);

      await CommentService.addComment(mockRequest as Request, mockResponse as Response);

      expect(mongoose.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();

      expect(mockedTravelPlan.findByIdAndUpdate).toHaveBeenCalledWith(
        mockTargetId,
        { $inc: { commentsCount: 1 } },
        { new: true, session: mockSession }
      );

      expect(mockedComment.prototype.save).toHaveBeenCalledWith({ session: mockSession });

      expect(mockedComment.prototype.populate).toHaveBeenCalledWith({
        path: 'user',
        select: 'username displayName avatarUrl _id',
      });

      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.abortTransaction).not.toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockPopulatedComment);
    });

    it('should abort transaction and return 404 if the target is not found', async () => {
      mockRequest.body = { content: 'test', targetId: mockTargetId, onModel: 'TravelPlan' };
      mockedTravelPlan.findByIdAndUpdate.mockResolvedValue(null);

      await CommentService.addComment(mockRequest as Request, mockResponse as Response);

      expect(mongoose.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).not.toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'TravelPlan not found.' });
    });

    it('should return 400 if required fields are missing', async () => {
      mockRequest.body = { targetId: mockTargetId, onModel: 'TravelPlan' };
      await CommentService.addComment(mockRequest as Request, mockResponse as Response);

      expect(mongoose.startSession).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Content, targetId, and onModel are required.' });
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment, commit transaction and return 200', async () => {
      mockRequest.params = { commentId: mockCommentId.toHexString() };

      const mockExistingComment = {
        _id: mockCommentId,
        user: mockUserId,
        onModel: 'TravelPlan',
        targetId: mockTargetId,
      };

      mockedComment.findOneAndDelete.mockResolvedValue(mockExistingComment);
      mockedTravelPlan.findByIdAndUpdate.mockResolvedValue(true);

      await CommentService.deleteComment(mockRequest as Request, mockResponse as Response);

      expect(mongoose.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();

      expect(mockedComment.findOneAndDelete).toHaveBeenCalledWith(
        { _id: mockCommentId.toHexString(), user: mockUserId },
        { session: mockSession }
      );

      expect(mockedTravelPlan.findByIdAndUpdate).toHaveBeenCalledWith(
        mockTargetId,
        { $inc: { commentsCount: -1 } },
        { session: mockSession }
      );

      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.abortTransaction).not.toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Comment deleted successfully.' });
    });

    it('should return 404 and abort transaction if comment not found or user is not author', async () => {
      mockRequest.params = { commentId: mockCommentId.toHexString() };
      mockedComment.findOneAndDelete.mockResolvedValue(null);

      await CommentService.deleteComment(mockRequest as Request, mockResponse as Response);

      expect(mongoose.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).not.toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Comment not found or you do not have permission to delete.' });
    });
  });

  describe('getCommentsForTarget', () => {
    it('should return a list of comments and status 200', async () => {
      mockRequest.query = { targetId: mockTargetId, onModel: 'TravelPlan' };
      const mockCommentList = [{ content: 'Comment 1' }, { content: 'Comment 2' }];

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(mockCommentList),
      };
      mockedComment.find.mockReturnValue(mockQuery);

      await CommentService.getCommentsForTarget(mockRequest as Request, mockResponse as Response);

      expect(mockedComment.find).toHaveBeenCalledWith({ targetId: mockTargetId, onModel: 'TravelPlan' });
      expect(mockQuery.populate).toHaveBeenCalledWith({ path: 'user', select: 'username displayName avatarUrl _id' });
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockCommentList);
    });
  });
});