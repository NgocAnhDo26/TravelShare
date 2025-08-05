import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Types } from 'mongoose';
import DiscoveryService from '../../src/services/discovery.service';
import TravelPlan from '../../src/models/travelPlan.model';

// Mock the TravelPlan model
vi.mock('../../src/models/travelPlan.model');
const mockTravelPlan = vi.mocked(TravelPlan);

describe('DiscoveryService.getTrendings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockPlans = [
    {
      _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
      title: 'Plan A',
      trendingScore: 95.2,
      privacy: 'public',
      author: {
        _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
        username: 'user1',
        displayName: 'User One',
        avatarUrl: 'https://example.com/avatar1.jpg',
      },
      createdAt: new Date('2024-01-01T10:00:00Z'),
    },
    {
      _id: new Types.ObjectId('507f1f77bcf86cd799439013'),
      title: 'Plan B',
      trendingScore: 92.1,
      privacy: 'public',
      author: {
        _id: new Types.ObjectId('507f1f77bcf86cd799439014'),
        username: 'user2',
        displayName: 'User Two',
        avatarUrl: 'https://example.com/avatar2.jpg',
      },
      createdAt: new Date('2024-01-01T11:00:00Z'),
    },
    {
      _id: new Types.ObjectId('507f1f77bcf86cd799439015'),
      title: 'Plan C',
      trendingScore: 0,
      privacy: 'public',
      author: {
        _id: new Types.ObjectId('507f1f77bcf86cd799439016'),
        username: 'user3',
        displayName: 'User Three',
        avatarUrl: 'https://example.com/avatar3.jpg',
      },
      createdAt: new Date('2024-01-01T12:00:00Z'),
    },
    {
      _id: new Types.ObjectId('507f1f77bcf86cd799439017'),
      title: 'Plan D',
      trendingScore: 0,
      privacy: 'public',
      author: {
        _id: new Types.ObjectId('507f1f77bcf86cd799439018'),
        username: 'user4',
        displayName: 'User Four',
        avatarUrl: 'https://example.com/avatar4.jpg',
      },
      createdAt: new Date('2024-01-01T13:00:00Z'),
    },
  ];

  it('should return trending plans with default options', async () => {
    // Mock the find method chain
    const mockFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(mockPlans.slice(0, 2)),
    };
    mockTravelPlan.find.mockReturnValue(mockFind as any);

    const result = await DiscoveryService.getTrendings();

    // Verify the query
    expect(mockTravelPlan.find).toHaveBeenCalledWith({ privacy: 'public' });
    expect(mockFind.populate).toHaveBeenCalledWith(
      'author',
      'username displayName avatarUrl',
    );
    expect(mockFind.sort).toHaveBeenCalledWith({ trendingScore: -1, _id: -1 });
    expect(mockFind.limit).toHaveBeenCalledWith(20);
    expect(mockFind.lean).toHaveBeenCalled();
    expect(mockFind.exec).toHaveBeenCalled();

    // Verify the result - when results.length < limit, should have no next cursor
    expect(result).toEqual({
      data: mockPlans.slice(0, 2),
      pagination: {
        next_cursor: null,
        has_next_page: false,
      },
    });
  });

  it('should handle custom limit', async () => {
    const mockFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(mockPlans.slice(0, 1)),
    };
    mockTravelPlan.find.mockReturnValue(mockFind as any);

    const result = await DiscoveryService.getTrendings({ limit: 1 });

    expect(mockFind.limit).toHaveBeenCalledWith(1);
    expect(result.pagination.has_next_page).toBe(true);
    expect(result.pagination.next_cursor).toBe('95.2|507f1f77bcf86cd799439011');
  });

  it('should handle cursor-based pagination', async () => {
    const cursor = '95.2|507f1f77bcf86cd799439011';
    const mockFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(mockPlans.slice(2, 4)),
    };
    mockTravelPlan.find.mockReturnValue(mockFind as any);

    const result = await DiscoveryService.getTrendings({ after: cursor });

    // Verify the cursor query
    expect(mockTravelPlan.find).toHaveBeenCalledWith({
      privacy: 'public',
      $or: [
        { trendingScore: { $lt: 95.2 } },
        { trendingScore: 95.2, _id: { $lt: '507f1f77bcf86cd799439011' } },
      ],
    });

    expect(result.data).toEqual(mockPlans.slice(2, 4));
  });

  it('should handle plans with zero trending score', async () => {
    const mockFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(mockPlans.slice(2, 4)),
    };
    mockTravelPlan.find.mockReturnValue(mockFind as any);

    const result = await DiscoveryService.getTrendings({ limit: 2 });

    expect(result.data).toEqual(mockPlans.slice(2, 4));
    expect(result.pagination.next_cursor).toBe('0|507f1f77bcf86cd799439017');
  });

  it('should return no next cursor when results are less than limit', async () => {
    const mockFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(mockPlans.slice(0, 2)),
    };
    mockTravelPlan.find.mockReturnValue(mockFind as any);

    const result = await DiscoveryService.getTrendings({ limit: 10 });

    expect(result.pagination.has_next_page).toBe(false);
    expect(result.pagination.next_cursor).toBeNull();
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

    const result = await DiscoveryService.getTrendings({
      after: 'invalid-cursor',
    });

    // Should create a query with invalid cursor values but still execute
    expect(mockTravelPlan.find).toHaveBeenCalledWith({
      privacy: 'public',
      $or: [
        { trendingScore: { $lt: NaN } },
        { trendingScore: NaN, _id: { $lt: undefined } },
      ],
    });
    expect(result.data).toEqual(mockPlans.slice(0, 2));
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

    const result = await DiscoveryService.getTrendings();

    expect(result.data).toEqual([]);
    expect(result.pagination.has_next_page).toBe(false);
    expect(result.pagination.next_cursor).toBeNull();
  });

  it('should handle cursor with zero trending score', async () => {
    const cursor = '0|507f1f77bcf86cd799439015';
    const mockFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([mockPlans[3]]),
    };
    mockTravelPlan.find.mockReturnValue(mockFind as any);

    const result = await DiscoveryService.getTrendings({ after: cursor });

    expect(mockTravelPlan.find).toHaveBeenCalledWith({
      privacy: 'public',
      $or: [
        { trendingScore: { $lt: 0 } },
        { trendingScore: 0, _id: { $lt: '507f1f77bcf86cd799439015' } },
      ],
    });

    expect(result.data).toEqual([mockPlans[3]]);
  });

  it('should handle database errors gracefully', async () => {
    const mockFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockRejectedValue(new Error('Database error')),
    };
    mockTravelPlan.find.mockReturnValue(mockFind as any);

    await expect(DiscoveryService.getTrendings()).rejects.toThrow(
      'Database error',
    );
  });
});
