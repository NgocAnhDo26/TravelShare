export interface Post {
  postId: string;
  title: string;
  content: string;
  coverImage?: string;
  images?: string[];
  privacy: 'public' | 'private';
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
}