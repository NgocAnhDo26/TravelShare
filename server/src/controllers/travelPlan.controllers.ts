import { Request, Response, NextFunction } from 'express';
import { TravelPlanService } from '../services/travelPlan.service';
import { ITravelPlan } from '../models/travelPlan.model'; // Assuming interfaces are in the model file
import { HTTP_STATUS } from '../constants/http';

/**
 * @interface ITravelPlanController
 * @description Outlines the methods for the TravelPlanController.
 */
interface ITravelPlanController {
  addPlanItem(req: Request, res: Response, next: NextFunction): Promise<void>;
  getPlanItem(req: Request, res: Response, next: NextFunction): Promise<void>;
  updatePlanItem(req: Request, res: Response, next: NextFunction): Promise<void>;
  deletePlanItem(req: Request, res: Response, next: NextFunction): Promise<void>;
  createTravelPlan(req: Request, res: Response): Promise<void>;
  getTravelPlanById(req: Request, res: Response): Promise<void>;
  getTravelPlansByAuthor(req: Request, res: Response): Promise<void>;
  getPublicTravelPlans(req: Request, res: Response): Promise<void>;
  deleteTravelPlan(req: Request, res: Response): Promise<void>;
  updateTravelPlanTitle(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  updateTravelPlanPrivacy(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  updateTravelPlanCoverImage(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  updateTravelPlanDates(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
}

/**
 * @const TravelPlanController
 * @description Controller for handling travel plan-related API requests.
 */
const TravelPlanController: ITravelPlanController = {
  /**
   * Create a new travel plan
   * POST /api/plans
   * @param req - Express request object
   * @param res - Express response object
   */
  async createTravelPlan(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user as string;

      if (!authorId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: 'You are not authorized to perform this action.',
        });
        return;
      }

      const travelPlan = await TravelPlanService.createTravelPlan(
        {
          ...req.body,
          startDate: new Date(req.body.startDate),
          endDate: new Date(req.body.endDate),
        },
        authorId,
      );

      res.status(HTTP_STATUS.CREATED).json(travelPlan);
    } catch (error) {
      console.error('Error in createTravelPlan controller:', error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'ValidationError') {
          res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: 'Please check your input and try again.',
            message: error.message,
          });
          return;
        }

        if (error.name === 'CastError') {
          res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: 'Invalid ID format',
            message: error.message,
          });
          return;
        }
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'An unexpected error occurred while creating the travel plan.',
      });
    }
  },

  /**
   * Get a travel plan by ID
   * GET /api/plans/:id
   * @param req - Express request object
   * @param res - Express response object
   */
  async getTravelPlanById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const travelPlan = await TravelPlanService.getTravelPlanById(id);

      if (!travelPlan) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'Travel plan not found',
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json(travelPlan);
    } catch (error) {
      console.error('Error in getTravelPlanById controller:', error);

      if (error instanceof Error && error.name === 'CastError') {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Invalid travel plan ID format',
        });
        return;
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'An unexpected error occurred while retrieving the travel plan.',
      });
    }
  },

  /**
   * Get travel plans by author
   * GET /api/plans/author/:authorId
   * @param req - Express request object
   * @param res - Express response object
   */
  async getTravelPlansByAuthor(req: Request, res: Response): Promise<void> {
    try {
      const { authorId } = req.params;
      const travelPlans =
        await TravelPlanService.getTravelPlansByAuthor(authorId);

      res.status(HTTP_STATUS.OK).json(travelPlans);
    } catch (error) {
      console.error('Error in getTravelPlansByAuthor controller:', error);

      if (error instanceof Error && error.name === 'CastError') {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Invalid author ID format',
        });
        return;
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error:
          'An unexpected error occurred while retrieving travel plans by author.',
      });
    }
  },

  /**
   * Get public travel plans
   */
  async getPublicTravelPlans(req: Request, res: Response): Promise<void> {
    try {
      const travelPlans = await TravelPlanService.getPublicTravelPlans();
      res.status(HTTP_STATUS.OK).json(travelPlans);
    } catch (error) {
      console.error('Error in getPublicTravelPlans controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error:
          'An unexpected error occurred while retrieving public travel plans.',
      });
    }
  },

  /**
   * Delete a travel plan
   * DELETE /api/plans/:id
   * @param req - Express request object
   * @param res - Express response object
   */
  async deleteTravelPlan(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const authorId = req.user as string;

      if (!authorId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: 'You are not authorized to perform this action.',
        });
        return;
      }

      const deleted = await TravelPlanService.deleteTravelPlan(id, authorId);

      if (!deleted) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'Travel plan not found or you are not authorized to delete it',
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        message: 'Travel plan deleted successfully',
      });
    } catch (error) {
      console.error('Error in deleteTravelPlan controller:', error);

      if (error instanceof Error && error.name === 'CastError') {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Invalid travel plan ID format',
        });
        return;
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'An unexpected error occurred while deleting the travel plan.',
      });
    }
  },
  /**
   * @description Updates the general details of a specific travel plan.
   * Requires authentication to ensure the user is the author.
   * @route PUT /api/plans/:id
   */
  async updateTravelPlanTitle(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user as string;
      const planId = req.params.id;
      const { title } = req.body;

      if (!title) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ message: 'Title is required.' });
        return;
      }

      const updatedPlan = await TravelPlanService.updateTravelPlanTitle(
        planId,
        userId,
        title,
      );
      res.status(HTTP_STATUS.OK).json(updatedPlan);
    } catch (error: any) {
      next(error);
    }
  },

  async updateTravelPlanPrivacy(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user as string;
      const planId = req.params.id;
      const { privacy } = req.body;

      if (!privacy || !['public', 'private'].includes(privacy)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'A valid privacy setting (public/private) is required.',
        });
        return;
      }

      const updatedPlan = await TravelPlanService.updateTravelPlanPrivacy(
        planId,
        userId,
        privacy,
      );
      res.status(HTTP_STATUS.OK).json(updatedPlan);
    } catch (error: any) {
      next(error);
    }
  },

  async updateTravelPlanCoverImage(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user as string;
      const planId = req.params.id;
      
      // Check if file was uploaded
      if (!req.file) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ message: 'Cover image file is required.' });
        return;
      }

      // Get the file URL from req.file (location for S3, path for local)
      const coverImageUrl = (req.file as any).location || req.file.path;
      
      if (!coverImageUrl) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ message: 'File upload failed.' });
        return;
      }

      const updatedPlan = await TravelPlanService.updateTravelPlanCoverImage(
        planId,
        userId,
        coverImageUrl,
      );
      res.status(HTTP_STATUS.OK).json(updatedPlan);
    } catch (error: any) {
      next(error);
    }
  },

  /**
   * Update travel plan schedule
   * PUT /api/plans/:id/schedule
   * @param req - Express request object
   * @param res - Express response object
   */
  async updateTravelPlanDates(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user as string;
      const planId = req.params.id;
      const { startDate, endDate } = req.body;

      if (!startDate || !endDate) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ message: 'Both startDate and endDate are required.' });
        return;
      }

      const updatedPlan = await TravelPlanService.updateTravelPlanDates(
        planId,
        userId,
        new Date(startDate),
        new Date(endDate),
      );
      res.status(HTTP_STATUS.OK).json(updatedPlan);
    } catch (error: any) {
      next(error);
    }
  },

  async addPlanItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, dayNumber } = req.params;
      const authorId = req.user as string;
      const newItem = await TravelPlanService.addPlanItem(id, parseInt(dayNumber, 10), req.body, authorId);
      res.status(HTTP_STATUS.CREATED).json({ message: 'Item added successfully!', data: newItem });
    } catch (error) {
      next(error);
    }
  },

  async getPlanItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, itemId } = req.params;
      const authorId = req.user as string;
      const item = await TravelPlanService.getPlanItem(id, itemId, authorId);
      if (!item) {
        res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Item not found in this plan.' });
        return;
      }
      res.status(HTTP_STATUS.OK).json(item);
    } catch (error) {
      next(error);
    }
  },

  async updatePlanItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, itemId } = req.params;
      const authorId = req.user as string;
      const updatedItem = await TravelPlanService.updatePlanItem(id, itemId, req.body, authorId);
       if (!updatedItem) {
        res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Item not found or not authorized.' });
        return;
      }
      res.status(HTTP_STATUS.OK).json({ message: 'Item updated successfully!', data: updatedItem });
    } catch (error) {
      next(error);
    }
  },

  async deletePlanItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, itemId } = req.params;
      const authorId = req.user as string;
      const deleted = await TravelPlanService.deletePlanItem(id, itemId, authorId);
      if (!deleted) {
        res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Item not found or not authorized.' });
        return;
      }
      res.status(HTTP_STATUS.OK).json({ message: 'Item deleted successfully!' });
    } catch (error) {
      next(error);
    }
  },
};

export { TravelPlanController };
