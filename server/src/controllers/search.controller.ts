import { Request, Response, NextFunction } from 'express';
import searchService, { SearchOptions } from '../services/search.service';
import { HTTP_STATUS } from '../constants/http';

/**
 * Controller for handling search operations
 */
class SearchController {
  /**
   * Search across all content types
   * GET /api/search?q=query&page=1&limit=10&type=all|plans|posts|users
   */
  async searchContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { q: query, page = '1', limit = '10', type = 'all' } = req.query;

      // Validate query parameter
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Search query is required',
        });
      }

      // Validate and parse pagination parameters
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Page must be a positive number',
        });
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Limit must be between 1 and 50',
        });
      }

      // Validate type parameter
      const validTypes = ['all', 'plans', 'posts', 'users'];
      if (!validTypes.includes(type as string)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Type must be one of: all, plans, posts, users',
        });
      }

      const searchOptions: SearchOptions = {
        query: query.trim(),
        page: pageNum,
        limit: limitNum,
        type: type as 'all' | 'plans' | 'posts' | 'users',
      };

      const results = await searchService.searchAll(searchOptions);

      // Calculate pagination info
      const totalResults = results.totalPlans + results.totalPosts + results.totalUsers;
      const totalPages = Math.ceil(totalResults / limitNum);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          ...results,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalResults,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get search suggestions for autocomplete
   * GET /api/search/suggestions?q=query&limit=5
   */
  async getSearchSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const { q: query, limit = '5' } = req.query;

      // Validate query parameter
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Search query is required',
        });
      }

      // Validate limit parameter
      const limitNum = parseInt(limit as string, 10);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 10) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Limit must be between 1 and 10',
        });
      }

      const suggestions = await searchService.getSearchSuggestions(query.trim(), limitNum);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search only travel plans
   * GET /api/search/plans?q=query&page=1&limit=10
   */
  async searchPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const { q: query, page = '1', limit = '10' } = req.query;

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Search query is required',
        });
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const results = await searchService.searchPlans(query.trim(), skip, limitNum);
      const totalPages = Math.ceil(results.total / limitNum);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          plans: results.plans,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalResults: results.total,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search only posts
   * GET /api/search/posts?q=query&page=1&limit=10
   */
  async searchPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const { q: query, page = '1', limit = '10' } = req.query;

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Search query is required',
        });
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const results = await searchService.searchPosts(query.trim(), skip, limitNum);
      const totalPages = Math.ceil(results.total / limitNum);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          posts: results.posts,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalResults: results.total,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search only users
   * GET /api/search/users?q=query&page=1&limit=10
   */
  async searchUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { q: query, page = '1', limit = '10' } = req.query;

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Search query is required',
        });
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const results = await searchService.searchUsers(query.trim(), skip, limitNum);
      const totalPages = Math.ceil(results.total / limitNum);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          users: results.users,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalResults: results.total,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SearchController();