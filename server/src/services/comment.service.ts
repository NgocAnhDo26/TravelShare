import { Request, Response } from 'express';
import mongoose, { Model } from 'mongoose';
import Comment from '../models/comment.model';
import TravelPlan, { ITravelPlan } from '../models/travelPlan.model';
import Post, { IPost } from '../models/post.model';

type TargetModelName = 'TravelPlan' | 'Post';


const TargetModelMap: Record<TargetModelName, Model<any>> = {
    TravelPlan,
    Post,
};

interface ICommentService {
    addComment(req: Request, res: Response): Promise<void>;
    deleteComment(req: Request, res: Response): Promise<void>;
    getCommentsForTarget(req: Request, res: Response): Promise<void>;
}

const CommentService: ICommentService = {

    addComment: async (req: Request, res: Response): Promise<void> => {
        const userId = req.user as string;
        const { content, targetId, onModel } = req.body as { content: string, targetId: string, onModel: TargetModelName };

        if (!content || !targetId || !onModel) {
            res.status(400).json({ error: 'Content, targetId, and onModel are required.' });
            return;
        }

        if (!TargetModelMap[onModel]) {
            res.status(400).json({ error: 'Invalid onModel. Must be "TravelPlan" or "Post".' });
            return;
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const TargetModel = TargetModelMap[onModel];

            const target = await TargetModel.findByIdAndUpdate(
                targetId,
                { $inc: { commentsCount: 1 } },
                { new: true, session }
            );

            if (!target) {
                await session.abortTransaction();
                res.status(404).json({ error: `${onModel} not found.` });
                return;
            }

            const comment = new Comment({ content, targetId, onModel, user: userId });
            await comment.save({ session });

            const populatedComment = await comment.populate({
                path: 'user',
                select: 'username displayName avatarUrl _id',
            });

            await session.commitTransaction();

            res.status(201).json(populatedComment);
            return;

        } catch (error) {
            await session.abortTransaction();
            console.error('Error adding comment:', error);
            res.status(500).json({ error: 'Internal Server Error.' });
            return;
        } finally {
            await session.endSession();
        }
    },

    deleteComment: async (req: Request, res: Response): Promise<void> => {
        const userId = req.user as string;
        const { commentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            res.status(400).json({ error: 'Invalid comment ID.' });
            return;
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const comment = await Comment.findOneAndDelete(
                { _id: commentId, user: userId },
                { session }
            );

            if (!comment) {
                await session.abortTransaction();
                res.status(404).json({ error: 'Comment not found or you do not have permission to delete.' });
                return;
            }

            const TargetModel = TargetModelMap[comment.onModel as TargetModelName];
            await TargetModel.findByIdAndUpdate(
                comment.targetId,
                { $inc: { commentsCount: -1 } },
                { session }
            );

            await session.commitTransaction();

            res.status(200).json({ message: 'Comment deleted successfully.' });
            return;
        } catch (error) {
            await session.abortTransaction();
            console.error('Error deleting comment:', error);
            res.status(500).json({ error: 'Internal Server Error.' });
            return;
        } finally {
            await session.endSession();
        }
    },

    getCommentsForTarget: async (req: Request, res: Response): Promise<void> => {
        const { targetId, onModel } = req.query as { targetId: string, onModel: TargetModelName };

        if (!targetId || !onModel) {
            res.status(400).json({ error: 'targetId and onModel are required query parameters.' });
            return;
        }

        try {
            const comments = await Comment.find({ targetId, onModel })
                .populate({
                    path: 'user',
                    select: 'username displayName avatarUrl _id',
                })
                .sort({ createdAt: -1 });

            res.status(200).json(comments);
            return;
        } catch (error) {
            console.error('Error fetching comments:', error);
            res.status(500).json({ error: 'Internal Server Error.' });
            return;
        }
    }
};

export default CommentService;