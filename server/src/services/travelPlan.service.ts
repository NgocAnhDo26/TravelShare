import { Types } from 'mongoose';
import { TravelPlan, ITravelPlan, ILocation } from '../models/travelPlan.model';

/**
 * @interface IUpdateTravelPlanPayload
 * @description Defines the structure of the data used to update a travel plan.
 */
interface IUpdateTravelPlanPayload {
  title?: string;
  destination?: ILocation;
  startDate?: string;
  endDate?: string;
}

/**
 * @interface ITravelPlanService
 * @description Outlines the methods available in the TravelPlanService.
 */
interface ITravelPlanService {
  updateTravelPlanDetails(
    planId: string,
    authorId: string,
    payload: IUpdateTravelPlanPayload,
  ): Promise<ITravelPlan>;
}

/**
 * @const TravelPlanService
 * @description Service object for handling travel plan-related business logic.
 */
const TravelPlanService: ITravelPlanService = {
  /**
   * Updates the core details of a travel plan after verifying ownership.
   * It now automatically adjusts dates to prevent invalid ranges.
   */
  async updateTravelPlanDetails(
    planId: string,
    authorId: string,
    payload: IUpdateTravelPlanPayload,
  ): Promise<ITravelPlan> {
    // 1. Find the travel plan by its ID
    const plan = await TravelPlan.findById(planId);

    if (!plan) {
      throw new Error('Travel plan not found.');
    }

    // 2. Verify that the user making the request is the author of the plan
    if (plan.author.toString() !== authorId) {
      throw new Error('You are not authorized to edit this travel plan.');
    }

    // 3. Prepare the fields to be updated
    const { title, destination, startDate, endDate } = payload;
    const updateFields: any = {};

    if (title) updateFields.title = title;
    if (destination) updateFields.destination = destination;

    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    // 4. Parse and validate date strings from payload
    if (startDate) {
        const [day, month, year] = startDate.split('/').map(Number);
        parsedStartDate = new Date(Date.UTC(2000 + year, month - 1, day));
        if (isNaN(parsedStartDate.getTime())) {
            throw new Error('Invalid start date format. Please use dd/mm/yy.');
        }
        updateFields.startDate = parsedStartDate;
    }
      
    if (endDate) {
        const [day, month, year] = endDate.split('/').map(Number);
        parsedEndDate = new Date(Date.UTC(2000 + year, month - 1, day));
        if (isNaN(parsedEndDate.getTime())) {
            throw new Error('Invalid end date format. Please use dd/mm/yy.');
        }
        updateFields.endDate = parsedEndDate;
    }

    // 5. Determine the final dates for comparison and adjustment
    const finalStartDate = parsedStartDate || plan.startDate;
    const finalEndDate = parsedEndDate || plan.endDate;

    // 6. Adjust dates if the range becomes invalid
    if (finalStartDate && finalEndDate && finalStartDate > finalEndDate) {
      // If startDate was the field that caused the invalid range, adjust endDate.
      if (parsedStartDate) {
        updateFields.endDate = finalStartDate;
      } 
      // Otherwise, endDate must have been the field that caused it, so adjust startDate.
      else if (parsedEndDate) {
        updateFields.startDate = finalEndDate;
      }
    }
    
    // 7. Atomically find and update the document
    const updatedPlan = await TravelPlan.findByIdAndUpdate(
      planId,
      { $set: updateFields },
      { new: true, runValidators: true }, // `new: true` returns the modified document
    );

    if (!updatedPlan) {
      // This is an unlikely edge case if the plan was deleted between the find and update operations
      throw new Error('Travel plan not found.');
    }
    
    return updatedPlan;
  },
};

export { TravelPlanService };