import { Schema, model, Model, Document, Types } from 'mongoose';

/**
 * Interface cho một tài liệu Post
 */
export interface IPost extends Document {
  title: string;
  content: string;
  author: Types.ObjectId;
  privacy: 'public' | 'private';
  relatedPlan?: Types.ObjectId;
  likesCount: number;
  commentsCount: number;
}

const postSchema: Schema<IPost> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    privacy: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    relatedPlan: { type: Schema.Types.ObjectId, ref: 'TravelPlan' },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'posts' },
);

const Post: Model<IPost> = model<IPost>('Post', postSchema);
export default Post;