import TravelPlan, { ITravelPlan } from '../models/travelPlan.model';
import Post, { IPost } from '../models/post.model';
import User, { IUser } from '../models/user.model';
import { Types } from 'mongoose';

export interface SearchResults {
  plans: ITravelPlan[];
  posts: IPost[];
  users: IUser[];
  totalPlans: number;
  totalPosts: number;
  totalUsers: number;
}

export interface SearchOptions {
  query: string;
  page: number;
  limit: number;
  type?: 'all' | 'plans' | 'posts' | 'users';
  userId?: string; // Optional user ID for follow status
}

/**
 * Service for handling search operations across different content types
 */
class SearchService {
  /**
   * Search across all content types (plans, posts, users)
   */
  async searchAll(options: SearchOptions): Promise<SearchResults> {
    const { query, page, limit, type = 'all', userId } = options;
    const skip = (page - 1) * limit;

    // Build search regex for partial matching
    const searchRegex = new RegExp(query, 'i');

    // Initialize results
    let plans: ITravelPlan[] = [];
    let posts: IPost[] = [];
    let users: IUser[] = [];
    let totalPlans = 0;
    let totalPosts = 0;
    let totalUsers = 0;

    // Search based on type
    if (type === 'all' || type === 'plans') {
      const planResults = await this.searchPlans(query, skip, limit);
      plans = planResults.plans;
      totalPlans = planResults.total;
    }

    if (type === 'all' || type === 'posts') {
      const postResults = await this.searchPosts(query, skip, limit);
      posts = postResults.posts;
      totalPosts = postResults.total;
    }

    if (type === 'all' || type === 'users') {
      const userResults = await this.searchUsers(query, skip, limit, userId);
      users = userResults.users;
      totalUsers = userResults.total;
    }

    return {
      plans,
      posts,
      users,
      totalPlans,
      totalPosts,
      totalUsers,
    };
  }

  /**
   * Search travel plans by title and destination
   */
  async searchPlans(query: string, skip: number, limit: number) {
    const searchRegex = new RegExp(query, 'i');

    const searchQuery = {
      privacy: 'public',
      $or: [
        { title: searchRegex },
        { 'destination.name': searchRegex },
        { 'destination.address': searchRegex },
        { 'destination.country': searchRegex },
        { 'schedule.items.title': searchRegex },
        { 'schedule.items.description': searchRegex },
      ],
    };

    const [plans, total] = await Promise.all([
      TravelPlan.find(searchQuery)
        .populate('author', 'username displayName avatarUrl')
        .sort({ trendingScore: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TravelPlan.countDocuments(searchQuery),
    ]);

    return { plans, total };
  }

  /**
   * Search posts by title and content
   */
  async searchPosts(query: string, skip: number, limit: number) {
    const searchRegex = new RegExp(query, 'i');

    const searchQuery = {
      privacy: 'public',
      $or: [{ title: searchRegex }, { content: searchRegex }],
    };

    const [posts, total] = await Promise.all([
      Post.find(searchQuery)
        .populate('author', 'username displayName avatarUrl')
        .populate('relatedPlan', 'title destination')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(searchQuery),
    ]);

    return { posts, total };
  }

  /**
   * Search users by username, displayName, and bio
   */
  async searchUsers(
    query: string,
    skip: number,
    limit: number,
    userId?: string,
  ) {
    const searchRegex = new RegExp(query, 'i');

    const searchQuery = {
      $or: [
        { username: searchRegex },
        { displayName: searchRegex },
        { bio: searchRegex },
      ],
    };

    const [users, total] = await Promise.all([
      User.find(searchQuery)
        .select(
          'username displayName avatarUrl bio followerCount followingCount',
        )
        .sort({ followerCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(searchQuery),
    ]);

    // If userId is provided, add follow status for each user
    if (userId) {
      const Follow = (await import('../models/follow.model')).default;
      const usersWithFollowStatus = await Promise.all(
        users.map(async (user) => {
          const isFollowing = await Follow.exists({
            follower: userId,
            following: user._id,
          });
          return {
            ...user,
            isFollowing: !!isFollowing,
          };
        }),
      );
      return { users: usersWithFollowStatus, total };
    }

    return { users, total };
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSearchSuggestions(query: string, limit: number = 5) {
    const searchRegex = new RegExp(query, 'i');

    const [planSuggestions, userSuggestions, postSuggestions] =
      await Promise.all([
        TravelPlan.find({
          privacy: 'public',
          $or: [{ title: searchRegex }, { 'destination.name': searchRegex }],
        })
          .select('title destination.name')
          .limit(limit)
          .lean(),
        User.find({
          $or: [{ username: searchRegex }, { displayName: searchRegex }],
        })
          .select('username displayName avatarUrl')
          .limit(limit)
          .lean(),
        Post.find({
          privacy: 'public',
          $or: [{ title: searchRegex }, { content: searchRegex }],
        })
          .select('title content')
          .limit(limit)
          .lean(),
      ]);

    return {
      plans: planSuggestions.map((plan) => ({
        id: plan._id.toString(),
        type: 'plan',
        title: plan.title,
        subtitle: plan.destination.name,
      })),
      users: userSuggestions.map((user) => ({
        id: user._id.toString(),
        type: 'user',
        title: user.displayName || user.username,
        subtitle: `@${user.username}`,
        avatarUrl: user.avatarUrl,
      })),
      posts: postSuggestions.map((post) => ({
        id: post._id.toString(),
        type: 'post',
        title: post.title,
        subtitle: post.content,
      })),
    };
  }
}

export default new SearchService();
