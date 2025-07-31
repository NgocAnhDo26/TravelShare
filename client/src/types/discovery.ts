import type { IPlan } from './trip';

export interface IPost {
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
  relatedPlan?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IPerson {
  _id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  registrationDate: string;
}

export interface DiscoveryData {
  plans: IPlan[];
  posts: IPost[];
  people: IPerson[];
}

export type FilterType = 'all' | 'plans' | 'posts' | 'people';

export interface SearchParams {
  query: string;
  filter: FilterType;
  page?: number;
  limit?: number;
} 