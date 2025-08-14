import TravelPlan from '../models/travelPlan.model';
import Post from '../models/post.model';

/**
 * Calculates and updates the trendingScore for recent public travel plans and posts.
 * This function is designed to be called by a scheduler.
 */
export async function updateTrendingScores() {
  console.log('Running trending score update job...');
  try {
    // Only process plans and posts from the last 7 days to keep the job efficient.
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // The GRAVITY constant controls how quickly scores decay over time.
    // Higher values make trending posts fade faster; lower values keep them trending longer.
    const GRAVITY = 1.8;
    const now = Date.now();
    let updatedCount = 0;

    // Process travel plans
    const recentPlans = await TravelPlan.find({
      privacy: 'public',
      createdAt: { $gte: sevenDaysAgo },
    });

    const planBulkOperations: any[] = [];
    for (const plan of recentPlans) {
      const engagementPoints =
        (plan.likesCount || 0) * 2 +
        (plan.commentsCount || 0) * 1 +
        (plan.remixCount || 0) * 3;

      const hoursSinceCreation =
        (now - plan.createdAt!.getTime()) / (1000 * 60 * 60);

      const score =
        engagementPoints / Math.pow(hoursSinceCreation + 2, GRAVITY);

      // Update the plan only if the score has changed meaningfully
      if (Math.abs((plan.trendingScore || 0) - score) > 0.001) {
        planBulkOperations.push({
          updateOne: {
            filter: { _id: plan._id },
            update: { $set: { trendingScore: score } },
          },
        });
        updatedCount++;
      }
    }

    // Process posts
    const recentPosts = await Post.find({
      privacy: 'public',
      createdAt: { $gte: sevenDaysAgo },
    });

    const postBulkOperations: any[] = [];
    for (const post of recentPosts) {
      const engagementPoints =
        (post.likesCount || 0) * 2 + (post.commentsCount || 0) * 1;

      const hoursSinceCreation =
        (now - post.createdAt!.getTime()) / (1000 * 60 * 60);

      const score =
        engagementPoints / Math.pow(hoursSinceCreation + 2, GRAVITY);

      // Update the post only if the score has changed meaningfully
      if (Math.abs((post.trendingScore || 0) - score) > 0.001) {
        postBulkOperations.push({
          updateOne: {
            filter: { _id: post._id },
            update: { $set: { trendingScore: score } },
          },
        });
        updatedCount++;
      }
    }

    // Execute bulk operations
    if (planBulkOperations.length > 0) {
      await TravelPlan.bulkWrite(planBulkOperations);
    }
    if (postBulkOperations.length > 0) {
      await Post.bulkWrite(postBulkOperations);
    }

    console.log(
      `Trending score update job finished. Updated ${updatedCount} items (plans and posts).`,
    );
  } catch (error) {
    console.error('Error during trending score update job:', error);
  }
}
