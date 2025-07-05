import { TravelPlanService } from '../../src/services/travelPlan.service';
import TravelPlan from '../../src/models/travelPlan.model';
import { generateSchedule } from '../../src/utils/travelPlan';
import { Types } from 'mongoose';

// Mock the Mongoose model and utility functions
jest.mock('../../src/models/travelPlan.model');
jest.mock('../../src/utils/travelPlan');

const mockedTravelPlan = TravelPlan as jest.Mocked<typeof TravelPlan>;
const mockedGenerateSchedule = generateSchedule as jest.Mock;

describe('TravelPlanService', () => {
  afterEach(() => {
    jest.clearAllMocks();
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
      const schedule = [{ dayNumber: 1, date: new Date('2024-01-01'), items: [] }];
      const newPlan = { ...planData, author: authorId, schedule };

      mockedGenerateSchedule.mockReturnValue(schedule);
      (mockedTravelPlan.create as jest.Mock).mockResolvedValue(newPlan);

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
      (mockedTravelPlan.findById as jest.Mock).mockResolvedValue(plan);

      const result = await TravelPlanService.getTravelPlanById(planId);

      expect(mockedTravelPlan.findById).toHaveBeenCalledWith(planId);
      expect(result).toEqual(plan);
    });
  });

  describe('getTravelPlansByAuthor', () => {
    it('should return all travel plans for a given author', async () => {
      const authorId = new Types.ObjectId().toHexString();
      const plans = [{ title: 'Plan 1' }, { title: 'Plan 2' }];
      (mockedTravelPlan.find as jest.Mock).mockResolvedValue(plans);

      const result = await TravelPlanService.getTravelPlansByAuthor(authorId);

      expect(mockedTravelPlan.find).toHaveBeenCalledWith({ author: authorId });
      expect(result).toEqual(plans);
    });
  });

  describe('getPublicTravelPlans', () => {
    it('should return all public travel plans', async () => {
      const publicPlans = [{ title: 'Public Plan', privacy: 'public' }];
      (mockedTravelPlan.find as jest.Mock).mockResolvedValue(publicPlans);

      const result = await TravelPlanService.getPublicTravelPlans();

      expect(mockedTravelPlan.find).toHaveBeenCalledWith({ privacy: 'public' });
      expect(result).toEqual(publicPlans);
    });
  });

  describe('deleteTravelPlan', () => {
    it('should delete a travel plan if the user is the author', async () => {
      const planId = new Types.ObjectId().toHexString();
      const authorId = new Types.ObjectId().toHexString();
      (mockedTravelPlan.findOne as jest.Mock).mockResolvedValue({ _id: planId, author: authorId });
      (mockedTravelPlan.findByIdAndDelete as jest.Mock).mockResolvedValue(true);

      const result = await TravelPlanService.deleteTravelPlan(planId, authorId);

      expect(mockedTravelPlan.findOne).toHaveBeenCalledWith({ _id: planId, author: authorId });
      expect(mockedTravelPlan.findByIdAndDelete).toHaveBeenCalledWith(planId);
      expect(result).toBe(true);
    });

    it('should not delete a travel plan if the user is not the author', async () => {
      const planId = new Types.ObjectId().toHexString();
      const authorId = new Types.ObjectId().toHexString();
      (mockedTravelPlan.findOne as jest.Mock).mockResolvedValue(null);

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
        save: jest.fn().mockResolvedValue({ title: newTitle }),
      };
      (mockedTravelPlan.findById as jest.Mock).mockResolvedValue(plan);

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
        save: jest.fn().mockResolvedValue({ privacy: newPrivacy }),
      };
      (mockedTravelPlan.findById as jest.Mock).mockResolvedValue(plan);

      const result = await TravelPlanService.updateTravelPlanPrivacy(planId, authorId, newPrivacy);

      expect(mockedTravelPlan.findById).toHaveBeenCalledWith(planId);
      expect(plan.save).toHaveBeenCalled();
      expect(result.privacy).toBe(newPrivacy);
    });
  });

  describe('updateTravelPlanCoverImage', () => {
    it('should update the cover image URL of a travel plan', async () => {
      const planId = new Types.ObjectId().toHexString();
      const authorId = new Types.ObjectId().toHexString();
      const newCoverUrl = 'http://example.com/new-cover.jpg';
      const plan = {
        _id: planId,
        author: authorId,
        coverImageUrl: 'http://example.com/old-cover.jpg',
        save: jest.fn().mockResolvedValue({ coverImageUrl: newCoverUrl }),
      };
      (mockedTravelPlan.findById as jest.Mock).mockResolvedValue(plan);

      const result = await TravelPlanService.updateTravelPlanCoverImage(planId, authorId, newCoverUrl);

      expect(mockedTravelPlan.findById).toHaveBeenCalledWith(planId);
      expect(plan.save).toHaveBeenCalled();
      expect(result.coverImageUrl).toBe(newCoverUrl);
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
        schedule: [],
      };
      const newSchedule = [{ day: 1 }];

      (mockedTravelPlan.findById as jest.Mock).mockResolvedValue(plan);
      mockedGenerateSchedule.mockReturnValue(newSchedule);
      (mockedTravelPlan.findByIdAndUpdate as jest.Mock).mockResolvedValue({ schedule: newSchedule });

      await TravelPlanService.updateTravelPlanDates(planId, authorId, newStartDate, newEndDate);

      expect(mockedGenerateSchedule).toHaveBeenCalledWith(newStartDate, newEndDate);
      expect(mockedTravelPlan.findByIdAndUpdate).toHaveBeenCalledWith(
        planId,
        { startDate: newStartDate, endDate: newEndDate, schedule: newSchedule },
        { new: true }
      );
    });
  });
});