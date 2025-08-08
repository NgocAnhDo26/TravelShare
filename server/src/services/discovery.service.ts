import TravelPlan from '../models/travelPlan.model';
import Post from '../models/post.model';
import User from '../models/user.model';

class DiscoveryService {
  async getTrendings(options: { limit?: number; after?: string } = {}) {
    const { limit = 20, after } = options;

    const query: any = { privacy: 'public' };

    if (after) {
      try {
        // Parse the cursor which contains trendingScore and _id
        const [trendingScore, id] = after.split('|');
        const score = parseFloat(trendingScore);

        // Use compound cursor to handle ties properly
        query.$or = [
          { trendingScore: { $lt: score } },
          {
            trendingScore: score,
            _id: { $lt: id },
          },
        ];
      } catch (error) {
        console.error('Invalid cursor format:', error);
        // Fallback to no cursor if parsing fails
      }
    }

    const trendings = await TravelPlan.find(query)
      .populate('author', 'username displayName avatarUrl')
      .sort({ trendingScore: -1, _id: -1 })
      .limit(limit)
      .lean()
      .exec();

    // Prepare pagination info with compound cursor
    let next_cursor = null;
    if (trendings.length === limit) {
      const lastItem = trendings[trendings.length - 1];
      next_cursor = `${lastItem.trendingScore}|${lastItem._id}`;
    }

    return {
      data: trendings,
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
      .sort({ createdAt: -1 })
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
