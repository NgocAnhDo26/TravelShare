import { Router, Request, Response } from 'express';
import { TravelPlanController } from '../controllers/travelPlan.controllers';
import AuthJwtMiddleware from '../middlewares/authJwt';
import uploadUseCases from '../middlewares/upload';

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
 * POST /api/plans/:id/remix
 * Clone a travel plan
 * Requires: Authentication
 */
router.post(
  '/:id/remix',
  AuthJwtMiddleware.verifyToken,
  TravelPlanController.remixTravelPlan,
);

/**
 * GET /api/plans/public
 * Get public travel plans
 * Requires: Authentication
 */
router.get('/public', TravelPlanController.getPublicTravelPlans);

/**
 * GET /api/plans/search-for-tagging?q=...
 * Search travel plans for tagging in posts.
 * Includes: (1) all current user's plans (public/private) AND (2) public plans of others.
 */
router.get(
  '/search-for-tagging',
  AuthJwtMiddleware.verifyToken,
  TravelPlanController.searchPlansForTagging,
);

/**
 * GET /api/plans/feed
 * Get personalized travel plan feed for the logged-in user
 * Requires Authentication
 */
router.get(
  '/feed',
  AuthJwtMiddleware.verifyToken,
  TravelPlanController.getHomeFeed,
);

/**
 * GET /api/plans/:id
 * Get a travel plan by ID
 * Requires: Authentication
 */
