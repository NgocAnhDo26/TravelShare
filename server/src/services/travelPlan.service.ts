import mongoose, { Types } from 'mongoose';
import TravelPlan, {
  ITravelPlan,
  IPlanItem,
  ITomTomLocationBase,
} from '../models/travelPlan.model';
import { generateSchedule } from '../utils/travelPlan';
import supabase from '../config/supabase.config';
import Follow from '../models/follow.model';

/**
 * @interface ITravelPlanService
 * @description Outlines the methods available in the TravelPlanService.
 */
interface ITravelPlanService {
  addPlanItem(
    planId: string,
    dayNumber: number,
    itemData: Partial<IPlanItem>,
    authorId: string,
  ): Promise<IPlanItem>;
  getPlanItem(
    planId: string,
    itemId: string,
    authorId: string,
  ): Promise<IPlanItem | null>;
  updatePlanItem(
    planId: string,
    itemId: string,
    updateData: Partial<IPlanItem>,
    authorId: string,
  ): Promise<IPlanItem | null>;
  deletePlanItem(
    planId: string,
    itemId: string,
    authorId: string,
  ): Promise<boolean>;

  createTravelPlan(
    planData: CreateTravelPlanRequest,
    authorId: string,
  ): Promise<any>;
  getTravelPlanById(planId: string): Promise<any | null>;
  getTravelPlansByAuthor(authorId: string): Promise<any[]>;
  getPublicTravelPlansByAuthor(authorId: string): Promise<any[]>;
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
  deleteImageFromSupabase(imageUrl: string): Promise<void>;

  getFeedForUser(
    userId: string,
    options: { limit: number; after?: string },
  ): Promise<{
    data: any[];
    pagination: { next_cursor: string | null; has_next_page: boolean };
  }>;

  reorderItemsInDay(
    planId: string,
    dayNumber: number,
    items: { _id: string; order: number }[],
    authorId: string,
  ): Promise<boolean>;

  moveItemToAnotherDay(
    planId: string,
    sourceDayNumber: number,
    targetDayNumber: number,
    itemId: string,
    targetIndex: number,
    authorId: string,
  ): Promise<boolean>;

  remixTravelPlan(
    targetPlanId: string,
    remixData: IRemixTravelPlanRequest,
    authorId: string,
  ): Promise<ITravelPlan | null>;
}

interface CreateTravelPlanRequest {
  title: string;
  destination: ITomTomLocationBase;
  startDate: Date;
  endDate: Date;
  privacy?: 'public' | 'private';
}

/**
 * @interface IRemixTravelPlanRequest
 * @description Defines the data required to remix a travel plan.
 */
interface IRemixTravelPlanRequest {
  title: string;
  startDate: Date;
  endDate: Date;
  privacy: 'public' | 'private';
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

