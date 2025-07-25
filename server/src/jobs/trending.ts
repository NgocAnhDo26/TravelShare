import TravelPlan from '../models/travelPlan.model';

/**
 * Calculates and updates the trendingScore for recent public travel plans.
 * This function is designed to be called by a scheduler.
 */
export async function updateTrendingScores() {
  console.log('Running trending score update job...');
  try {
    // Only process plans from the last 7 days to keep the job efficient.
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const recentPlans = await TravelPlan.find({
      privacy: 'public',
      createdAt: { $gte: sevenDaysAgo },
    });

    // The GRAVITY constant controls how quickly scores decay over time.
    // Higher values make trending posts fade faster; lower values keep them trending longer.
    const GRAVITY = 1.8;
    const now = Date.now();
    let updatedCount = 0;
    const bulkOperations: any[] = [];
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
      // to avoid unnecessary database writes.
      // Add to bulk operations only if the score has changed meaningfully
      if (Math.abs((plan.trendingScore || 0) - score) > 0.0001) {
        bulkOperations.push({
          updateOne: {
            filter: { _id: plan._id },
            update: { $set: { trendingScore: score } },
          },
        });
        updatedCount++;
      }
    }
    if (bulkOperations.length > 0) {
      await TravelPlan.bulkWrite(bulkOperations);
    }

    console.log(
      `Trending score update job finished. Updated ${updatedCount} plans.`,
    );
  } catch (error) {
    console.error('Error during trending score update job:', error);
  }
}