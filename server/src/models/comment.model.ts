import { Schema, model, Model, Document, Types } from 'mongoose';

/**
 * Interface cho một tài liệu Comment
 */
export interface IComment extends Document {
  /** Người dùng đã tạo bình luận */
  user: Types.ObjectId;
  /** Nội dung bình luận */
  content: string;
  /** ID của nội dung được bình luận (TravelPlan hoặc Post) */
  targetId: Types.ObjectId;
  /** Loại model của nội dung được bình luận */
  onModel: 'TravelPlan' | 'Post';
}

const commentSchema: Schema<IComment> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    onModel: {
      type: String,
      required: true,
      enum: ['TravelPlan', 'Post'],
    },
  },
  { timestamps: true, collection: 'comments' },
);

// Index để tìm kiếm bình luận theo nội dung được bình luận
commentSchema.index({ targetId: 1, onModel: 1 });

const Comment: Model<IComment> = model<IComment>('Comment', commentSchema);
export default Comment;