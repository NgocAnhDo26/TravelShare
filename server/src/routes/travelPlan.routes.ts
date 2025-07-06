import { Router } from 'express';
import { TravelPlanController } from '../controllers/travelPlan.controllers';
import AuthJwtMiddleware from '../middlewares/authJwt';

const router = Router();

/**
 * POST /api/plans
 * Create a new travel plan
 * Requires: Authentication
 */
router.post(
  '/',
  AuthJwtMiddleware.verifyToken,
  TravelPlanController.createTravelPlan,
);

/**
 * GET /api/plans/public
 * Get public travel plans
 * Requires: Authentication
 */
router.get(
  '/public',
  TravelPlanController.getPublicTravelPlans,
);

/**
 * GET /api/plans/:id
 * Get a travel plan by ID
 * Requires: Authentication
 */
router.get(
  '/:id',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthorOrPublic,
  TravelPlanController.getTravelPlanById,
);

/**
 * GET /api/plans/author/:authorId
 * Get travel plans by author
 * Requires: Authentication
 */
router.get(
  '/author/:authorId',
  AuthJwtMiddleware.verifyToken,
  TravelPlanController.getTravelPlansByAuthor,
);

/**
 * DELETE /api/plans/:id
 * Delete a travel plan
 * Requires: Authentication, Authorization (must be the author)
 */
router.delete(
  '/:id',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  TravelPlanController.deleteTravelPlan,
);

/**
 * @route   PUT /:id/title
 * @desc    Updates the title of a travel plan.
 * @access  Private (Requires Authentication & Authorization)
 */
router.put(
  '/:id/title',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  TravelPlanController.updateTravelPlanTitle,
);

/**
 * @route   PUT /:id/privacy
 * @desc    Updates the privacy setting of a travel plan.
 * @access  Private (Requires Authentication & Authorization)
 */
router.put(
  '/:id/privacy',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  TravelPlanController.updateTravelPlanPrivacy,
);

/**
 * @route   PUT /:id/cover-image
 * @desc    Updates the cover image of a travel plan.
 * @access  Private (Requires Authentication & Authorization)
 */
router.put(
  '/:id/cover-image',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  TravelPlanController.updateTravelPlanCoverImage,
);

/**
 * @route   PUT /:id/dates
 * @desc    Updates the start and end dates of a travel plan.
 * @access  Private (Requires Authentication & Authorization)
 */
router.put(
  '/:id/dates',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  TravelPlanController.updateTravelPlanDates,
);

export default router;
