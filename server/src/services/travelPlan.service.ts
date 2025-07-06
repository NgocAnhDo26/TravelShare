import { Types } from 'mongoose';
import TravelPlan, { ITravelPlan, ILocation } from '../models/travelPlan.model';
import { generateSchedule } from '../utils/travelPlan';

/**
 * @interface ITravelPlanService
 * @description Outlines the methods available in the TravelPlanService.
 */
interface ITravelPlanService {
  createTravelPlan(planData: any, authorId: string): Promise<any>;
  getTravelPlanById(planId: string): Promise<any | null>;
  getTravelPlansByAuthor(authorId: string): Promise<any[]>;
  getPublicTravelPlans(): Promise<any[]>;
  incrementLikes(planId: string): Promise<void>;
  decrementLikes(planId: string): Promise<void>;
  incrementComments(planId: string): Promise<void>;
  decrementComments(planId: string): Promise<void>;
  deleteTravelPlan(planId: string, authorId: string): Promise<boolean>;
  updateTravelPlanTitle(
    planId: string,
    authorId: string,
    title: string,
  ): Promise<ITravelPlan>;
  updateTravelPlanPrivacy(
    planId: string,
    authorId: string,
    privacy: 'public' | 'private',
  ): Promise<ITravelPlan>;
  updateTravelPlanCoverImage(
    planId: string,
    authorId: string,
    coverImageUrl: string,
  ): Promise<ITravelPlan>;
  updateTravelPlanDates(
    planId: string,
    authorId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ITravelPlan>;
}

interface CreateTravelPlanRequest {
  title: string;
  destination: ILocation;
  startDate: Date;
  endDate: Date;
}

/**
 * @const TravelPlanService
 * @description Service object for handling travel plan-related business logic.
 */
const TravelPlanService: ITravelPlanService = {
  /**
   * Create a new travel plan with automatic schedule generation
   * @param planData - Validated travel plan data
   * @param authorId - ID of the authenticated user creating the plan
   * @returns Promise<ITravelPlan> - The created travel plan
   */
  async createTravelPlan(
    planData: CreateTravelPlanRequest,
    authorId: string,
  ): Promise<any> {
    try {
      // Generate schedule array for each day from startDate to endDate
      const schedule = generateSchedule(planData.startDate, planData.endDate);

      // Create the travel plan object
      const travelPlanData = {
        title: planData.title,
        destination: planData.destination,
        author: new Types.ObjectId(authorId),
        startDate: planData.startDate,
        endDate: planData.endDate,
        schedule,
      };

      // Save to database
      const savedPlan = await TravelPlan.create(travelPlanData);

      // Return the created plan (population will be handled by the repository if needed)
      return savedPlan;
    } catch (error) {
      console.error('Error creating travel plan:', error);
      throw error;
    }
  },

  /**
   * Get a travel plan by ID with populated author
   * @param planId - ID of the travel plan
   * @returns Promise<ITravelPlan | null> - The travel plan or null if not found
   */
  async getTravelPlanById(planId: string): Promise<any | null> {
    try {
      return await TravelPlan.findById(planId);
    } catch (error) {
      console.error('Error getting travel plan by ID:', error);
      throw error;
    }
  },

  /**
   * Get travel plans by author ID
   * @param authorId - ID of the author
   * @returns Promise<ITravelPlan[]> - Array of travel plans
   */
  async getTravelPlansByAuthor(authorId: string): Promise<any[]> {
    try {
      return await TravelPlan.find({ author: authorId });
    } catch (error) {
      console.error('Error getting travel plans by author:', error);
      throw error;
    }
  },

  /**
   * Get public travel plans
   */
  async getPublicTravelPlans(): Promise<any[]> {
    try {
      return await TravelPlan.find({ privacy: 'public' });
    } catch (error) {
      console.error('Error getting public travel plans:', error);
      throw error;
    }
  },

  /**
   * Increment likes count
   */
  async incrementLikes(planId: string): Promise<void> {
    try {
      await TravelPlan.findByIdAndUpdate(planId, { $inc: { likesCount: 1 } });
    } catch (error) {
      console.error('Error incrementing likes:', error);
      throw error;
    }
  },

  /**
   * Decrement likes count
   */
  async decrementLikes(planId: string): Promise<void> {
    try {
      await TravelPlan.findByIdAndUpdate(planId, { $inc: { likesCount: -1 } });
    } catch (error) {
      console.error('Error decrementing likes:', error);
      throw error;
    }
  },

  /**
   * Increment comments count
   */
  async incrementComments(planId: string): Promise<void> {
    try {
      await TravelPlan.findByIdAndUpdate(planId, {
        $inc: { commentsCount: 1 },
      });
    } catch (error) {
      console.error('Error incrementing comments:', error);
      throw error;
    }
  },

  /**
   * Decrement comments count
   */
  async decrementComments(planId: string): Promise<void> {
    try {
      await TravelPlan.findByIdAndUpdate(planId, {
        $inc: { commentsCount: -1 },
      });
    } catch (error) {
      console.error('Error decrementing comments:', error);
      throw error;
    }
  },

  /**
   * Delete a travel plan by ID
   * @param planId - ID of the travel plan
   * @param authorId - ID of the author (for authorization)
   * @returns Promise<boolean> - True if deleted, false if not found or unauthorized
   */
  async deleteTravelPlan(planId: string, authorId: string): Promise<boolean> {
    try {
      // First check if the plan exists and belongs to the author
      const plan = await TravelPlan.findOne({
        _id: planId,
        author: authorId,
      });

      if (!plan) {
        return false;
      }

      // Delete the plan
      const deletedPlan = await TravelPlan.findByIdAndDelete(planId);
      return !!deletedPlan;
    } catch (error) {
      console.error('Error deleting travel plan:', error);
      throw error;
    }
  },

  /**
   * Updates the core details of a travel plan after verifying ownership.
   * It now automatically adjusts dates to prevent invalid ranges.
   */
  async updateTravelPlanTitle(
    planId: string,
    authorId: string,
    title: string,
  ): Promise<ITravelPlan> {
    const plan = await TravelPlan.findById(planId);
    if (!plan) {
      throw new Error('Travel plan not found.');
    }
    if (plan.author.toString() !== authorId) {
      throw new Error('You are not authorized to edit this travel plan.');
    }

    plan.title = title;
    await plan.save();
    return plan;
  },

  async updateTravelPlanPrivacy(
    planId: string,
    authorId: string,
    privacy: 'public' | 'private',
  ): Promise<ITravelPlan> {
    const plan = await TravelPlan.findById(planId);
    if (!plan) {
      throw new Error('Travel plan not found.');
    }
    if (plan.author.toString() !== authorId) {
      throw new Error('You are not authorized to edit this travel plan.');
    }

    plan.privacy = privacy;
    await plan.save();
    return plan;
  },

  async updateTravelPlanCoverImage(
    planId: string,
    authorId: string,
    coverImageUrl: string,
  ): Promise<ITravelPlan> {
    const plan = await TravelPlan.findById(planId);
    if (!plan) {
      throw new Error('Travel plan not found.');
    }
    if (plan.author.toString() !== authorId) {
      throw new Error('You are not authorized to edit this travel plan.');
    }

    plan.coverImageUrl = coverImageUrl;
    await plan.save();
    return plan;
  },

  async updateTravelPlanDates(
    planId: string,
    authorId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ITravelPlan> {
    const plan = await TravelPlan.findById(planId);
    if (!plan) {
      throw new Error('Travel plan not found.');
    }
    if (plan.author.toString() !== authorId) {
      throw new Error('You are not authorized to edit this travel plan.');
    }

    if (startDate > endDate) {
      throw new Error('Start date cannot be after end date.');
    }

    // Ensure start and end dates from the plan exist before comparison
    if (!plan.startDate || !plan.endDate) {
      throw new Error('Existing travel plan is missing start or end dates.');
    }

    let newSchedule;

    // Condition: If the date range shrinks or shifts, old items would be lost.
    if (startDate > plan.startDate || endDate < plan.endDate) {
      // Warn: create new schedule based on new dates, remove all old items.
      // The frontend should warn the user before calling this API.
      newSchedule = generateSchedule(startDate, endDate);
    } else {
      // Condition: The date range is expanding or staying the same.
      // Update the old schedule to fit the new schedule by preserving existing items.
      const oldScheduleMap = new Map(
        plan.schedule.map((day) => [
          day.date.toISOString().split('T')[0],
          day.items,
        ]),
      );

      const fullSchedule = generateSchedule(startDate, endDate);

      newSchedule = fullSchedule.map((day) => {
        const existingItems = oldScheduleMap.get(
          day.date.toISOString().split('T')[0],
        );
        if (existingItems) {
          return { ...day, items: existingItems };
        }
        return day;
      });
    }

    const updatedPlan = await TravelPlan.findByIdAndUpdate(
      planId,
      {
        startDate,
        endDate,
        schedule: newSchedule,
      },
      { new: true },
    );

    if (!updatedPlan) {
      throw new Error('Failed to update travel plan dates.');
    }
    return updatedPlan;
  },
};

export { TravelPlanService };