      // Create the travel plan object with complete TomTom destination data
      const travelPlanData = {
        title: planData.title,
        destination: planData.destination, // Use complete TomTom location data
        author: new Types.ObjectId(authorId),
        startDate: planData.startDate,
        endDate: planData.endDate,
        privacy: planData.privacy || 'private',
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
  async getPublicTravelPlansByAuthor(authorId: string): Promise<any[]> {
    try {
      return await TravelPlan.find({ author: authorId, privacy: 'public' });
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

    // Store old cover image URL for cleanup
    const oldCoverImageUrl = plan.coverImageUrl;

    plan.coverImageUrl = coverImageUrl;
    await plan.save();

    // Delete old cover image from Supabase storage if it exists
    if (oldCoverImageUrl) {
      try {
        await this.deleteImageFromSupabase(oldCoverImageUrl);
      } catch (error) {
        console.error('Failed to delete old cover image:', error);
        // Don't throw here - the update was successful, cleanup is secondary
      }
    }

    return plan;
  },

  /**
   * Delete image from Supabase storage
   * @param imageUrl - The full URL of the image to delete
   */
  async deleteImageFromSupabase(imageUrl: string): Promise<void> {
    try {
      // Extract bucket name and filename from URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[filename]
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      // Find the index of 'public' and get the next part as bucket name
      const publicIdx = pathParts.findIndex((part) => part === 'public');
      const bucketName = pathParts[publicIdx + 1];
      const filePath = pathParts.slice(publicIdx + 2).join('/');

      if (!bucketName || !filePath) {
        throw new Error('Invalid image URL format');
      }

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(`Failed to delete file: ${error.message}`);
      }

      console.log(
        'Successfully deleted old image:',
        filePath,
        'from bucket:',
        bucketName,
      );
    } catch (error) {
      console.error('Error deleting image from Supabase:', error);
      throw error;
    }
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

  /**
   * Adds an item to a specific day in the schedule.
   */
  async addPlanItem(
    planId: string,
    dayNumber: number,
    itemData: Partial<IPlanItem>,
    authorId: string,
  ): Promise<IPlanItem> {
    const plan = await TravelPlan.findOne({ _id: planId, author: authorId });
    if (!plan) throw new Error('Plan not found or user not authorized.');

    const daySchedule = plan.schedule.find((d) => d.dayNumber === dayNumber);
    if (!daySchedule) throw new Error('Day not found in schedule.');

    const lastItem = daySchedule.items[daySchedule.items.length - 1];
    const newOrder = lastItem ? lastItem.order + 1 : 1;

    const newItem = {
      ...itemData,
      _id: new mongoose.Types.ObjectId(),
      order: newOrder,
    } as IPlanItem;

    daySchedule.items.push(newItem);
    await plan.save();
    return newItem;
  },

  /**
   * Retrieves a specific plan item from a plan.
   */
  async getPlanItem(
    planId: string,
    itemId: string,
    authorId: string,
  ): Promise<IPlanItem | null> {
    const plan = await TravelPlan.findOne({ _id: planId, author: authorId });
    if (!plan) return null;

    for (const day of plan.schedule) {
      const item = day.items.find((it) => it._id.toString() === itemId);
      if (item) return item;
    }
    return null;
  },

  /**
   * Updates a specific plan item.
   */
  async updatePlanItem(
    planId: string,
    itemId: string,
    updateData: Partial<IPlanItem>,
    authorId: string,
  ): Promise<IPlanItem | null> {
    const plan = await TravelPlan.findOne({ _id: planId, author: authorId });
    if (!plan) throw new Error('Plan not found or user not authorized.');

    let itemToUpdate: IPlanItem | undefined;
    for (const day of plan.schedule) {
      itemToUpdate = day.items.find((it) => it._id.toString() === itemId);
      if (itemToUpdate) break;
    }

    if (!itemToUpdate) return null;

    Object.assign(itemToUpdate, updateData);
    await plan.save();
    return itemToUpdate;
  },

  /**
   * Deletes a specific plan item.
   */
  async deletePlanItem(
    planId: string,
    itemId: string,
    authorId: string,
  ): Promise<boolean> {
    const plan = await TravelPlan.findOne({ _id: planId, author: authorId });
    if (!plan) return false;

    let itemDeleted = false;
    for (const day of plan.schedule) {
      const itemIndex = day.items.findIndex(
        (it) => it._id.toString() === itemId,
      );
      if (itemIndex > -1) {
        day.items.splice(itemIndex, 1);
        itemDeleted = true;
        break;
      }
    }

    if (itemDeleted) {
      await plan.save();
    }
    return itemDeleted;
  },

  async getFeedForUser(
    userId: string,
    options: { limit: number; after?: string },
  ): Promise<{
    data: any[];
    pagination: { next_cursor: string | null; has_next_page: boolean };
  }> {
    try {
      const { limit = 20, after } = options;

      // --- Step 1: Get the list of users the user is following ---
      // This is more efficient than calling getFollowing, which populates a lot of data.
      const followingRelations = await Follow.find({ follower: userId })
        .select('following')
        .lean();
      const followingIds = followingRelations.map(
        (relation) => relation.following,
      );

      // --- Step 2: Fetch a page of posts from FOLLOWED users ---
      const followedQuery: any = {
        author: { $in: followingIds },
        privacy: 'public',
      };
      if (after) {
        // Use the cursor to fetch items created before the last item of the previous page
        followedQuery.createdAt = { $lt: new Date(after) };
      }
      const followedPlans = await TravelPlan.find(followedQuery)
        .populate('author', 'username displayName avatarUrl')
        .sort({ createdAt: -1 })
        .limit(limit) // Apply the limit to the database query
        .lean()
        .exec();

      // --- Step 3: Fetch a small, fixed number of TRENDING posts ---
      // This is now incredibly fast because we sort by the pre-calculated, indexed score.
      const trendingPlans = await TravelPlan.find({
        privacy: 'public',
        author: { $nin: [...followingIds, userId] },
      })
        .populate('author', 'username displayName avatarUrl')
        // THIS IS THE ONLY CHANGE NEEDED:
        .sort({ trendingScore: -1 }) // Use the indexed score
        .limit(5)
        .lean()
        .exec();

      // --- Step 4: Interleave the two lists for a better user experience ---
      const feedPlans = [];
      let followedIndex = 0;
      const injectionRate = 4; // Inject one trending post every 4 followed posts

      while (followedIndex < followedPlans.length) {
        // Add a chunk of followed plans
        const followedChunk = followedPlans.slice(
          followedIndex,
          followedIndex + injectionRate,
        );
        feedPlans.push(...followedChunk);
        followedIndex += injectionRate;

        // Inject one trending plan if available
        if (trendingPlans.length > 0) {
          feedPlans.push(trendingPlans.shift()); // Take the first trending post and remove it
        }
      }

      // --- Step 5: Prepare the response with the next cursor ---
      // This part remains the same and will correctly handle the case where
      // there are no followed plans, resulting in no "next page".
      let next_cursor = null;
      if (followedPlans.length === limit) {
        next_cursor =
          followedPlans[followedPlans.length - 1].createdAt!.toISOString();
      }

      return {
        data: feedPlans.slice(0, limit), // Ensure we don't exceed the limit after merging
        pagination: {
          next_cursor,
          has_next_page: next_cursor !== null,
        },
      };
    } catch (error) {
      console.error('Error getting feed for user:', error);
      throw error;
    }
  },
  /**
   * Reorders items within a specific day in the schedule.
   * @param planId - The travel plan ID
   * @param dayNumber - The day number to reorder
   * @param items - Array of {_id, order} objects representing new order
   * @param authorId - The user's ID (for authorization)
   * @returns Promise<boolean> - true if successful
   */
  async reorderItemsInDay(
    planId: string,
    dayNumber: number,
    items: { _id: string; order: number }[],
    authorId: string,
  ): Promise<boolean> {
    try {
      const plan = await TravelPlan.findOne({ _id: planId, author: authorId });
      if (!plan) throw new Error('Plan not found or user not authorized.');

      const day = plan.schedule.find((d) => d.dayNumber === dayNumber);
      if (!day) throw new Error('Day not found in schedule.');

      // Create a map for quick lookup of new order by item _id
      const orderMap = new Map(
        items.map((item) => [item._id.toString(), item.order]),
      );

      // Update the order field for each item in the day
      day.items.forEach((item) => {
        if (orderMap.has(item._id.toString())) {
          item.order = orderMap.get(item._id.toString())!;
        }
      });

      // Sort the items array by the new order
      day.items.sort((a, b) => a.order - b.order);

      await plan.save();
      return true;
    } catch (error) {
      console.error('Error in reorderItemsInDay:', error);
      throw error;
    }
  },

  /**
   * Moves an item from one day to another within a travel plan.
   * @param planId - The travel plan ID
   * @param sourceDayNumber - The day number to move from
   * @param targetDayNumber - The day number to move to
   * @param itemId - The _id of the item to move
   * @param targetIndex - The index in the target day's items array to insert at
   * @param authorId - The user's ID (for authorization)
   * @returns Promise<boolean> - true if successful
   */
  async moveItemToAnotherDay(
    planId: string,
    sourceDayNumber: number,
    targetDayNumber: number,
    itemId: string,
    targetIndex: number,
    authorId: string,
  ): Promise<boolean> {
    try {
      const plan = await TravelPlan.findOne({ _id: planId, author: authorId });
      if (!plan) throw new Error('Plan not found or user not authorized.');

      const sourceDay = plan.schedule.find(
        (d) => d.dayNumber === sourceDayNumber,
      );
      const targetDay = plan.schedule.find(
        (d) => d.dayNumber === targetDayNumber,
      );

      if (!sourceDay || !targetDay)
        throw new Error('Source or target day not found.');

      // Find and remove the item from the source day
      const itemIdx = sourceDay.items.findIndex(
        (it) => it._id.toString() === itemId,
      );
      if (itemIdx === -1) throw new Error('Item not found in source day.');

      const [movingItem] = sourceDay.items.splice(itemIdx, 1);

      // Update the item's dayNumber and order
      (movingItem as any).dayNumber = targetDayNumber;

      // Insert into target day's items at the specified index
      targetDay.items.splice(targetIndex, 0, movingItem);

      // Reorder items in both days
      sourceDay.items.forEach((item, idx) => {
        item.order = idx;
      });
      targetDay.items.forEach((item, idx) => {
        item.order = idx;
      });

      await plan.save();
      return true;
    } catch (error) {
      console.error('Error in moveItemToAnotherDay:', error);
      throw error;
    }
  },

  /**
   * Creates a new travel plan by remixing an existing public plan.
   * The new plan copies the destination and daily itinerary but uses new dates,
   * title, and privacy settings provided by the user.
   * @param targetPlanId - The ID of the public plan to be remixed.
   * @param remixData - The new data for the remixed plan.
   * @param authorId - The ID of the user creating the remix.
   * @returns The newly created ITravelPlan document or null if the original is not found or private.
   */
  async remixTravelPlan(
    targetPlanId: string,
    remixData: IRemixTravelPlanRequest,
    authorId: string,
  ): Promise<ITravelPlan | null> {
    try {
      // 1. Find the original plan and ensure it's public and exists.
      // Using .lean() for a fast, read-only query.
      const originalPlan = await TravelPlan.findById(targetPlanId).lean();

      if (!originalPlan) {
        throw new Error('Original travel plan not found.');
      }

      if (originalPlan.privacy !== 'public') {
        throw new Error('Only public travel plans can be remixed.');
      }
      
      if (new Date(remixData.startDate) > new Date(remixData.endDate)) {
        throw new Error('Start date cannot be after end date.');
      }

      // 2. Create a map of the original plan's itinerary for easy lookup.
      // Maps dayNumber to its array of items.
      const originalScheduleMap = new Map(
        originalPlan.schedule.map((day) => [day.dayNumber, day.items]),
      );

      // 3. Generate a new schedule structure based on the new dates.
      const newScheduleBase = generateSchedule(
        new Date(remixData.startDate),
        new Date(remixData.endDate),
      );

      // 4. Populate the new schedule with items from the original plan.
      // This intelligently handles shorter or longer trip durations.
      const newSchedule = newScheduleBase.map((day) => {
        // Find items from the corresponding day number in the original plan.
        const itemsToCopy = originalScheduleMap.get(day.dayNumber) || [];
        
        // Return a new day object with the copied items. Mongoose will generate new _ids for these items.
        return {
          ...day,
          items: itemsToCopy,
        };
      });

      // 5. Create the new travel plan document.
      const newPlanData = {
        title: remixData.title,
        destination: originalPlan.destination, // Copy destination from original
        author: new Types.ObjectId(authorId),
        startDate: new Date(remixData.startDate),
        endDate: new Date(remixData.endDate),
        privacy: remixData.privacy,
        schedule: newSchedule,
        originalPlan: originalPlan._id, // Link back to the original plan
        coverImageUrl: originalPlan.coverImageUrl, // Copy cover image as well
      };

      const remixedPlan = await TravelPlan.create(newPlanData);

      // 6. Increment the remix count on the original plan (fire-and-forget).
      await TravelPlan.findByIdAndUpdate(targetPlanId, {
        $inc: { remixCount: 1 },
      });

      return remixedPlan;
    } catch (error) {
      console.error('Error remixing travel plan:', error);
      throw error;
    }
  },
};

export { TravelPlanService };
