import mongoose, { Document, Schema, Types } from 'mongoose';

// Supported models for bookmarking
export type SupportedModels = 'TravelPlan' | 'Post';

// Interface for the Bookmark document
export interface IBookmark extends Document {
  user: Types.ObjectId;
  targetId: Types.ObjectId;
  onModel: SupportedModels;
  createdAt: Date;
}

const BookmarkSchema: Schema = new Schema(
  {
    // The user who bookmarked the item
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // The ID of the bookmarked item (plan or post)
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'onModel', // Use `onModel` to determine which collection to populate from
    },
    // The name of the bookmarked model
    onModel: {
      type: String,
      required: true,
      enum: ['TravelPlan', 'Post'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need `createdAt`
    // Ensure a user can only bookmark an item once
    indexes: [{ unique: true, fields: ['user', 'targetId', 'onModel'] }],
  },
);

const Bookmark = mongoose.model<IBookmark>('Bookmark', BookmarkSchema);
export default Bookmark;
