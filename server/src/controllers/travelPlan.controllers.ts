import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { TravelPlanService } from '../services/travelPlan.service';
import { ILocation } from '../models/travelPlan.model'; // Assuming interfaces are in the model file

/**
 * @interface IUpdateTravelPlanPayload
 * @description Defines the expected shape of the request body for updating a travel plan.
 */
interface IUpdateTravelPlanPayload {
  title?: string;
  destination?: ILocation;
  startDate?: string;
  endDate?: string;
}

/**
 * @interface ITravelPlanController
 * @description Outlines the methods for the TravelPlanController.
 */
interface ITravelPlanController {
  updateTravelPlan(req: Request, res: Response, next: NextFunction): Promise<void>;
}

/**
 * @const TravelPlanController
 * @description Controller for handling travel plan-related API requests.
 */
const TravelPlanController: ITravelPlanController = {
  /**
   * @description Updates the general details of a specific travel plan.
   * Requires authentication to ensure the user is the author.
   * @route PUT /api/plans/:id
   */
  async updateTravelPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user as string; // Assuming JWT middleware attaches user ID to req.user
      const planId = req.params.id;
      const payload: IUpdateTravelPlanPayload = req.body;

      // 1. Authentication Check
      if (!userId) {
        res.status(401).json({ message: 'Authentication required. Please log in.' });
        return;
      }

      // 2. Validate Plan ID
      if (!Types.ObjectId.isValid(planId)) {
        res.status(400).json({ message: 'The provided travel plan ID has an invalid format.' });
        return;
      }

      // 3. Validate Payload
      const { title, destination, startDate, endDate } = payload;
      if (!title && !destination && !startDate && !endDate) {
        res.status(400).json({ message: 'The request body must contain at least one field to update: title, destination, startDate, or endDate.' });
        return;
      }

      // 4. Call Service for business logic
      const updatedPlan = await TravelPlanService.updateTravelPlanDetails(planId, userId, payload);
      
      // 5. Send Success Response
      res.status(200).json({
        message: 'Travel plan updated successfully.',
        data: updatedPlan,
      });

    } catch (error: any) {
      // 6. Handle specific errors from the service
      if (error.message.includes('not found')) {
        res.status(404).json({ message: error.message });
      } else if (error.message.includes('not authorized')) {
        res.status(403).json({ message: error.message });
      } else if (error.message.includes('Invalid date') || error.message.includes('must be before')) {
        res.status(400).json({ message: error.message });
      } else {
        // Pass other errors to the global error handler
        next(error);
      }
    }
  },
};

export { TravelPlanController };