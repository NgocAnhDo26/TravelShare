import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import CommentService from '../services/comment.service';
import { LikeService } from '../services/like.service';
import { NotificationService } from '../services/notification.service';
import TravelPlan from '../models/travelPlan.model';
import Post from '../models/post.model';
import Comment from '../models/comment.model';
import User from '../models/user.model';

// Define a type for the async handler function
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;

const asyncHandler = (fn: AsyncHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Helper function to extract mentions from comment content
const extractMentions = (content: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
};

const CommentController = {
  getCommentsForTarget: asyncHandler(async (req: Request, res: Response) => {
    const { id: targetId } = req.params;
    const { onModel } = (req as any);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;

    const result = await CommentService.getCommentsForTarget(targetId, onModel, page, limit);
    res.status(200).json(result);
  }),

  getRepliesForComment: asyncHandler(async (req: Request, res: Response) => {
      const { commentId } = req.params;
      const replies = await CommentService.getRepliesForComment(commentId);
      res.status(200).json(replies);
  }),

  addComment: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user as string;
    const { id: targetId } = req.params;
    const { onModel } = (req as any);
    const { content, parentId, fileUrl: imageUrl } = req.body;

    const newComment = await CommentService.addComment(userId, targetId, onModel, { content, parentId, imageUrl });
    
    if (!newComment) {
      return res.status(400).json({ message: 'Failed to create comment' });
    }
    
    // Create notifications
    try {
      if (parentId) {
        // This is a reply to a comment
        const parentComment = await Comment.findById(parentId).select('user');
        if (parentComment && parentComment.user.toString() !== userId) {
          await NotificationService.createNotification({
            recipient: parentComment.user.toString(),
            actor: userId,
            type: 'reply_comment',
            target: { comment: parentId }
          }, req.io);
        }
      } else {
        // This is a comment on a plan or post
        let contentOwnerId: string | null = null;
        
        if (onModel === 'TravelPlan') {
          const plan = await TravelPlan.findById(targetId).select('author');
          contentOwnerId = plan?.author?.toString() || null;
        } else if (onModel === 'Post') {
          const post = await Post.findById(targetId).select('authorID');
          contentOwnerId = post?.authorID || null;
        }

        // Only create notification if the content owner is different from the commenter
        if (contentOwnerId && contentOwnerId !== userId) {
          const notificationType = onModel === 'TravelPlan' ? 'comment_plan' : 'comment_post';
          const targetField = onModel === 'TravelPlan' ? { plan: targetId } : { post: targetId };
          
          await NotificationService.createNotification({
            recipient: contentOwnerId,
            actor: userId,
            type: notificationType,
            target: targetField
          }, req.io);
        }
      }

      // Handle mentions in the comment
      const mentions = extractMentions(content || '');
      if (mentions.length > 0) {
        const mentionedUsers = await User.find({ username: { $in: mentions } }).select('_id').lean();
        
        for (const mentionedUser of mentionedUsers) {
          const mentionedUserId = mentionedUser._id.toString();
          if (mentionedUserId !== userId) {
            await NotificationService.createNotification({
              recipient: mentionedUserId,
              actor: userId,
              type: 'mention_in_comment',
              target: { comment: newComment._id }
            }, req.io);
          }
        }
      }
    } catch (notificationError) {
      console.error('Failed to create comment notification:', notificationError);
      // Don't fail the comment operation if notification creation fails
    }

    res.status(201).json(newComment);
  }),

  updateComment: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user as string;
    const { commentId } = req.params;
    const { content } = req.body;

    const updatedComment = await CommentService.updateComment(commentId, userId, content);
    res.status(200).json(updatedComment);
  }),

  deleteComment: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user as string;
    const { commentId } = req.params;
    
    await CommentService.deleteComment(commentId, userId);
    res.status(200).json({ message: 'Comment deleted successfully.' });
  }),

  toggleLike: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user as string;
    const { commentId } = req.params;

    if (!Types.ObjectId.isValid(commentId)) {
        return res.status(400).json({ message: 'Invalid commentId.' });
    }
    
    const updatedComment = await CommentService.toggleLike(commentId, userId);
    
    // Create notification for comment like
    try {
      const comment = await Comment.findById(commentId).select('user');
      if (comment && comment.user.toString() !== userId) {
        await NotificationService.createNotification({
          recipient: comment.user.toString(),
          actor: userId,
          type: 'like_comment',
          target: { comment: commentId }
        }, req.io);
      }
    } catch (notificationError) {
      console.error('Failed to create comment like notification:', notificationError);
      // Don't fail the like operation if notification creation fails
    }
    
    res.status(200).json(updatedComment);
  }),
  
  getCommentLikers: asyncHandler(async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!Types.ObjectId.isValid(commentId)) {
        return res.status(400).json({ message: 'Invalid commentId.' });
    }

    const users = await LikeService.getUsersWhoLiked({
      targetId: new Types.ObjectId(commentId),
      onModel: 'Comment',
      page,
      limit
    });

    res.status(200).json({ users });
  })
};

export default CommentController;