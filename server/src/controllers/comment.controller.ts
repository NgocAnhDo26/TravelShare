import { Request, Response, NextFunction } from 'express';
import CommentService from '../services/comment.service';
import { LikeService } from '../services/like.service';
import { Types } from 'mongoose';

interface ICommentController {
    addComment(req: Request, res: Response): Promise<void>;
    deleteComment(req: Request, res: Response): Promise<void>;
    getCommentsForTarget(req: Request, res: Response): Promise<void>;
    updateComment(req: Request, res: Response): Promise<void>;
    getRepliesForComment(req: Request, res: Response): Promise<void>;
    toggleLike(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCommentLikers(req: Request, res: Response, next: NextFunction): Promise<void>;
}

const CommentController: ICommentController = {
  addComment: async (req: Request, res: Response) => {
    await CommentService.addComment(req, res);
  },
  deleteComment: async (req: Request, res: Response) => {
    await CommentService.deleteComment(req, res);
  },
  updateComment: async (req: Request, res: Response) => {
    await CommentService.updateComment(req, res);
  },
  getCommentsForTarget: async (req: Request, res: Response) => {
    await CommentService.getCommentsForTarget(req, res);
  },
  getRepliesForComment: async (req: Request, res: Response) => {
    await CommentService.getRepliesForComment(req, res);
  },
  toggleLike: async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user as string;
        const { commentId } = req.params;

        if (!Types.ObjectId.isValid(commentId)) {
            res.status(400).json({ message: 'Invalid commentId.' });
            return;
        }
        
        await CommentService.toggleLike(req, res);

    } catch (err) {
        next(err);
    }
  },
  getCommentLikers: async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { commentId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        if (!Types.ObjectId.isValid(commentId)) {
            res.status(400).json({ message: 'Invalid commentId.' });
            return;
        }

        const users = await LikeService.getUsersWhoLiked({
            targetId: new Types.ObjectId(commentId),
            onModel: 'Comment',
            page,
            limit
        });

        res.status(200).json({ users });
    } catch (err) {
        next(err);
    }
  }
};

export default CommentController;