router.get(
  '/:id',
  AuthJwtMiddleware.optionalAuth,
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
  AuthJwtMiddleware.optionalAuth,
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
 * @desc    Updates the cover image of a travel plan with file upload
 * @access  Private (Requires Authentication & Authorization)
 */
router.put(
  '/:id/cover-image',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  uploadUseCases.singleFileUpload('coverImage', 'travel-plan-covers'),
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

/**
 * @route   POST /api/plans/:planId/days/:dayNumber/items
 * @desc    Add a new item to a specific day in a travel plan
 * @access  Private (Requires Authorization - Author only)
 */
router.post(
  '/:id/days/:dayNumber/items',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  TravelPlanController.addPlanItem,
);

/**
 * @route   POST /api/plans/:id/items/reorder
 * @desc    Reorder items within a specific day in a travel plan
 * @access  Private (Requires Authorization - Author only)
 */
router.post(
  '/:id/items/reorder',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  TravelPlanController.reorderItemsInDay,
);

/**
 * @route   GET /api/plans/:planId/items/:itemId
 * @desc    Get a specific item from a travel plan
 * @access  Private (Author or Public Plan)
 */
router.get(
  '/:id/items/:itemId',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthorOrPublic,
  TravelPlanController.getPlanItem,
);

/**
 * @route   PUT /api/plans/:planId/items/:itemId
 * @desc    Update a specific item in a travel plan
 * @access  Private (Requires Authorization - Author only)
 */
router.put(
  '/:id/items/:itemId',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  TravelPlanController.updatePlanItem,
);

/**
 * @route   DELETE /api/plans/:planId/items/:itemId
 * @desc    Delete a specific item from a travel plan
 * @access  Private (Requires Authorization - Author only)
 */
router.delete(
  '/:id/items/:itemId',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  TravelPlanController.deletePlanItem,
);

/**
 * @route   POST /api/plans/:id/items/move
 * @desc    Move an item from one day to another within a travel plan
 * @access  Private (Requires Authorization - Author only)
 */
router.post(
  '/:id/items/move',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  TravelPlanController.moveItemToAnotherDay,
);

/**
 * @route   GET /api/plans/:id/related-posts
 * @desc    Get all posts related to a specific travel plan, including author info
 * @access  Public (no authentication required)
 */
router.get(
  '/:id/related-posts',
  TravelPlanController.getRelatedPostById,
);

/**
 * GET /api/plans/:id
 * Get a travel plan by ID
 * Requires: Authentication
 */
router.get(
  '/:id',
  AuthJwtMiddleware.optionalAuth,
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
  AuthJwtMiddleware.optionalAuth,
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
 * @desc    Updates the cover image of a travel plan with file upload
 * @access  Private (Requires Authentication & Authorization)
 */
router.put(
  '/:id/cover-image',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  uploadUseCases.singleFileUpload('coverImage', 'travel-plan-covers'),
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

/**
 * @route   POST /api/plans/:planId/days/:dayNumber/items
 * @desc    Add a new item to a specific day in a travel plan
 * @access  Private (Requires Authorization - Author only)
 */
router.post(
  '/:id/days/:dayNumber/items',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  TravelPlanController.addPlanItem,
);

/**
 * @route   POST /api/plans/:id/items/reorder
 * @desc    Reorder items within a specific day in a travel plan
 * @access  Private (Requires Authorization - Author only)
 */
router.post(
  '/:id/items/reorder',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  TravelPlanController.reorderItemsInDay,
);

/**
 * @route   GET /api/plans/:planId/items/:itemId
 * @desc    Get a specific item from a travel plan
 * @access  Private (Author or Public Plan)
 */
router.get(
  '/:id/items/:itemId',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthorOrPublic,
  TravelPlanController.getPlanItem,
);

/**
 * @route   PUT /api/plans/:planId/items/:itemId
 * @desc    Update a specific item in a travel plan
 * @access  Private (Requires Authorization - Author only)
 */
router.put(
  '/:id/items/:itemId',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  TravelPlanController.updatePlanItem,
);

/**
 * @route   DELETE /api/plans/:planId/items/:itemId
 * @desc    Delete a specific item from a travel plan
 * @access  Private (Requires Authorization - Author only)
 */
router.delete(
  '/:id/items/:itemId',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  TravelPlanController.deletePlanItem,
);

/**
 * @route   POST /api/plans/:id/items/move
 * @desc    Move an item from one day to another within a travel plan
 * @access  Private (Requires Authorization - Author only)
 */
router.post(
  '/:id/items/move',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  TravelPlanController.moveItemToAnotherDay,
);

/**
 * @route   GET /api/plans/:id/related-posts
 * @desc    Get all posts related to a specific travel plan, including author info
 * @access  Public (no authentication required)
 */
router.get(
  '/:id/related-posts',
  TravelPlanController.getRelatedPostById,
);

/**
 * GET /api/plans/:id
 * Get a travel plan by ID
 * Requires: Authentication
 */
router.get(
  '/:id',
  AuthJwtMiddleware.optionalAuth,
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
  AuthJwtMiddleware.optionalAuth,
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
 * @desc    Updates the cover image of a travel plan with file upload
 * @access  Private (Requires Authentication & Authorization)
 */
router.put(
  '/:id/cover-image',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  uploadUseCases.singleFileUpload('coverImage', 'travel-plan-covers'),
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

/**
 * @route   POST /api/plans/:planId/days/:dayNumber/items
 * @desc    Add a new item to a specific day in a travel plan
 * @access  Private (Requires Authorization - Author only)
 */
router.post(
  '/:id/days/:dayNumber/items',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  TravelPlanController.addPlanItem,
);

/**
 * @route   POST /api/plans/:id/items/reorder
 * @desc    Reorder items within a specific day in a travel plan
 * @access  Private (Requires Authorization - Author only)
 */
router.post(
  '/:id/items/reorder',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  TravelPlanController.reorderItemsInDay,
);

/**
 * @route   GET /api/plans/:planId/items/:itemId
 * @desc    Get a specific item from a travel plan
 * @access  Private (Author or Public Plan)
 */
router.get(
  '/:id/items/:itemId',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthorOrPublic,
  TravelPlanController.getPlanItem,
);

/**
 * @route   PUT /api/plans/:planId/items/:itemId
 * @desc    Update a specific item in a travel plan
 * @access  Private (Requires Authorization - Author only)
 */
router.put(
  '/:id/items/:itemId',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  TravelPlanController.updatePlanItem,
);

/**
 * @route   DELETE /api/plans/:planId/items/:itemId
 * @desc    Delete a specific item from a travel plan
 * @access  Private (Requires Authorization - Author only)
 */
router.delete(
  '/:id/items/:itemId',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  TravelPlanController.deletePlanItem,
);

/**
 * @route   POST /api/plans/:id/items/move
 * @desc    Move an item from one day to another within a travel plan
 * @access  Private (Requires Authorization - Author only)
 */
router.post(
  '/:id/items/move',
  AuthJwtMiddleware.verifyToken,
  AuthJwtMiddleware.isAuthor,
  TravelPlanController.moveItemToAnotherDay,
);

/**
 * @route   GET /api/plans/:id/related-posts
 * @desc    Get all posts related to a specific travel plan, including author info
 * @access  Public (no authentication required)
 */
router.get(
  '/:id/related-posts',
  TravelPlanController.getRelatedPostById,
);


export default router;
