import { Schema, model, Model, Document, Types } from 'mongoose';

/**
 * @interface IFollow
 * @description Represents the structure of a follow relationship document in MongoDB.
 * @property {Types.ObjectId} follower_id - The user who is initiating the follow.
 * @property {Types.ObjectId} following_id - The user who is being followed.
 * @property {Date} created_date - The date the follow relationship was created.
 */
export interface IFollow extends Document {
  follower_id: Types.ObjectId;
  following_id: Types.ObjectId;
  created_date: Date;
}

/**
 * @schema followSchema
 * @description Mongoose schema for the 'follows' collection.
 */
const followSchema: Schema<IFollow> = new Schema(
  {
    /**
     * The ID of the user who is following. This is a reference to the 'user' collection.
     */
    follower_id: {
      type: Schema.Types.ObjectId,
      ref: 'user', 
      required: true,
    },
    /**
     * The ID of the user who is being followed. This is a reference to the 'user' collection.
     */
    following_id: {
      type: Schema.Types.ObjectId,
      ref: 'user', 
      required: true,
    },
  },
  {
    /**
     * Timestamps options.
     * `createdAt` is automatically managed by Mongoose and mapped to our `created_date` field.
     * `updatedAt` is disabled as a follow relationship is typically not updated.
     */
    timestamps: { createdAt: 'created_date', updatedAt: false },
    collection: 'follows', // Explicitly set the collection name to 'follows'
  },
);

// --- CRITICAL INDEXES FOR PERFORMANCE ---

// This index ensures that a user cannot follow the same person more than once.
// It also optimizes queries for finding who a user is following.
followSchema.index({ follower_id: 1, following_id: 1 }, { unique: true });

// This index optimizes queries for finding a user's followers.
followSchema.index({ following_id: 1 });


/**
 * @model Follow
 * @description Mongoose model for the 'follows' collection.
 */
const Follow: Model<IFollow> = model<IFollow>('Follow', followSchema);

export default Follow;
