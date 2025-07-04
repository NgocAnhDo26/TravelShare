import { Schema, model, Model, Document, Types } from 'mongoose';

/**
 * Follow document interface for managing user follow relationships
 */
export interface IFollow extends Document {
  /** User who is following */
  follower: Types.ObjectId;
  /** User being followed */
  following: Types.ObjectId;
  /** When the follow relationship was created */
  createdDate: Date;
}

/**
 * Follow schema for managing user-to-user follow relationships
 */
const followSchema: Schema<IFollow> = new Schema(
  {
    /** ID of the user who is following, references User collection */
    follower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    /** ID of the user being followed, references User collection */
    following: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    /** Automatically add createdAt, updatedAt to track when follow occurred */
    timestamps: { createdAt: 'createdDate', updatedAt: false },
    collection: 'follows',
  },
);

/** Create unique index to ensure a user cannot follow another user multiple times */
followSchema.index({ follower: 1, following: 1 }, { unique: true });
/** Index for finding a user's followers */
followSchema.index({ following: 1 });
/** For getFollowers queries */
followSchema.index({ following: 1, createdDate: -1 });
/** For getFollowing queries */
followSchema.index({ follower: 1, createdDate: -1 });

const Follow: Model<IFollow> = model<IFollow>('Follow', followSchema);
export default Follow;
