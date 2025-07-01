import { Router } from 'express';
import { TravelPlanController } from '../controllers/travelPlan.controllers';
import AuthJwtMiddleware from '../middlewares/authJwt'; // Ensure this path is correct

const router = Router();

/**
 * @route   PUT /:id
 * @desc    Updates the general details (title, destination, dates) of a travel plan.
 * The base path (e.g., /api/plans) would be configured in your main server file.
 * @access  Private (Requires a valid JWT)
 */
router.put(
  '/:id',
  AuthJwtMiddleware.verifyToken,        
  TravelPlanController.updateTravelPlan 
);


export default router;