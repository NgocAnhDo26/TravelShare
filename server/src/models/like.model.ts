import { Schema, model, Document, Types, Model } from 'mongoose';

/**
 * Like document interface for tracking user likes on posts and travel plans
 */
export interface ILike extends Document {
  /** User who liked the content */
  user: Types.ObjectId;
  /** ID of the liked content */
  targetId: Types.ObjectId;
  /** Type of content being liked */
  onModel: 'TravelPlan' | 'Post'| 'Comment';
  /** When the like was created */
  createdAt: Date;
  /** When the like was last updated */
  updatedAt: Date;
}

/**
 * Like schema for managing user likes on posts and travel plans
 */
const likeSchema: Schema<ILike> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    onModel: {
      type: String,
      required: true,
      enum: ['TravelPlan', 'Post', 'Comment'],
      index: true,
    },
  },
  { timestamps: true, collection: 'likes' },
);

/** Unique index to prevent duplicate likes */
likeSchema.index({ user: 1, targetId: 1, onModel: 1 }, { unique: true });

export const Like: Model<ILike> = model<ILike>('Like', likeSchema);
