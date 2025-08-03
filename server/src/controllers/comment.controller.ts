import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import CommentService from '../services/comment.service';
import { LikeService } from '../services/like.service';

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
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