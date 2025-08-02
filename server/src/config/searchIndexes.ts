import mongoose from 'mongoose';
import TravelPlan from '../models/travelPlan.model';
import Post from '../models/post.model';
import User from '../models/user.model';
import { logger } from '../utils/logger';

/**
 * Handle TravelPlan collection indexes - check for existing text index and use it, or create new one
 */
async function handleTravelPlanIndexes() {
  try {
    // Get existing indexes
    const existingIndexes = await TravelPlan.collection.getIndexes();

    // Check if we already have a text search index (the existing one is called 'travel_plan_search_index')
    const hasTextIndex = Object.keys(existingIndexes).some(indexName => {
      // Check for existing text search index names or examine index structure
      if (indexName.includes('search') || indexName.includes('text')) {
        return true;
      }

      // Also check the index structure for text indexes
      const indexInfo = existingIndexes[indexName] as any;
      if (Array.isArray(indexInfo)) {
        return indexInfo.some((field: any) =>
          typeof field === 'object' && field !== null && field._fts === 'text'
        );
      }
      if (typeof indexInfo === 'object' && indexInfo !== null && '_fts' in indexInfo) {
        return indexInfo._fts === 'text';
      }
      return false;
    });

    if (hasTextIndex) {
      logger.info('TravelPlan collection already has a text index, using existing one for search');
      return;
    }

    // Create new text index only if none exists
    await TravelPlan.collection.createIndex(
      {
        title: 'text',
        'destination.name': 'text',
        'destination.address': 'text',
        'destination.country': 'text',
        'schedule.items.title': 'text',
        'schedule.items.description': 'text',
      },
      {
        name: 'search_text_index',
        weights: {
          title: 10,
          'destination.name': 8,
          'destination.country': 6,
          'destination.address': 4,
          'schedule.items.title': 3,
          'schedule.items.description': 1,
        },
        default_language: 'english',
        language_override: 'language',
      }
    );

    logger.info('Created TravelPlan text index successfully');
  } catch (error) {
    logger.error('Error handling TravelPlan indexes:', error);
    throw error;
  }
}

/**
 * Create text indexes for Post collection
 */
async function createPostIndexes() {
  try {
    // Check if index already exists
    const existingIndexes = await Post.collection.getIndexes();

    // Check for existing text search indexes
    const hasTextIndex = Object.keys(existingIndexes).some(indexName => {
      return indexName.includes('search') || indexName.includes('text') || indexName === 'post_search_text_index';
    });

    if (hasTextIndex) {
      logger.info('Post text index already exists, skipping creation');
      return;
    }

    await Post.collection.createIndex(
      {
        title: 'text',
        content: 'text',
      },
      {
        name: 'post_search_text_index',
        weights: {
          title: 10,
          content: 5,
        },
        default_language: 'english',
        language_override: 'language',
      }
    );

    logger.info('Created Post text index successfully');
  } catch (error) {
    logger.error('Error creating Post indexes:', error);
    throw error;
  }
}

/**
 * Create text indexes for User collection
 */
async function createUserIndexes() {
  try {
    // Check if index already exists
    const existingIndexes = await User.collection.getIndexes();

    // Check for existing text search indexes
    const hasTextIndex = Object.keys(existingIndexes).some(indexName => {
      return indexName.includes('search') || indexName.includes('text') || indexName === 'user_search_text_index';
    });

    if (hasTextIndex) {
      logger.info('User text index already exists, skipping creation');
      return;
    }

    await User.collection.createIndex(
      {
        username: 'text',
        displayName: 'text',
        bio: 'text',
      },
      {
        name: 'user_search_text_index',
        weights: {
          username: 10,
          displayName: 8,
          bio: 1,
        },
        default_language: 'english',
        language_override: 'language',
      }
    );

    logger.info('Created User text index successfully');
  } catch (error) {
    logger.error('Error creating User indexes:', error);
    throw error;
  }
}

/**
 * Create additional indexes for better search performance
 */
