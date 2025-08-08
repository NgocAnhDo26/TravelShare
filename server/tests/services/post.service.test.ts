import { describe, it, expect, vi, beforeEach } from 'vitest';
import PostService from '../../src/services/post.service';
import Post from '../../src/models/post.model';
import { Types } from 'mongoose';

vi.mock('../../src/models/post.model');

const mockPostCtor: any = Post as any;

const mockReqRes = () => {
  const req: any = {
    user: new Types.ObjectId().toHexString(),
    body: {
      title: 'Hello',
      content: 'This is a content with at least 10 chars',
      privacy: 'public',
      coverImageUrl: 'https://ex/cover.jpg',
      images: ['https://ex/1.jpg'],
      relatedPlan: new Types.ObjectId().toHexString(),
    },
  };
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
  return { req, res };
};

describe('PostService.createPost (SOC-06)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates post and converts author and relatedPlan to ObjectId', async () => {
    const { req, res } = mockReqRes();

    const savedInstance = { ...req.body, _id: new Types.ObjectId(), save: vi.fn().mockResolvedValue(null) } as any;

    mockPostCtor.mockImplementation((doc: any) => {
      // Expect doc fields to be ObjectId
      expect(Types.ObjectId.isValid(doc.author)).toBe(true);
      expect(Types.ObjectId.isValid(doc.relatedPlan)).toBe(true);
      // Return instance with save
      return { ...doc, save: savedInstance.save };
    });

    await PostService.createPost(req, res);

    expect(savedInstance.save).toHaveBeenCalledTimes(1); // save called once
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Post created successfully', data: expect.any(Object) }),
    );
  });

  it('handles errors gracefully', async () => {
    const { req, res } = mockReqRes();

    mockPostCtor.mockImplementation(() => ({
      save: vi.fn().mockRejectedValue(new Error('db error')),
    }));

    await PostService.createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Internal server error' }),
    );
  });
});
