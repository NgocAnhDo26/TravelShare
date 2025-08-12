import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import searchService from '../../src/services/search.service';

vi.mock('../../src/services/search.service');
const mockedSearchService = vi.mocked(searchService);

describe('Search Controller (DISC-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/search', () => {
    it('returns 400 when query is missing', async () => {
      const res = await request(app).get('/api/search').expect(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Search query is required',
      });
      expect(mockedSearchService.searchAll).not.toHaveBeenCalled();
    });

    it('validates pagination and type', async () => {
      const r1 = await request(app)
        .get('/api/search?q=paris&page=0')
        .expect(400);
      expect(r1.body.message).toBe('Page must be a positive number');

      const r2 = await request(app)
        .get('/api/search?q=paris&limit=200')
        .expect(400);
      expect(r2.body.message).toBe('Limit must be between 1 and 50');

      const r3 = await request(app)
        .get('/api/search?q=paris&type=unknown')
        .expect(400);
      expect(r3.body.message).toBe(
        'Type must be one of: all, plans, posts, users',
      );
    });

    it('aggregates results and computes pagination for type=all', async () => {
      mockedSearchService.searchAll.mockResolvedValue({
        plans: [{ _id: 'p1' } as any],
        posts: [{ _id: 'po1' } as any, { _id: 'po2' } as any],
        users: [{ _id: 'u1' } as any],
        totalPlans: 1,
        totalPosts: 2,
        totalUsers: 1,
      });

      const res = await request(app)
        .get('/api/search?q=paris&page=1&limit=10&type=all')
        .expect(200);

      expect(mockedSearchService.searchAll).toHaveBeenCalledWith({
        query: 'paris',
        page: 1,
        limit: 10,
        type: 'all',
        userId: undefined,
      });

      expect(res.body.success).toBe(true);
      expect(res.body.data.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalResults: 4,
        hasNextPage: false,
        hasPrevPage: false,
      });
    });

    it('uses totals of selected type for pagination', async () => {
      mockedSearchService.searchAll.mockResolvedValue({
        plans: [],
        posts: [],
        users: [],
        totalPlans: 7,
        totalPosts: 0,
        totalUsers: 0,
      } as any);

      const res = await request(app)
        .get('/api/search?q=paris&type=plans&limit=5&page=2')
        .expect(200);

      expect(res.body.data.pagination).toEqual({
        currentPage: 2,
        totalPages: 2,
        totalResults: 7,
        hasNextPage: false,
        hasPrevPage: true,
      });
    });
  });

  describe('GET /api/search/suggestions', () => {
    it('requires query', async () => {
      const res = await request(app).get('/api/search/suggestions').expect(400);
      expect(res.body.message).toBe('Search query is required');
    });

    it('returns suggestions payload', async () => {
      mockedSearchService.getSearchSuggestions.mockResolvedValue({
        plans: [{ id: 'p', type: 'plan', title: 'Plan', subtitle: 'Paris' }],
        users: [{ id: 'u', type: 'user', title: 'User', subtitle: '@user' }],
        posts: [{ id: 'po', type: 'post', title: 'Post', subtitle: '...' }],
      } as any);

      const res = await request(app)
        .get('/api/search/suggestions?q=par')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.plans[0].type).toBe('plan');
      expect(mockedSearchService.getSearchSuggestions).toHaveBeenCalledWith(
        'par',
        5,
      );
    });
  });

  describe('GET /api/search/plans', () => {
    it('requires query', async () => {
      const res = await request(app).get('/api/search/plans').expect(400);
      expect(res.body.message).toBe('Search query is required');
    });

    it('returns plans and pagination', async () => {
      mockedSearchService.searchPlans.mockResolvedValue({
        plans: [{ _id: 'p1' }],
        total: 6,
      } as any);
      const res = await request(app)
        .get('/api/search/plans?q=paris&page=2&limit=2')
        .expect(200);

      expect(mockedSearchService.searchPlans).toHaveBeenCalledWith(
        'paris',
        2,
        2,
      );
      expect(res.body.data.pagination.totalPages).toBe(3);
    });
  });

  describe('GET /api/search/posts', () => {
    it('returns posts and pagination', async () => {
      mockedSearchService.searchPosts.mockResolvedValue({
        posts: [{ _id: 'po1' }],
        total: 3,
      } as any);
      const res = await request(app)
        .get('/api/search/posts?q=paris&page=1&limit=2')
        .expect(200);

      expect(mockedSearchService.searchPosts).toHaveBeenCalledWith(
        'paris',
        0,
        2,
      );
      expect(res.body.data.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /api/search/users', () => {
    it('returns users and pagination', async () => {
      mockedSearchService.searchUsers.mockResolvedValue({
        users: [{ _id: 'u1' }],
        total: 1,
      } as any);
      const res = await request(app)
        .get('/api/search/users?q=ann&page=1&limit=10')
        .expect(200);

      expect(mockedSearchService.searchUsers).toHaveBeenCalledWith(
        'ann',
        0,
        10,
        undefined,
      );
      expect(res.body.data.pagination.totalPages).toBe(1);
    });
  });
});
