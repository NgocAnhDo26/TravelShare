import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import app from '../../src/app';
import TravelPlan from '../../src/models/travelPlan.model';
import Post from '../../src/models/post.model';

// Mock the models
vi.mock('../../src/models/travelPlan.model');
vi.mock('../../src/models/post.model');
const mockTravelPlan = vi.mocked(TravelPlan);
const mockPost = vi.mocked(Post);

describe('GET /api/discovery/discover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockPlans = [
    {
      _id: '507f1f77bcf86cd799439011',
      title: 'Plan A',
      trendingScore: 95.2,
      privacy: 'public',
      author: {
        _id: '507f1f77bcf86cd799439012',
        username: 'user1',
        displayName: 'User One',
        avatarUrl: 'https://example.com/avatar1.jpg',
      },
      createdAt: '2024-01-01T10:00:00.000Z',
      isLiked: false,
    },
    {
      _id: '507f1f77bcf86cd799439013',
      title: 'Plan B',
      trendingScore: 92.1,
      privacy: 'public',
      author: {
        _id: '507f1f77bcf86cd799439014',
        username: 'user2',
        displayName: 'User Two',
        avatarUrl: 'https://example.com/avatar2.jpg',
      },
      createdAt: '2024-01-01T11:00:00.000Z',
      isLiked: false,
    },
    {
      _id: '507f1f77bcf86cd799439015',
      title: 'Plan C',
      trendingScore: 0,
      privacy: 'public',
      author: {
        _id: '507f1f77bcf86cd799439016',
        username: 'user3',
        displayName: 'User Three',
        avatarUrl: 'https://example.com/avatar3.jpg',
      },
      createdAt: '2024-01-01T12:00:00.000Z',
      isLiked: false,
    },
  ];

  const mockPosts = [
    {
      _id: '507f1f77bcf86cd799439019',
      title: 'Post A',
      trendingScore: 88.5,
      privacy: 'public',
      author: {
        _id: '507f1f77bcf86cd799439020',
        username: 'user5',
        displayName: 'User Five',
        avatarUrl: 'https://example.com/avatar5.jpg',
      },
      createdAt: '2024-01-01T14:00:00.000Z',
      isLiked: false,
    },
  ];

  it('should return trending content with default pagination', async () => {
    const mockPlanFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(mockPlans.slice(0, 2)),
    };
    const mockPostFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    };

    mockTravelPlan.find.mockReturnValue(mockPlanFind as any);
    mockPost.find.mockReturnValue(mockPostFind as any);

    const response = await request(app)
      .get('/api/discovery/discover')
      .expect(200);

    // Should include type field for each item
    const expectedData = mockPlans
      .slice(0, 2)
      .map((plan) => ({ ...plan, type: 'TravelPlan' }));
    expect(response.body).toEqual({
      data: expectedData,
      pagination: {
        next_cursor: null,
        has_next_page: false,
      },
    });

    expect(mockTravelPlan.find).toHaveBeenCalledWith({ privacy: 'public' });
    expect(mockPost.find).toHaveBeenCalledWith({ privacy: 'public' });
    expect(mockPlanFind.limit).toHaveBeenCalledWith(20);
  });

  it('should handle custom limit parameter', async () => {
    const mockPlanFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(mockPlans.slice(0, 1)),
    };
    const mockPostFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    };

    mockTravelPlan.find.mockReturnValue(mockPlanFind as any);
    mockPost.find.mockReturnValue(mockPostFind as any);

    const response = await request(app)
      .get('/api/discovery/discover?limit=1')
      .expect(200);

    expect(mockPlanFind.limit).toHaveBeenCalledWith(1);
    expect(response.body.pagination.has_next_page).toBe(true);
    // New cursor format includes type
    expect(response.body.pagination.next_cursor).toBe(
      '95.2|TravelPlan|507f1f77bcf86cd799439011',
    );
  });

  it('should handle cursor-based pagination', async () => {
    const cursor = '95.2|TravelPlan|507f1f77bcf86cd799439011';
    const mockPlanFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(mockPlans.slice(1, 3)),
    };
    const mockPostFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    };

    mockTravelPlan.find.mockReturnValue(mockPlanFind as any);
    mockPost.find.mockReturnValue(mockPostFind as any);

    const response = await request(app)
      .get(`/api/discovery/discover?after=${cursor}`)
      .expect(200);

    // Verify the cursor query
    expect(mockTravelPlan.find).toHaveBeenCalledWith({
      privacy: 'public',
      $or: [
        { trendingScore: { $lt: 95.2 } },
        {
          trendingScore: 95.2,
          _id: { $lt: '507f1f77bcf86cd799439011' },
        },
      ],
    });
    expect(mockPlanFind.limit).toHaveBeenCalledWith(20);
  });

  it('should handle plans with zero trending score', async () => {
    const mockPlanFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([mockPlans[2]]),
    };
    const mockPostFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    };

    mockTravelPlan.find.mockReturnValue(mockPlanFind as any);
    mockPost.find.mockReturnValue(mockPostFind as any);

    const response = await request(app)
      .get('/api/discovery/discover?limit=1')
      .expect(200);

    const expectedData = [{ ...mockPlans[2], type: 'TravelPlan' }];
    expect(response.body.data).toEqual(expectedData);
    expect(response.body.pagination.next_cursor).toBe(
      '0|TravelPlan|507f1f77bcf86cd799439015',
    );
  });

  it('should handle invalid cursor format gracefully', async () => {
    const mockPlanFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(mockPlans.slice(0, 2)),
    };
    const mockPostFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    };

    mockTravelPlan.find.mockReturnValue(mockPlanFind as any);
    mockPost.find.mockReturnValue(mockPostFind as any);

    const response = await request(app)
      .get('/api/discovery/discover?after=invalid-cursor')
      .expect(200);

    // Should still return results despite invalid cursor
    const expectedData = mockPlans
      .slice(0, 2)
      .map((plan) => ({ ...plan, type: 'TravelPlan' }));
    expect(response.body.data).toEqual(expectedData);
    expect(mockTravelPlan.find).toHaveBeenCalledWith({ privacy: 'public' });
  });

  it('should handle invalid limit parameter', async () => {
    const mockPlanFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(mockPlans.slice(0, 2)),
    };
    const mockPostFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    };

    mockTravelPlan.find.mockReturnValue(mockPlanFind as any);
    mockPost.find.mockReturnValue(mockPostFind as any);

    const response = await request(app)
      .get('/api/discovery/discover?limit=invalid')
      .expect(200);

    // Should use default limit of 20
    expect(mockPlanFind.limit).toHaveBeenCalledWith(20);
    const expectedData = mockPlans
      .slice(0, 2)
      .map((plan) => ({ ...plan, type: 'TravelPlan' }));
    expect(response.body.data).toEqual(expectedData);
  });

  it('should handle cursor with zero trending score', async () => {
    const cursor = '0|TravelPlan|507f1f77bcf86cd799439015';
    const mockPlanFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    };
    const mockPostFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    };

    mockTravelPlan.find.mockReturnValue(mockPlanFind as any);
    mockPost.find.mockReturnValue(mockPostFind as any);

    const response = await request(app)
      .get(`/api/discovery/discover?after=${cursor}`)
      .expect(200);

    // Verify the cursor query
    expect(mockTravelPlan.find).toHaveBeenCalledWith({
      privacy: 'public',
      $or: [
        { trendingScore: { $lt: 0 } },
        {
          trendingScore: 0,
          _id: { $lt: '507f1f77bcf86cd799439015' },
        },
      ],
    });
    expect(response.body.data).toEqual([]);
  });

  it('should handle mixed content types correctly', async () => {
    const mockPlanFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(mockPlans.slice(0, 1)),
    };
    const mockPostFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(mockPosts.slice(0, 1)),
    };

    mockTravelPlan.find.mockReturnValue(mockPlanFind as any);
    mockPost.find.mockReturnValue(mockPostFind as any);

    const response = await request(app)
      .get('/api/discovery/discover?limit=2')
      .expect(200);

    // Should combine and sort by trending score
    const expectedData = [
      { ...mockPlans[0], type: 'TravelPlan' }, // Score: 95.2
      { ...mockPosts[0], type: 'Post' }, // Score: 88.5
    ];

    expect(response.body.data).toEqual(expectedData);
    expect(response.body.pagination.next_cursor).toBe(
      '88.5|Post|507f1f77bcf86cd799439019',
    );
  });
});
