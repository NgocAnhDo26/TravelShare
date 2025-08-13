import { Request, Response } from 'express';
import PostService from '../services/post.service';

interface IPostController {
  createPost(req: Request, res: Response): Promise<void>;
  getPost(req: Request, res: Response): Promise<void>;
  getPostsByAuthor(req: Request, res: Response): Promise<void>;
  updatePost(req: Request, res: Response): Promise<void>;
  deletePost(req: Request, res: Response): Promise<void>;
}

const PostController: IPostController = {
  createPost: async (req: Request, res: Response) => {
    await PostService.createPost(req, res);
  },

  getPost: async (req: Request, res: Response) => {
    await PostService.getPost(req, res);
  },

  getPostsByAuthor: async (req: Request, res: Response) => {
    await PostService.getPostsByAuthor(req, res);
  },

  updatePost: async (req: Request, res: Response) => {
    await PostService.updatePost(req, res);
  },

  deletePost: async (req: Request, res: Response) => {
    await PostService.deletePost(req, res);
  },
};

export default PostController;
