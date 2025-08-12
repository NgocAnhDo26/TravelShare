import { Request, Response } from 'express';
import PostService from '../services/post.service';

interface IPostController {
  createPost(req: Request, res: Response): Promise<void>;
  // getPost(req: Request, res: Response): Promise<void>;
  // updatePost(req: Request, res: Response): Promise<void>;
  // deletePost(req: Request, res: Response): Promise<void>;
}

const PostController: IPostController = {
  createPost: async (req: Request, res: Response) => {
    await PostService.createPost(req, res);
  },

  // Placeholder methods for future implementation
  // getPost: async (req: Request, res: Response) => {},
  // updatePost: async (req: Request, res: Response) => {},
  // deletePost: async (req: Request, res: Response) => {},
};

export default PostController;
