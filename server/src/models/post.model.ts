import { Schema, model, Model, Document, Types } from 'mongoose';

// Interface for the Post document
export interface IPost extends Document {
  /** Stable unique identifier required by an existing DB index */
  postId: string;
  authorID: string;
  title: string;
  content: string;
  coverImageUrl?: string;
  images?: string[];
  /** Optional related travel plan tagged in this post */
  relatedPlan?: Types.ObjectId;
  privacy: 'public' | 'private';
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition
const postSchema = new Schema<IPost>(
  {
    // Satisfy existing unique index in DB: postId_1
    postId: {
      type: String,
      unique: true,
      index: true,
      default: () => new Types.ObjectId().toString(),
    },
    authorID: {
      type: String,
      required: [true, 'Author ID is required'],
      trim: true,
      ref: 'users', // Assuming you have a User model
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters long'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      minlength: [10, 'Content must be at least 10 characters long'],
    },
    coverImageUrl: {
      type: String,
      default: null,
    },
    images: {
      type: [String],
      default: [],
    },
    /** Reference to a tagged TravelPlan */
    relatedPlan: {
      type: Schema.Types.ObjectId,
      ref: 'TravelPlan',
      required: false,
    },
    privacy: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
    versionKey: false, // Don't include __v field
  },
);

// Indexes for faster queries
postSchema.index({ authorID: 1, createdAt: -1 }); // For author-specific queries sorted by newest first
postSchema.index({ author: 1 });
postSchema.index({ privacy: 1 });
postSchema.index({ createdAt: -1 }); // For sorting by newest first

// Virtual for formatted created date (can be used in responses)
postSchema.virtual('createdAtFormatted').get(function () {
  return this.createdAt.toLocaleDateString();
});

// Define Post model
const Post: Model<IPost> = model<IPost>('posts', postSchema);

export default Post;
