import { vi, describe, it, expect, afterEach } from 'vitest';
import { TravelPlanService } from '../../src/services/travelPlan.service';
import TravelPlan from '../../src/models/travelPlan.model';
import { generateSchedule } from '../../src/utils/travelPlan';
import { Types } from 'mongoose';
import { suppressConsoleErrorAsync } from '../setup';
import Follow from '../../src/models/follow.model';

// Mock the Mongoose model and utility functions
vi.mock('../../src/models/travelPlan.model');
vi.mock('../../src/utils/travelPlan');
vi.mock('../../src/models/follow.model');

const mockedTravelPlan = TravelPlan as any;
const mockedGenerateSchedule = generateSchedule as any;
const mockedFollow = Follow as any;

describe('TravelPlanService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createTravelPlan', () => {
    it('should create a travel plan with a generated schedule', async () => {
      const planData = {
        title: 'Test Trip',
        destination: { placeId: '1', name: 'Test Dest', address: '123 Test St' },
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-03'),
      };
      const authorId = new Types.ObjectId().toHexString();
      const schedule = [{ dayNumber: 1, date: new Date('2024-01-01'), items: [{
        _id: new Types.ObjectId(),
        type: 'activity',
        title: 'Visit Place',
        cost: '0',
        order: 1,
        location: { placeId: '1', name: 'Test Place', address: '123 Test St', coordinates: { lat: 0, lng: 0 } }
      }] }];
      const newPlan = { ...planData, author: authorId, schedule };

      mockedGenerateSchedule.mockReturnValue(schedule);
      mockedTravelPlan.create.mockResolvedValue(newPlan);

      const result = await TravelPlanService.createTravelPlan(planData, authorId);

      expect(mockedGenerateSchedule).toHaveBeenCalledWith(planData.startDate, planData.endDate);
      expect(mockedTravelPlan.create).toHaveBeenCalledWith({
        ...planData,
        author: new Types.ObjectId(authorId),
        schedule,
      });
      expect(result).toEqual(newPlan);
    });
  });

  describe('getTravelPlanById', () => {
    it('should return a travel plan by its ID', async () => {
      const planId = new Types.ObjectId().toHexString();
      const plan = { _id: planId, title: 'Test Plan' };
      mockedTravelPlan.findById.mockResolvedValue(plan);

      const result = await TravelPlanService.getTravelPlanById(planId);

      expect(mockedTravelPlan.findById).toHaveBeenCalledWith(planId);
      expect(result).toEqual(plan);
    });
  });

  describe('getTravelPlansByAuthor', () => {
    it('should return all travel plans for a given author', async () => {
      const authorId = new Types.ObjectId().toHexString();
      const plans = [{ title: 'Plan 1' }, { title: 'Plan 2' }];
      mockedTravelPlan.find.mockResolvedValue(plans);

      const result = await TravelPlanService.getTravelPlansByAuthor(authorId);

      expect(mockedTravelPlan.find).toHaveBeenCalledWith({ author: authorId });
      expect(result).toEqual(plans);
    });
  });

  describe('getPublicTravelPlans', () => {
    it('should return all public travel plans', async () => {
      const publicPlans = [{ title: 'Public Plan', privacy: 'public' }];
      mockedTravelPlan.find.mockResolvedValue(publicPlans);

      const result = await TravelPlanService.getPublicTravelPlans();

      expect(mockedTravelPlan.find).toHaveBeenCalledWith({ privacy: 'public' });
      expect(result).toEqual(publicPlans);
    });
  });

  describe('deleteTravelPlan', () => {
    it('should delete a travel plan if the user is the author', async () => {
      const planId = new Types.ObjectId().toHexString();
      const authorId = new Types.ObjectId().toHexString();
      mockedTravelPlan.findOne.mockResolvedValue({ _id: planId, author: authorId });
      mockedTravelPlan.findByIdAndDelete.mockResolvedValue(true);

      const result = await TravelPlanService.deleteTravelPlan(planId, authorId);

      expect(mockedTravelPlan.findOne).toHaveBeenCalledWith({ _id: planId, author: authorId });
      expect(mockedTravelPlan.findByIdAndDelete).toHaveBeenCalledWith(planId);
      expect(result).toBe(true);
    });

    it('should not delete a travel plan if the user is not the author', async () => {
      const planId = new Types.ObjectId().toHexString();
      const authorId = new Types.ObjectId().toHexString();
      mockedTravelPlan.findOne.mockResolvedValue(null);

      const result = await TravelPlanService.deleteTravelPlan(planId, authorId);

      expect(mockedTravelPlan.findOne).toHaveBeenCalledWith({ _id: planId, author: authorId });
      expect(mockedTravelPlan.findByIdAndDelete).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('updateTravelPlanTitle', () => {
    it('should update the title of a travel plan', async () => {
      const planId = new Types.ObjectId().toHexString();
      const authorId = new Types.ObjectId().toHexString();
      const newTitle = 'New Title';
      const plan = {
        _id: planId,
        author: authorId,
        title: 'Old Title',
        save: vi.fn().mockResolvedValue({ title: newTitle }),
      };
      mockedTravelPlan.findById.mockResolvedValue(plan);

      const result = await TravelPlanService.updateTravelPlanTitle(planId, authorId, newTitle);

      expect(mockedTravelPlan.findById).toHaveBeenCalledWith(planId);
      expect(plan.save).toHaveBeenCalled();
      expect(result.title).toBe(newTitle);
    });
  });

  describe('updateTravelPlanPrivacy', () => {
    it('should update the privacy of a travel plan', async () => {
      const planId = new Types.ObjectId().toHexString();
      const authorId = new Types.ObjectId().toHexString();
      const newPrivacy = 'public';
      const plan = {
        _id: planId,
        author: authorId,
        privacy: 'private',
        save: vi.fn().mockResolvedValue({ privacy: newPrivacy }),
      };
      mockedTravelPlan.findById.mockResolvedValue(plan);

      const result = await TravelPlanService.updateTravelPlanPrivacy(planId, authorId, newPrivacy);

      expect(mockedTravelPlan.findById).toHaveBeenCalledWith(planId);
      expect(plan.save).toHaveBeenCalled();
      expect(result.privacy).toBe(newPrivacy);
    });
  });

  describe('updateTravelPlanCoverImage', () => {
    it('should update the cover image URL of a travel plan', async () => {
      await suppressConsoleErrorAsync(async () => {
        const planId = new Types.ObjectId().toHexString();
        const authorId = new Types.ObjectId().toHexString();
        const newCoverUrl = 'http://example.com/new-cover.jpg';
        const plan = {
          _id: planId,
          author: authorId,
          coverImageUrl: 'http://example.com/old-cover.jpg',
          save: vi.fn().mockResolvedValue({ coverImageUrl: newCoverUrl }),
        };
        mockedTravelPlan.findById.mockResolvedValue(plan);

        const result = await TravelPlanService.updateTravelPlanCoverImage(planId, authorId, newCoverUrl);

        expect(mockedTravelPlan.findById).toHaveBeenCalledWith(planId);
        expect(plan.save).toHaveBeenCalled();
        expect(result.coverImageUrl).toBe(newCoverUrl);
      });
    });
  });

  describe('updateTravelPlanDates', () => {
    it('should update dates and regenerate schedule when date range shrinks', async () => {
      const planId = new Types.ObjectId().toHexString();
      const authorId = new Types.ObjectId().toHexString();
      const oldStartDate = new Date('2024-01-01');
      const oldEndDate = new Date('2024-01-05');
      const newStartDate = new Date('2024-01-02');
      const newEndDate = new Date('2024-01-04');
      const plan = {
        _id: planId,
        author: authorId,
        startDate: oldStartDate,
        endDate: oldEndDate,
        schedule: [{ dayNumber: 1, date: oldStartDate, items: [] }],
      };
      const newSchedule = [{ dayNumber: 1, date: newStartDate, items: [] }];
      const updatedPlan = {
        _id: planId,
        author: authorId,
        startDate: newStartDate,
        endDate: newEndDate,
        schedule: newSchedule,
      };

      mockedTravelPlan.findById.mockResolvedValue(plan);
      mockedTravelPlan.findByIdAndUpdate.mockResolvedValue(updatedPlan);
      mockedGenerateSchedule.mockReturnValue(newSchedule);

      const result = await TravelPlanService.updateTravelPlanDates(
        planId,
        authorId,
        newStartDate,
        newEndDate,
      );

      expect(mockedTravelPlan.findById).toHaveBeenCalledWith(planId);
      expect(mockedGenerateSchedule).toHaveBeenCalledWith(newStartDate, newEndDate);
      expect(mockedTravelPlan.findByIdAndUpdate).toHaveBeenCalledWith(
        planId,
        {
          startDate: newStartDate,
          endDate: newEndDate,
          schedule: newSchedule,
        },
        { new: true }
      );
      expect(result.startDate).toBe(newStartDate);
      expect(result.endDate).toBe(newEndDate);
    });
  });
});

// --- getFeedForUser ---
describe('getFeedForUser', () => {
  const userId = new Types.ObjectId().toHexString();
  const followingId = new Types.ObjectId().toHexString();
  const trendingId = new Types.ObjectId().toHexString();
  const followedPlan = {
    _id: new Types.ObjectId(),
    author: { _id: followingId, username: 'followed', displayName: 'Followed User', avatarUrl: 'f.png' },
    privacy: 'public',
    createdAt: new Date('2024-01-01T10:00:00Z'),
  };
  const trendingPlan = {
    _id: new Types.ObjectId(),
    author: { _id: trendingId, username: 'trending', displayName: 'Trending User', avatarUrl: 't.png' },
    privacy: 'public',
    trendingScore: 100,
    createdAt: new Date('2024-01-01T09:00:00Z'),
  };

  function mockTravelPlanFindSequence(followedPlans: any[], trendingPlans: any[]) {
    // Mock the chain for followed plans
    const followedChain = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(followedPlans),
    };
    // Mock the chain for trending plans
    const trendingChain = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(trendingPlans),
    };
    mockedTravelPlan.find
      .mockImplementationOnce(() => followedChain)
      .mockImplementationOnce(() => trendingChain);
  }

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should interleave followed and trending plans and paginate', async () => {
    // User follows one user
    mockedFollow.find.mockReturnValue({ select: () => ({ lean: () => Promise.resolve([{ following: followingId }]) }) });
    mockTravelPlanFindSequence(
      [followedPlan, { ...followedPlan, _id: new Types.ObjectId(), createdAt: new Date('2024-01-01T08:00:00Z') }],
      [trendingPlan]
    );
    const result = await TravelPlanService.getFeedForUser(userId, { limit: 2 });
    // Should interleave: 1st followed, 2nd followed, then trending injected (but limit=2, so only first two)
    expect(result.data.length).toBe(2);
    expect(result.data[0].author.username).toBe('followed');
    expect(result.data[1].author.username).toBe('followed');
    expect(result.pagination.has_next_page).toBe(true);
    expect(result.pagination.next_cursor).toBeDefined();
  });

  it('should handle user following no one (only trending)', async () => {
    mockedFollow.find.mockReturnValue({ select: () => ({ lean: () => Promise.resolve([]) }) });
    mockTravelPlanFindSequence([], [trendingPlan]);
    const result = await TravelPlanService.getFeedForUser(userId, { limit: 1 });
    expect(result.data.length).toBe(0);
    expect(result.pagination.has_next_page).toBe(false);
  });

  it('should use the after cursor for pagination', async () => {
    mockedFollow.find.mockReturnValue({ select: () => ({ lean: () => Promise.resolve([{ following: followingId }]) }) });
    mockTravelPlanFindSequence([followedPlan], [trendingPlan]);
    const after = new Date('2024-01-01T11:00:00Z').toISOString();
    await TravelPlanService.getFeedForUser(userId, { limit: 1, after });
    // Check that the followed query was called with createdAt < after
    expect(mockedTravelPlan.find).toHaveBeenCalledWith({ author: { $in: [followingId] }, privacy: 'public', createdAt: { $lt: new Date(after) } });
  });
});