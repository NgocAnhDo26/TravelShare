import { Request, Response } from 'express';
import mongoose, { Model } from 'mongoose';
import Comment from '../models/comment.model';
import TravelPlan, { ITravelPlan } from '../models/travelPlan.model';
import Post, { IPost } from '../models/post.model';

type TargetModelName = 'TravelPlan' | 'Post';

const TargetModelMap: Record<TargetModelName, Model<ITravelPlan> | Model<IPost>> = {
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

    if (!Object.keys(TargetModelMap).includes(onModel)) {
      res.status(400).json({ error: 'Invalid onModel. Must be "TravelPlan" or "Post".' });
      return;
    }

    try {
    
      switch (onModel) {
        case 'TravelPlan': {
          const target = await TravelPlan.findById(targetId);
          if (!target) {
            res.status(404).json({ error: 'TravelPlan not found.' });
            return;
          }
          
          await TravelPlan.findByIdAndUpdate(targetId, { $inc: { commentsCount: 1 } });
          break;
        }
        case 'Post': {
          const target = await Post.findById(targetId);
          if (!target) {
            res.status(404).json({ error: 'Post not found.' });
            return;
          }
       
          await Post.findByIdAndUpdate(targetId, { $inc: { commentsCount: 1 } });
          break;
        }
      }

      const newComment = new Comment({ content, targetId, onModel, user: userId });
      await newComment.save();

      const populatedComment = await newComment.populate({
        path: 'user',
        select: 'username displayName avatarUrl _id',
      });

      res.status(201).json(populatedComment);
      return;
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ error: 'Internal Server Error.' });
      return;
    }
  },

  
  deleteComment: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user as string;
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      res.status(400).json({ error: 'Invalid comment ID.' });
      return;
    }

    try {
      const comment = await Comment.findById(commentId);
      if (!comment) {
        res.status(404).json({ error: 'Comment not found.' });
        return;
      }

      if (comment.user.toString() !== userId) {
        res.status(403).json({ error: 'Forbidden. You do not have permission to delete this comment.' });
        return;
      }

      await comment.deleteOne();

    
      switch (comment.onModel) {
        case 'TravelPlan':
          await TravelPlan.findByIdAndUpdate(comment.targetId, { $inc: { commentsCount: -1 } });
          break;
        case 'Post':
          await Post.findByIdAndUpdate(comment.targetId, { $inc: { commentsCount: -1 } });
          break;
      }

      res.status(200).json({ message: 'Comment deleted successfully.' });
      return;
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ error: 'Internal Server Error.' });
      return;
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
