import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchService from '../../src/services/search.service';
import TravelPlan from '../../src/models/travelPlan.model';
import Post from '../../src/models/post.model';
import User from '../../src/models/user.model';

vi.mock('../../src/models/travelPlan.model');
vi.mock('../../src/models/post.model');
vi.mock('../../src/models/user.model');

const mockedPlan = vi.mocked(TravelPlan as any);
const mockedPost = vi.mocked(Post as any);
const mockedUser = vi.mocked(User as any);

// Helper to mock mongoose chain
const mockChain = (result: any) => ({
  populate: vi.fn().mockReturnThis(),
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue(result),
  exec: vi.fn().mockResolvedValue(result),
});

describe('Search Service (DISC-03)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('searchPlans builds query and returns results', async () => {
    mockedPlan.find.mockReturnValue(mockChain([{ _id: 'p1' }]) as any);
    mockedPlan.countDocuments.mockResolvedValue(3);

    const res = await SearchService.searchPlans('paris', 0, 2);
    expect(mockedPlan.find).toHaveBeenCalled();
    expect(res.plans).toHaveLength(1);
    expect(res.total).toBe(3);
  });

  it('searchPosts builds query and returns results', async () => {
    mockedPost.find.mockReturnValue(mockChain([{ _id: 'po1' }]) as any);
    mockedPost.countDocuments.mockResolvedValue(5);

    const res = await SearchService.searchPosts('mountain', 2, 2);
    expect(mockedPost.find).toHaveBeenCalled();
    expect(res.posts).toHaveLength(1);
    expect(res.total).toBe(5);
  });

  it('searchUsers returns users and total', async () => {
    mockedUser.find.mockReturnValue(mockChain([{ _id: 'u1', username: 'ann' }]) as any);
    mockedUser.countDocuments.mockResolvedValue(1);

    const res = await SearchService.searchUsers('ann', 0, 10);
    expect(mockedUser.find).toHaveBeenCalled();
    expect(res.users.length).toBe(1);
    expect(res.total).toBe(1);
  });

  it('searchAll delegates to type-specific methods', async () => {
    const svc = SearchService as any;
    const sp = vi.spyOn(svc, 'searchPlans').mockResolvedValue({ plans: [1], total: 1 });
    const spo = vi.spyOn(svc, 'searchPosts').mockResolvedValue({ posts: [2], total: 2 });
    const su = vi.spyOn(svc, 'searchUsers').mockResolvedValue({ users: [3], total: 3 });

    const res = await SearchService.searchAll({ query: 'x', page: 1, limit: 10, type: 'all' });
    expect(sp).toHaveBeenCalled();
    expect(spo).toHaveBeenCalled();
    expect(su).toHaveBeenCalled();
    expect(res.totalPlans + res.totalPosts + res.totalUsers).toBe(6);
  });
});