async function createAdditionalIndexes() {
  try {
    // Create compound indexes if they don't exist
    const travelPlanIndexes = await TravelPlan.collection.getIndexes();
    const postIndexes = await Post.collection.getIndexes();
    const userIndexes = await User.collection.getIndexes();

    // TravelPlan additional indexes
    if (!('privacy_1_trendingScore_-1' in travelPlanIndexes)) {
      await TravelPlan.collection.createIndex(
        { privacy: 1, trendingScore: -1 },
        { name: 'privacy_1_trendingScore_-1' }
      );
    }

    if (!('privacy_1_createdAt_-1' in travelPlanIndexes)) {
      await TravelPlan.collection.createIndex(
        { privacy: 1, createdAt: -1 },
        { name: 'privacy_1_createdAt_-1' }
      );
    }

    // Post additional indexes
    if (!('privacy_1_createdAt_-1' in postIndexes)) {
      await Post.collection.createIndex(
        { privacy: 1, createdAt: -1 },
        { name: 'post_privacy_1_createdAt_-1' }
      );
    }

    // User additional indexes
    if (!('followerCount_-1' in userIndexes)) {
      await User.collection.createIndex(
        { followerCount: -1 },
        { name: 'followerCount_-1' }
      );
    }

    logger.info('Created additional indexes successfully');
  } catch (error) {
    logger.error('Error creating additional indexes:', error);
    throw error;
  }
}

/**
 * Initialize MongoDB text indexes for optimal search performance
 * This script should be run during application startup or deployment
 */
export async function initializeSearchIndexes() {
  try {
    logger.info('Initializing search indexes...');

    // Check and handle existing TravelPlan text indexes
    await handleTravelPlanIndexes();

    // Create text index for Post collection
    await createPostIndexes();

    // Create text index for User collection
    await createUserIndexes();

    // Create additional indexes for better search performance
    await createAdditionalIndexes();

    logger.info('Search indexes created successfully');
  } catch (error) {
    logger.error('Error creating search indexes:', error);
    throw error;
  }
}

/**
 * Drop all search indexes (useful for development/testing)
 */
export async function dropSearchIndexes() {
  try {
    logger.info('Dropping search indexes...');

    await TravelPlan.collection.dropIndex('search_text_index').catch(() => { });
    await Post.collection.dropIndex('post_search_text_index').catch(() => { });
    await User.collection.dropIndex('user_search_text_index').catch(() => { });

    logger.info('Search indexes dropped successfully');
  } catch (error) {
    logger.error('Error dropping search indexes:', error);
    throw error;
  }
}

/**
 * Check if search indexes exist
 */
export async function checkSearchIndexes() {
  try {
    const travelPlanIndexes = await TravelPlan.collection.getIndexes();
    const postIndexes = await Post.collection.getIndexes();
    const userIndexes = await User.collection.getIndexes();

    logger.info('TravelPlan indexes:', Object.keys(travelPlanIndexes));
    logger.info('Post indexes:', Object.keys(postIndexes));
    logger.info('User indexes:', Object.keys(userIndexes));

    return {
      travelPlan: 'search_text_index' in travelPlanIndexes,
      post: 'post_search_text_index' in postIndexes,
      user: 'user_search_text_index' in userIndexes,
    };
  } catch (error) {
    logger.error('Error checking search indexes:', error);
    throw error;
  }
}

/**
 * Safe initialization that handles existing indexes gracefully
 */
export async function safeInitializeSearchIndexes() {
  try {
    logger.info('Starting safe search index initialization...');

    // Try to initialize indexes, but don't fail server startup if there are conflicts
    try {
      await initializeSearchIndexes();
      logger.info('Search indexes initialized successfully');
    } catch (error: any) {
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        logger.info('Search indexes already exist with different configurations. Using existing indexes.');
      } else {
        logger.warn('Failed to initialize search indexes:', error.message);
      }
      logger.info('Search functionality will use existing indexes if available');
    }

  } catch (error) {
    logger.error('Error in safe index initialization:', error);
    // Don't throw error to prevent server startup failure
    logger.warn('Search functionality may be limited due to index initialization failure');
  }
}
