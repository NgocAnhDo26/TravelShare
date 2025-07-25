import { Request, Response } from 'express';
import CommentService from '../services/comment.service';

interface ICommentController {
  addComment(req: Request, res: Response): Promise<void>;
  deleteComment(req: Request, res: Response): Promise<void>;
  getCommentsForTarget(req: Request, res: Response): Promise<void>;
}

const CommentController: ICommentController = {
  addComment: async (req: Request, res: Response) => {
    await CommentService.addComment(req, res);
  },

  deleteComment: async (req: Request, res: Response) => {
    await CommentService.deleteComment(req, res);
  },

  getCommentsForTarget: async (req: Request, res: Response) => {
    await CommentService.getCommentsForTarget(req, res);
  },
};

export default CommentController;
