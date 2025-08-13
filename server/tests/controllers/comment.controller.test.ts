// tests/controllers/comment.controller.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import app from '../../src/app';
import CommentService from '../../src/services/comment.service';
import { LikeService } from '../../src/services/like.service';
import AuthJwtMiddleware from '../../src/middlewares/authJwt';

// Mock các service và middleware
vi.mock('../../src/services/comment.service');
vi.mock('../../src/services/like.service');
vi.mock('../../src/middlewares/authJwt');

const mockCommentService = vi.mocked(CommentService);
const mockLikeService = vi.mocked(LikeService);
const mockAuthMiddleware = vi.mocked(AuthJwtMiddleware);

// Giả lập middleware verifyToken để luôn cho qua và gán req.user
mockAuthMiddleware.verifyToken.mockImplementation((req, res, next) => {
  (req as any).user = 'mockUserId'; // Gán một user ID giả
  next();
});

describe('Comment Routes', () => {
  const planId = new Types.ObjectId().toString();
  const commentId = new Types.ObjectId().toString();
  const mockUserId = 'mockUserId';

  const mockComment = {
    _id: commentId,
    user: { _id: mockUserId, username: 'test' },
    content: 'A great plan!',
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- GET /api/plans/:id/comments ---
  describe('GET /api/plans/:id/comments', () => {
    it('should return comments for a travel plan with status 200', async () => {
      const serviceResponse = {
        comments: [mockComment],
        totalPages: 1,
        currentPage: 1,
      };
      mockCommentService.getCommentsForTarget.mockResolvedValue(
        serviceResponse as any,
      );

      const response = await request(app).get(
        `/api/plans/${planId}/comments?page=1&limit=10`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(serviceResponse);
      expect(mockCommentService.getCommentsForTarget).toHaveBeenCalledWith(
        planId,
        'TravelPlan',
        1,
        10,
      );
    });
  });

  // --- POST /api/plans/:id/comments ---
  describe('POST /api/plans/:id/comments', () => {
    it('should create a new comment and return it with status 201', async () => {
      mockCommentService.addComment.mockResolvedValue(mockComment as any);

      const response = await request(app)
        .post(`/api/plans/${planId}/comments`)
        .send({ content: 'A new comment' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockComment);
      expect(mockCommentService.addComment).toHaveBeenCalledWith(
        mockUserId,
        planId,
        'TravelPlan',
        { content: 'A new comment', parentId: undefined, imageUrl: undefined },
      );
    });
  });

  // --- PATCH /api/comments/:commentId ---
  describe('PATCH /api/comments/:commentId', () => {
    it('should update a comment and return it with status 200', async () => {
      const updatedComment = { ...mockComment, content: 'Updated content' };
      mockCommentService.updateComment.mockResolvedValue(updatedComment as any);

      const response = await request(app)
        .patch(`/api/comments/${commentId}`)
        .send({ content: 'Updated content' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedComment);
      expect(mockCommentService.updateComment).toHaveBeenCalledWith(
        commentId,
        mockUserId,
        'Updated content',
      );
    });
  });

  // --- DELETE /api/comments/:commentId ---
  describe('DELETE /api/comments/:commentId', () => {
    it('should delete a comment and return status 200', async () => {
      mockCommentService.deleteComment.mockResolvedValue();

      const response = await request(app).delete(`/api/comments/${commentId}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Comment deleted successfully.');
      expect(mockCommentService.deleteComment).toHaveBeenCalledWith(
        commentId,
        mockUserId,
      );
    });
  });

  // --- POST /api/comments/:commentId/like ---
  describe('POST /api/comments/:commentId/like', () => {
    it('should toggle a like and return the updated comment with status 200', async () => {
      const likedComment = { ...mockComment, likesCount: 1 };
      mockCommentService.toggleLike.mockResolvedValue(likedComment as any);

      const response = await request(app).post(
        `/api/comments/${commentId}/like`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(likedComment);
      expect(mockCommentService.toggleLike).toHaveBeenCalledWith(
        commentId,
        mockUserId,
      );
    });

    it('should return 400 for an invalid commentId', async () => {
      const response = await request(app).post('/api/comments/invalid-id/like');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid commentId.');
    });
  });

  // --- GET /api/comments/:commentId/replies ---
  describe('GET /api/comments/:commentId/replies', () => {
    it('should return replies for a comment with status 200', async () => {
      const replies = [
        {
          ...mockComment,
          _id: new Types.ObjectId().toString(),
          parentId: commentId,
        },
      ];
      mockCommentService.getRepliesForComment.mockResolvedValue(replies as any);

      const response = await request(app).get(
        `/api/comments/${commentId}/replies`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(replies);
      expect(mockCommentService.getRepliesForComment).toHaveBeenCalledWith(
        commentId,
      );
    });
  });
});
