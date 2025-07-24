import { Schema, model, Model, Document, Types } from 'mongoose';

/**
 *Interface for a Comment document
 */
export interface IComment extends Document {
    /** User who created the comment */
    user: Types.ObjectId;
    /** Content of the comment */
    content: string;
    /** ID of the commented content (TravelPlan or Post) */
    targetId: Types.ObjectId;
    /** Type of the commented content model */
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

commentSchema.index({ targetId: 1, onModel: 1 });

const Comment: Model<IComment> = model<IComment>('Comment', commentSchema);
export default Comment;