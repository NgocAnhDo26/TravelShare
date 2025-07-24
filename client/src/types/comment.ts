
export interface IUser {
  _id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface IComment {
  _id: string;
  user: IUser;
  content: string;
  createdAt: string;
  onModel: 'TravelPlan' | 'Post';
  targetId: string;
}