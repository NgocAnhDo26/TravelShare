export interface IComment {
  _id: string;
  user: {
    _id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  content: string;
  imageUrl?: string; 
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  likesCount: number;
  replies: IComment[];
  replyCount: number;
}