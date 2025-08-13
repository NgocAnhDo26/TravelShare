import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchService from '../../src/services/search.service';
import TravelPlan from '../../src/models/travelPlan.model';
import Post from '../../src/models/post.model';
import User from '../../src/models/user.model';

vi.mock('../../src/models/travelPlan.model');
vi.mock('../../src/models/post.model');
vi.mock('../../src/models/user.model');

const mockChain = (result: any) => ({
  select: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue(result),
});

describe('Search Service suggestions (DISC-03)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns suggestions mapped to expected shape', async () => {
    (TravelPlan as any).find.mockReturnValue(
      mockChain([
        { _id: 'p1', title: 'Paris', destination: { name: 'Paris' } },
      ]) as any,
    );
    (User as any).find.mockReturnValue(
      mockChain([
        { _id: 'u1', username: 'ann', displayName: 'Ann', avatarUrl: 'a' },
      ]) as any,
    );
    (Post as any).find.mockReturnValue(
      mockChain([{ _id: 'po1', title: 'Trip', content: 'content' }]) as any,
    );

    const res = await SearchService.getSearchSuggestions('pa', 5);

    expect(res.plans[0]).toEqual({
      id: 'p1',
      type: 'plan',
      title: 'Paris',
      subtitle: 'Paris',
    });
    expect(res.users[0]).toEqual({
      id: 'u1',
      type: 'user',
      title: 'Ann',
      subtitle: '@ann',
      avatarUrl: 'a',
    });
    expect(res.posts[0]).toEqual({
      id: 'po1',
      type: 'post',
      title: 'Trip',
      subtitle: 'content',
    });
  });
});
