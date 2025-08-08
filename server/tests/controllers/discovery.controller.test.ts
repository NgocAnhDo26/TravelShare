import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import app from '../../src/app';
import TravelPlan from '../../src/models/travelPlan.model';

// Mock the TravelPlan model
vi.mock('../../src/models/travelPlan.model');
const mockTravelPlan = vi.mocked(TravelPlan);

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

  it('should return trending plans with default pagination', async () => {
    const mockFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(mockPlans.slice(0, 2)),
    };
    mockTravelPlan.find.mockReturnValue(mockFind as any);

    const response = await request(app)
      .get('/api/discovery/discover')
      .expect(200);

    expect(response.body).toEqual({
      data: mockPlans.slice(0, 2),
      pagination: {
        next_cursor: null,
        has_next_page: false,
      },
    });

    expect(mockTravelPlan.find).toHaveBeenCalledWith({ privacy: 'public' });
    expect(mockFind.limit).toHaveBeenCalledWith(20);
  });

  it('should handle custom limit parameter', async () => {
    const mockFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(mockPlans.slice(0, 1)),
    };
    mockTravelPlan.find.mockReturnValue(mockFind as any);

    const response = await request(app)
      .get('/api/discovery/discover?limit=1')
      .expect(200);

    expect(mockFind.limit).toHaveBeenCalledWith(1);
    expect(response.body.pagination.has_next_page).toBe(true);
  });

  it('should handle cursor-based pagination', async () => {
    const cursor = '95.2|507f1f77bcf86cd799439011';
    const mockFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([mockPlans[2]]),
    };
    mockTravelPlan.find.mockReturnValue(mockFind as any);

    const response = await request(app)
      .get(`/api/discovery/discover?after=${encodeURIComponent(cursor)}`)
      .expect(200);

    expect(mockTravelPlan.find).toHaveBeenCalledWith({
      privacy: 'public',
      $or: [
        { trendingScore: { $lt: 95.2 } },
        { trendingScore: 95.2, _id: { $lt: '507f1f77bcf86cd799439011' } },
      ],
    });

    expect(response.body.data).toEqual([mockPlans[2]]);
  });

  it('should handle plans with zero trending score', async () => {
    const mockFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([mockPlans[2]]),
    };
    mockTravelPlan.find.mockReturnValue(mockFind as any);

    const response = await request(app)
      .get('/api/discovery/discover?limit=1')
      .expect(200);

    expect(response.body.data).toEqual([mockPlans[2]]);
    expect(response.body.pagination.next_cursor).toBe(
      '0|507f1f77bcf86cd799439015',
    );
  });

  it('should handle empty results', async () => {
    const mockFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    };
    mockTravelPlan.find.mockReturnValue(mockFind as any);

    const response = await request(app)
      .get('/api/discovery/discover')
      .expect(200);

    expect(response.body.data).toEqual([]);
    expect(response.body.pagination.has_next_page).toBe(false);
    expect(response.body.pagination.next_cursor).toBeNull();
  });

  it('should handle invalid cursor format gracefully', async () => {
    const mockFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(mockPlans.slice(0, 2)),
    };
    mockTravelPlan.find.mockReturnValue(mockFind as any);

    const response = await request(app)
      .get('/api/discovery/discover?after=invalid-cursor')
      .expect(200);

    // Should create a query with invalid cursor values but still execute
    expect(mockTravelPlan.find).toHaveBeenCalledWith({
      privacy: 'public',
      $or: [
        { trendingScore: { $lt: NaN } },
        { trendingScore: NaN, _id: { $lt: undefined } },
      ],
    });
    expect(response.body.data).toEqual(mockPlans.slice(0, 2));
  });

  it('should handle invalid limit parameter', async () => {
    const mockFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(mockPlans.slice(0, 2)),
    };
    mockTravelPlan.find.mockReturnValue(mockFind as any);

    const response = await request(app)
      .get('/api/discovery/discover?limit=invalid')
      .expect(200);

    // Should use default limit of 20
    expect(mockFind.limit).toHaveBeenCalledWith(20);
    expect(response.body.data).toEqual(mockPlans.slice(0, 2));
  });

  it('should handle database errors', async () => {
    const mockFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockRejectedValue(new Error('Database connection failed')),
    };
    mockTravelPlan.find.mockReturnValue(mockFind as any);

    const response = await request(app)
      .get('/api/discovery/discover')
      .expect(500);

    expect(response.body).toHaveProperty('message');
  });

  it('should handle cursor with zero trending score', async () => {
    const cursor = '0|507f1f77bcf86cd799439015';
    const mockFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    };
    mockTravelPlan.find.mockReturnValue(mockFind as any);

    const response = await request(app)
      .get(`/api/discovery/discover?after=${encodeURIComponent(cursor)}`)
      .expect(200);

    expect(mockTravelPlan.find).toHaveBeenCalledWith({
      privacy: 'public',
      $or: [
        { trendingScore: { $lt: 0 } },
        { trendingScore: 0, _id: { $lt: '507f1f77bcf86cd799439015' } },
      ],
    });

    expect(response.body.data).toEqual([]);
  });
});
