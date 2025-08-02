import { Router } from 'express';
import searchController from '../controllers/search.controller';

const router = Router();

/**
 * Search routes
 * All routes are public - no authentication required for search
 */

// Main search endpoint - searches across all content types
router.get('/', searchController.searchContent);

// Get search suggestions for autocomplete
router.get('/suggestions', searchController.getSearchSuggestions);

// Search specific content types
router.get('/plans', searchController.searchPlans);
router.get('/posts', searchController.searchPosts);
router.get('/users', searchController.searchUsers);

export default router;