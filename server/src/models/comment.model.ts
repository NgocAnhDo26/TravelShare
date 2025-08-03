import { Schema, model, Model, Document, Types } from 'mongoose';

/**
 *Interface for a Comment document
 */
export interface IComment extends Document {
  /** User who created the comment */
  user: Types.ObjectId;
  /** Content of the comment */
  content: string;
  imageUrl?: string;
  /** ID of the commented content (TravelPlan or Post) */
  targetId: Types.ObjectId;
  /** Type of the commented content model */
  onModel: 'TravelPlan' | 'Post';
  parentId?: Types.ObjectId;
  likesCount: number;
  replyCount: number;
  mentions: Types.ObjectId[];
  createdAt: Date;     
  updatedAt: Date;
}

const commentSchema: Schema<IComment> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String,  trim: true },
    imageUrl: { type: String, trim: true, default: null },
    targetId: { type: Schema.Types.ObjectId, required: true },
    onModel: {
      type: String,
      required: true,
      enum: ['TravelPlan', 'Post'],
    },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    replyCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  },
  { timestamps: true, collection: 'comments' },
);

commentSchema.index({ targetId: 1, onModel: 1 });

const Comment: Model<IComment> = model<IComment>('Comment', commentSchema);
export default Comment;
