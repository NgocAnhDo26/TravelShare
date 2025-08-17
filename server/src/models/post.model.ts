import { Schema, model, Model, Document, Types } from 'mongoose';

// Interface for the Post document
export interface IPost extends Document {
  /** Title of the post */
  title: string;
  /** Content of the post */
  content: string;
  /** Cover image URL */
  coverImageUrl?: string;
  /** Additional images */
  images?: string[];
  /** Author of the post */
  author: Types.ObjectId;
  /** Privacy setting */
  privacy: 'public' | 'private';
  /** Related travel plan if any */
  relatedPlan?: Types.ObjectId;
  /** Number of likes */
  likesCount: number;
  /** Number of comments */
  commentsCount: number;
  /** Trending score for discovery */
  trendingScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition
const postSchema = new Schema<IPost>(
  {
    /** Reference to the post author */
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
      index: true,
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
      default: 'https://placehold.co/1200x400/CCCCCC/FFFFFF?text=TravelShare',
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
    trendingScore: {
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
postSchema.index({ author: 1, createdAt: -1 }); // For author-specific queries sorted by newest first
postSchema.index({ privacy: 1 });
postSchema.index({ createdAt: -1 }); // For sorting by newest first
postSchema.index({ trendingScore: -1, _id: -1 }); // For trending queries

// Virtual for formatted created date (can be used in responses)
postSchema.virtual('createdAtFormatted').get(function () {
  return this.createdAt.toLocaleDateString();
});

// Define Post model
const Post: Model<IPost> = model<IPost>('Post', postSchema);

export default Post;
