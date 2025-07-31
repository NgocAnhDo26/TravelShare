import { Request, Response } from 'express';
import mongoose, { Model } from 'mongoose';
import Comment, { IComment } from '../models/comment.model';
import TravelPlan from '../models/travelPlan.model';
import Post from '../models/post.model';
import { Like } from '../models/like.model';

type TargetModelName = 'TravelPlan' | 'Post';

interface ICommentLean {
  _id: mongoose.Types.ObjectId;
  user: {
    _id: mongoose.Types.ObjectId;
    username: string;
    displayName: string;
    avatarUrl: string;
  };
  content: string;
  targetId: mongoose.Types.ObjectId;
  onModel: 'TravelPlan' | 'Post';
  parentId?: mongoose.Types.ObjectId;
  likesCount: number;
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CommentWithReplies extends ICommentLean {
  replies: CommentWithReplies[];
}

const TargetModelMap: Record<TargetModelName, Model<any>> = {
  TravelPlan,
  Post,
};

interface ICommentService {
    getCommentsForTarget(req: Request, res: Response): Promise<void>;
    getRepliesForComment(req: Request, res: Response): Promise<void>;
    addComment(req: Request, res: Response): Promise<void>;
    updateComment(req: Request, res: Response): Promise<void>;
    deleteComment(req: Request, res: Response): Promise<void>;
    getCommentById(commentId: string): Promise<ICommentLean | null>;
    toggleLike(req: Request, res: Response): Promise<void>;
}

const CommentService: ICommentService = {
  getCommentsForTarget: async (req: Request, res: Response): Promise<void> => {
    const { id: targetId } = req.params;
    const { onModel } = (req as any);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const skip = (page - 1) * limit;

    try {
      const comments = await Comment.find({ targetId, onModel, parentId: null })
        .populate({ path: 'user', select: 'username displayName avatarUrl _id' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IComment[]>();
      
      const totalComments = await Comment.countDocuments({ targetId, onModel, parentId: null });

      res.status(200).json({
        comments,
        totalPages: Math.ceil(totalComments / limit),
        currentPage: page,
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: 'Internal Server Error.' });
    }
  },

  getRepliesForComment: async (req: Request, res: Response): Promise<void> => {
      const { commentId } = req.params;
      try {
          const replies = await Comment.find({ parentId: commentId })
              .populate({ path: 'user', select: 'username displayName avatarUrl _id' })
              .sort({ createdAt: 'asc' })
              .lean<IComment[]>();
          res.status(200).json(replies);
      } catch (error) {
          console.error('Error fetching replies:', error);
          res.status(500).json({ error: 'Internal Server Error.' });
      }
  },

  addComment: async (req: Request, res: Response): Promise<void> => {
        const userId = req.user as string;
        const { id: targetId } = req.params;
        const { onModel } = (req as any);
        const { content, parentId, fileUrl: imageUrl } = req.body;

        if (!content && !imageUrl) {
            res.status(400).json({ error: 'Comment must have content or an image.' });
            return;
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const TargetModel = TargetModelMap[onModel as TargetModelName];
            if (!TargetModel) {
                await session.abortTransaction();
                session.endSession();
                res.status(400).json({ error: `Invalid onModel value: ${onModel}` });
                return;
            }
            const target = await TargetModel.findById(targetId).session(session);

            if (!target) {
                await session.abortTransaction();
                session.endSession();
                res.status(404).json({ error: `${onModel} not found.` });
                return;
            }
            
            const comment = new Comment({ content, targetId, onModel, user: userId, parentId, imageUrl });
            await comment.save({ session });
            
            // TRẢ LẠI LOGIC ĐẾM COMMENT GỐC CỦA BẠN
            if (parentId) {
                await Comment.updateOne({ _id: parentId }, { $inc: { replyCount: 1 } }).session(session);
            } else {
                await TargetModel.updateOne({ _id: targetId }, { $inc: { commentsCount: 1 } }).session(session);
            }

            const populatedComment = await comment.populate({ path: 'user', select: 'username displayName avatarUrl _id' });
            
            await session.commitTransaction();
            res.status(201).json(populatedComment);
        } catch (error) {
            await session.abortTransaction();
            console.error('Error adding comment:', error);
            res.status(500).json({ error: 'Internal Server Error.' });
        } finally {
            await session.endSession();
        }
    },

  updateComment: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user as string;
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ error: 'Content is required.' });
      return;
    }

    try {
      const updatedComment = await Comment.findOneAndUpdate(
        { _id: commentId, user: userId },
        { content },
        { new: true }
      ).populate({ path: 'user', select: 'username displayName avatarUrl _id' });

      if (!updatedComment) {
        res.status(404).json({ error: 'Comment not found or you do not have permission to edit.' });
        return;
      }
      res.status(200).json(updatedComment);
    } catch (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({ error: 'Internal Server Error.' });
    }
  },

  deleteComment: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user as string;
    const { commentId } = req.params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const comment = await Comment.findOne({ _id: commentId, user: userId });
        if (!comment) {
            await session.abortTransaction();
            res.status(404).json({ error: 'Comment not found or you do not have permission to delete.' });
            return;
        }

        if (comment.parentId) {
            await Comment.updateOne({ _id: comment.parentId }, { $inc: { replyCount: -1 } }).session(session);
        } else {
            const modelToUpdate = TargetModelMap[comment.onModel as TargetModelName];
            await modelToUpdate.updateOne({ _id: comment.targetId }, { $inc: { commentsCount: -(1 + comment.replyCount) } }).session(session);
        }
        
        await Comment.deleteMany({ parentId: commentId }).session(session);
        await comment.deleteOne({ session });

        await session.commitTransaction();
        res.status(200).json({ message: 'Comment deleted successfully.' });
    } catch (error) {
        await session.abortTransaction();
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Internal Server Error.' });
    } finally {
        await session.endSession();
    }
  },

  getCommentById: async (commentId: string) => {
    return Comment.findById(commentId).populate({ path: 'user', select: 'username displayName avatarUrl _id' }).lean<ICommentLean>();
  },

  toggleLike: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user as string;
    const { commentId } = req.params;
    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existingLike = await Like.findOne({ user: userId, targetId: commentId, onModel: 'Comment' }).session(session);
      
      if (existingLike) {
        await existingLike.deleteOne({ session });
        await Comment.findByIdAndUpdate(commentId, { $inc: { likesCount: -1 } }, { session });
      } else {
        await Like.create([{ user: userId, targetId: commentId, onModel: 'Comment' }], { session });
        await Comment.findByIdAndUpdate(commentId, { $inc: { likesCount: 1 } }, { session });
      }
      
      await session.commitTransaction();
      
      const updatedComment = await CommentService.getCommentById(commentId);
      res.status(200).json(updatedComment);

    } catch (error) {
      await session.abortTransaction();
      console.error('Error toggling like on comment:', error);
      res.status(500).json({ error: 'Internal Server Error.' });
    } finally {
      await session.endSession();
    }
  },
};

export default CommentService;
