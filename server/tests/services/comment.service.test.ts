import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import  CommentService  from '../../src/services/comment.service';
import Comment from '../../src/models/comment.model';
import TravelPlan from '../../src/models/travelPlan.model';
import Post from '../../src/models/post.model';
import { IComment } from '../../src/models/comment.model';


vi.mock('../../src/models/comment.model');
vi.mock('../../src/models/travelPlan.model');
vi.mock('../../src/models/post.model');

const mockedComment = Comment as any;
const mockedTravelPlan = TravelPlan as any;
const mockedPost = Post as any;


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

  // ===================================
  // TESTS FOR addComment
  // ===================================
  describe('addComment', () => {
    it('should add a comment and return 201 on success', async () => {
      
      mockRequest.body = {
        content: 'A new test comment',
        targetId: mockTargetId,
        onModel: 'TravelPlan',
      };

      mockedTravelPlan.findById.mockResolvedValue({ _id: mockTargetId });
      mockedTravelPlan.findByIdAndUpdate.mockResolvedValue(true);

      const mockSavedComment = {
        ...mockRequest.body,
        _id: mockCommentId,
        user: { _id: mockUserId },
      };
      mockedComment.prototype.save = vi.fn().mockResolvedValue(mockSavedComment);
      mockedComment.prototype.populate = vi.fn().mockResolvedValue({
          ...mockSavedComment,
          user: { _id: mockUserId, username: 'testuser' }
      });

      await CommentService.addComment(mockRequest as Request, mockResponse as Response);

      expect(mockedTravelPlan.findById).toHaveBeenCalledWith(mockTargetId);
      expect(mockedComment.prototype.save).toHaveBeenCalled();
      expect(mockedTravelPlan.findByIdAndUpdate).toHaveBeenCalledWith(mockTargetId, { $inc: { commentsCount: 1 } });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'A new test comment' })
      );
    });

    it('should return 404 if the target plan is not found', async () => {

      mockRequest.body = { content: 'test', targetId: mockTargetId, onModel: 'TravelPlan' };
      mockedTravelPlan.findById.mockResolvedValue(null);

      await CommentService.addComment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'TravelPlan not found.' });
    });

     it('should return 400 if required fields are missing', async () => {
      mockRequest.body = { targetId: mockTargetId, onModel: 'TravelPlan' };

      await CommentService.addComment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Content, targetId, and onModel are required.' });
    });
  });

  // ===================================
  // TESTS FOR deleteComment
  // ===================================
  describe('deleteComment', () => {
    it('should delete a comment and return 200 if user is the author', async () => {
      mockRequest.params = { commentId: mockCommentId.toHexString() };
      const mockExistingComment = {
        _id: mockCommentId,
        user: mockUserId,
        onModel: 'TravelPlan',
        targetId: mockTargetId,
        deleteOne: vi.fn().mockResolvedValue({ acknowledged: true, deletedCount: 1 }),
      };
      mockedComment.findById.mockResolvedValue(mockExistingComment);
      mockedTravelPlan.findByIdAndUpdate.mockResolvedValue(true);

      await CommentService.deleteComment(mockRequest as Request, mockResponse as Response);

      expect(mockedComment.findById).toHaveBeenCalledWith(mockCommentId.toHexString());
      expect(mockExistingComment.deleteOne).toHaveBeenCalled();
      expect(mockedTravelPlan.findByIdAndUpdate).toHaveBeenCalledWith(mockTargetId, { $inc: { commentsCount: -1 } });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Comment deleted successfully.' });
    });

    it('should return 403 if user is not the author', async () => {
      const anotherUserId = new mongoose.Types.ObjectId().toHexString();
      mockRequest.params = { commentId: mockCommentId.toHexString() };
      mockRequest.user = anotherUserId;
      const mockExistingComment = {
        _id: mockCommentId,
        user: mockUserId,
      };
      mockedComment.findById.mockResolvedValue(mockExistingComment);

      await CommentService.deleteComment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Forbidden. You do not have permission to delete this comment.' });
    });
  });

  // ===================================
  // TESTS FOR getCommentsForTarget
  // ===================================
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