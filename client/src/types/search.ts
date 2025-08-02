// Types for search functionality

export interface SearchUser {
  _id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
}

export interface SearchTravelPlan {
  _id: string;
  title: string;
  destination: {
    name: string;
    address: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  coverImageUrl?: string;
  author: {
    _id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  privacy: 'public' | 'private';
  likesCount: number;
  commentsCount: number;
  trendingScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchPost {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  privacy: 'public' | 'private';
  relatedPlan?: {
    _id: string;
    title: string;
    destination: {
      name: string;
    };
  };
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResults {
  plans: SearchTravelPlan[];
  posts: SearchPost[];
  users: SearchUser[];
  totalPlans: number;
  totalPosts: number;
  totalUsers: number;
}

export interface SearchPagination {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SearchResponse {
  success: boolean;
  data: SearchResults & {
    pagination: SearchPagination;
  };
}

export interface SearchSuggestion {
  type: 'plan' | 'user' | 'post';
  id: string; // Added ID for direct navigation
  title: string;
  subtitle: string;
  avatarUrl?: string; // For user suggestions
}

export interface SearchSuggestionsResponse {
  success: boolean;
  data: {
    plans: SearchSuggestion[];
    users: SearchSuggestion[];
    posts: SearchSuggestion[];
  };
}

export type SearchType = 'all' | 'plans' | 'posts' | 'users';
