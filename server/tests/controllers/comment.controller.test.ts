import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import app from '../../src/app'; 
import CommentService from '../../src/services/comment.service';

vi.mock('../../src/services/comment.service');

const mockedCommentService = vi.mocked(CommentService);

describe('Comment Routes - Integration Tests', () => {
  const mockUserId = new Types.ObjectId().toHexString();
  const mockTargetId = new Types.ObjectId().toHexString();
  const mockCommentId = new Types.ObjectId().toHexString();
  const mockUser = { _id: mockUserId, username: 'testuser' };

  beforeEach(() => {
    
    vi.resetAllMocks();
  });


  describe('POST /api/comments', () => {
    it('should call CommentService.addComment and return 201 on success', async () => {
      const commentData = {
        content: 'A new test comment',
        targetId: mockTargetId,
        onModel: 'TravelPlan',
      };

      mockedCommentService.addComment.mockImplementation(async (req, res) => {
        res.status(201).json({ _id: mockCommentId, ...commentData, user: mockUser });
      });

      const response = await request(app)
        .post('/api/comments') 
        .send(commentData)
        .expect(201);

  
      expect(mockedCommentService.addComment).toHaveBeenCalledTimes(1);
    
      expect(response.body).toEqual(expect.objectContaining({
        _id: mockCommentId,
        content: 'A new test comment'
      }));
    });

    it('should return 500 if CommentService throws an error', async () => {

      mockedCommentService.addComment.mockImplementation(async (req, res) => {
        res.status(500).json({ error: 'Internal Server Error' });
      });

      await request(app)
        .post('/api/comments')
        .send({ content: 'test' })
        .expect(500);
    });
  });


  describe('DELETE /api/comments/:commentId', () => {
    it('should call CommentService.deleteComment and return 200 on success', async () => {
      mockedCommentService.deleteComment.mockImplementation(async (req, res) => {
        res.status(200).json({ message: 'Comment deleted successfully.' });
      });

      const response = await request(app)
        .delete(`/api/comments/${mockCommentId}`) 
        .expect(200);

      expect(mockedCommentService.deleteComment).toHaveBeenCalledTimes(1);
      expect(response.body.message).toBe('Comment deleted successfully.');
    });
  });

  describe('GET /api/comments/target/:targetId', () => {
    it('should call CommentService.getCommentsForTarget and return 200', async () => {
      const mockComments = [{ content: 'Comment 1' }, { content: 'Comment 2' }];
      mockedCommentService.getCommentsForTarget.mockImplementation(async (req, res) => {
        res.status(200).json(mockComments);
      });

      const response = await request(app)
        .get(`/api/comments/target/${mockTargetId}?onModel=TravelPlan`) // <-- Thay bằng endpoint thực tế
        .expect(200);

      expect(mockedCommentService.getCommentsForTarget).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual(mockComments);
    });
  });
});