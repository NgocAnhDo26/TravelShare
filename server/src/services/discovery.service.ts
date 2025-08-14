import TravelPlan from '../models/travelPlan.model';
import Post from '../models/post.model';
import User from '../models/user.model';

class DiscoveryService {
  async getTrendings(options: { limit?: number; after?: string } = {}) {
    const { limit = 20, after } = options;

    const query: any = { privacy: 'public' };

    if (after) {
      try {
        // Parse the cursor which contains trendingScore, type, and _id
        const [trendingScore, type, id] = after.split('|');
        const score = parseFloat(trendingScore);

        // Validate that we have all required parts and score is a valid number
        if (trendingScore && type && id && !isNaN(score)) {
          // Use compound cursor to handle ties properly
          query.$or = [
            { trendingScore: { $lt: score } },
            {
              trendingScore: score,
              _id: { $lt: id },
            },
          ];
        } else {
          // Invalid cursor format, reset query to just privacy filter
          console.error(
            'Invalid cursor format: missing parts or invalid score',
          );
        }
      } catch (error) {
        console.error('Invalid cursor format:', error);
        // Fallback to no cursor if parsing fails - query remains { privacy: 'public' }
      }
    }

    // Get trending travel plans
    const trendingPlans = await TravelPlan.find(query)
      .populate('author', 'username displayName avatarUrl')
      .sort({ trendingScore: -1, _id: -1 })
      .limit(limit)
      .lean()
      .exec();

    // Get trending posts
    const trendingPosts = await Post.find(query)
      .populate('author', 'username displayName avatarUrl')
      .sort({ trendingScore: -1, _id: -1 })
      .limit(limit)
      .lean()
      .exec();

    // Combine and sort by trending score
    const allTrendings = [
      ...trendingPlans.map((plan) => ({ ...plan, type: 'TravelPlan' })),
      ...trendingPosts.map((post) => ({ ...post, type: 'Post' })),
    ]
      .sort((a, b) => {
        // Sort by trending score (descending), then by _id for consistency
        if (b.trendingScore !== a.trendingScore) {
          return (b.trendingScore || 0) - (a.trendingScore || 0);
        }
        // When scores are equal, sort by _id in descending order for consistency
        return b._id.toString().localeCompare(a._id.toString());
      })
      .slice(0, limit);

    // Prepare pagination info with compound cursor
    let next_cursor = null;
    if (allTrendings.length === limit) {
      const lastItem = allTrendings[allTrendings.length - 1];
      next_cursor = `${lastItem.trendingScore}|${lastItem.type}|${lastItem._id}`;
    }

    return {
      data: allTrendings,
      pagination: {
        next_cursor,
        has_next_page: next_cursor !== null,
      },
    };
  }

  async getPlans(query?: string, userId?: string) {
    const filter: any = { privacy: 'public' };

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { 'destination.name': { $regex: query, $options: 'i' } },
        { 'author.username': { $regex: query, $options: 'i' } },
        { 'author.displayName': { $regex: query, $options: 'i' } },
      ];
    }

    const plans = await TravelPlan.find(filter)
      .populate('author', 'username displayName avatarUrl')
      .sort({ trendingScore: -1, createdAt: -1 })
      .limit(50);

    return plans;
  }

  async getPosts(query?: string, userId?: string) {
    const filter: any = { privacy: 'public' };

    // Exclude user's own posts
    if (userId) {
      filter.author = { $ne: userId };
    }

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { 'author.username': { $regex: query, $options: 'i' } },
        { 'author.displayName': { $regex: query, $options: 'i' } },
      ];
    }

    const posts = await Post.find(filter)
      .populate('author', 'username displayName avatarUrl')
      .sort({ trendingScore: -1, createdAt: -1 })
      .limit(50);

    return posts;
  }

  async getPeople(query?: string, userId?: string) {
    const filter: any = {};

    // Exclude the current user from people search
    if (userId) {
      filter._id = { $ne: userId };
    }

    if (query) {
      filter.$or = [
        { username: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } },
      ];
    }

    const people = await User.find(filter)
      .select(
        'username displayName avatarUrl bio followerCount followingCount registrationDate',
      )
      .sort({ followerCount: -1, registrationDate: -1 })
      .limit(50);

    return people;
  }
}

export default new DiscoveryService();
