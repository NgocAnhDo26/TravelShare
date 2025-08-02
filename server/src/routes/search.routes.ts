import { Router } from 'express';
import searchController from '../controllers/search.controller';
import AuthJwtMiddleware from '../middlewares/authJwt';

const router = Router();

/**
 * Search routes
 * All routes are public but include optional authentication for enhanced features
 */

// Main search endpoint - searches across all content types
router.get('/', AuthJwtMiddleware.optionalAuth, searchController.searchContent);

// Get search suggestions for autocomplete
router.get('/suggestions', searchController.getSearchSuggestions);

// Search specific content types
router.get('/plans', searchController.searchPlans);
router.get('/posts', searchController.searchPosts);
router.get(
  '/users',
  AuthJwtMiddleware.optionalAuth,
  searchController.searchUsers,
);

export default router;
