import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Types } from 'mongoose';
import DiscoveryService from '../../src/services/discovery.service';
import TravelPlan from '../../src/models/travelPlan.model';
import Post from '../../src/models/post.model';

// Mock the models
vi.mock('../../src/models/travelPlan.model');
vi.mock('../../src/models/post.model');
const mockTravelPlan = vi.mocked(TravelPlan);
const mockPost = vi.mocked(Post);

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

  const mockPosts = [
    {
      _id: new Types.ObjectId('507f1f77bcf86cd799439019'),
      title: 'Post A',
      trendingScore: 88.5,
      privacy: 'public',
      author: {
        _id: new Types.ObjectId('507f1f77bcf86cd799439020'),
        username: 'user5',
        displayName: 'User Five',
        avatarUrl: 'https://example.com/avatar5.jpg',
      },
      createdAt: new Date('2024-01-01T14:00:00Z'),
    },
  ];

  it('should return trending content with default options', async () => {
    // Mock the find method chain for both models
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

    const result = await DiscoveryService.getTrendings();

    // Verify the queries
    expect(mockTravelPlan.find).toHaveBeenCalledWith({ privacy: 'public' });
    expect(mockPost.find).toHaveBeenCalledWith({ privacy: 'public' });
    expect(mockPlanFind.populate).toHaveBeenCalledWith(
      'author',
      'username displayName avatarUrl',
    );
    expect(mockPlanFind.sort).toHaveBeenCalledWith({ trendingScore: -1, _id: -1 });
    expect(mockPlanFind.limit).toHaveBeenCalledWith(20);
    expect(mockPlanFind.lean).toHaveBeenCalled();
    expect(mockPlanFind.exec).toHaveBeenCalled();

    // Verify the result - should include type field and have no next cursor when results < limit
    const expectedData = mockPlans.slice(0, 2).map(plan => ({ ...plan, type: 'TravelPlan' }));
    expect(result).toEqual({
      data: expectedData,
      pagination: {
        next_cursor: null,
        has_next_page: false,
      },
    });
  });

  it('should handle custom limit', async () => {
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

    const result = await DiscoveryService.getTrendings({ limit: 1 });

    expect(mockPlanFind.limit).toHaveBeenCalledWith(1);
    expect(result.pagination.has_next_page).toBe(true);
    // New cursor format includes type: trendingScore|type|_id
    expect(result.pagination.next_cursor).toBe('95.2|TravelPlan|507f1f77bcf86cd799439011');
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

    const result = await DiscoveryService.getTrendings({ after: cursor });

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
    expect(mockPostFind.limit).toHaveBeenCalledWith(20);
  });

  it('should handle plans with zero trending score', async () => {
    const mockPlanFind = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(mockPlans.slice(2, 4)),
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

    const result = await DiscoveryService.getTrendings({ limit: 2 });

    // When both plans have the same trending score (0), they're sorted by _id in descending order
    // Plan D (507f1f77bcf86cd799439017) comes before Plan C (507f1f77bcf86cd799439015)
    const expectedData = [
      { ...mockPlans[3], type: 'TravelPlan' }, // Plan D
      { ...mockPlans[2], type: 'TravelPlan' }, // Plan C
    ];
    expect(result.data).toEqual(expectedData);
    // New cursor format - should be Plan C's ID since it comes last
    expect(result.pagination.next_cursor).toBe('0|TravelPlan|507f1f77bcf86cd799439015');
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

    const result = await DiscoveryService.getTrendings({ after: 'invalid-cursor' });

    // Should still return results despite invalid cursor
    expect(result.data).toEqual(mockPlans.slice(0, 2).map(plan => ({ ...plan, type: 'TravelPlan' })));
    expect(mockTravelPlan.find).toHaveBeenCalledWith({ privacy: 'public' });
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

    const result = await DiscoveryService.getTrendings({ after: cursor });

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
    expect(result.data).toEqual([]);
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

    const result = await DiscoveryService.getTrendings({ limit: 2 });

    // Should combine and sort by trending score
    const expectedData = [
      { ...mockPlans[0], type: 'TravelPlan' }, // Score: 95.2
      { ...mockPosts[0], type: 'Post' },        // Score: 88.5
    ];
    
    expect(result.data).toEqual(expectedData);
    expect(result.pagination.next_cursor).toBe('88.5|Post|507f1f77bcf86cd799439019');
  });
});
