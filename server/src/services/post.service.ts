import { Request, Response } from 'express';
import Post from '../models/post.model'; // Assuming you have a Post model defined

interface IPostService {
  createPost(req: Request, res: Response): Promise<void>;
  // getPost(req: Request, res: Response): Promise<void>;
  // updatePost(req: Request, res: Response): Promise<void>;
  // deletePost(req: Request, res: Response): Promise<void>;
}

interface IPostData {
  title: string;
  content: string;
  privacy?: string;
  coverImageUrl?: string;
  images?: string[];
  relatedPlan?: string;
}

const PostService: IPostService = {
  createPost: async (req: Request, res: Response) => {
    // creating a post is add the post data from the request body to the database
    try {
      const postData: IPostData & { authorID: string } = {
        authorID: req.user as string,
        title: req.body.title,
        content: req.body.content,
        privacy: req.body.privacy || 'public',
        coverImageUrl: req.body.coverImageUrl, // Get cover image URL from req.body.fileUrl
        images: req.body.images, // Get image URLs from req.body.images
        relatedPlan: req.body.relatedPlan || undefined,
      };

      Post.validate(postData); // Validate the post data against the model schema
      const post = new Post(postData);
      await post.save(); // Save the post to the database
      res
        .status(201)
        .json({ message: 'Post created successfully', data: post });
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      res
        .status(500)
        .json({ message: 'Internal server error', error: errorMessage });
    }
  },
};

export default PostService;
