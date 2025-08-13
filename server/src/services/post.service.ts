import { Request, Response } from 'express';
import Post from '../models/post.model'; // Assuming you have a Post model defined
import { Types } from 'mongoose';
import { LikeService } from './like.service';

interface IPostService {
  createPost(req: Request, res: Response): Promise<void>;
  getPost(req: Request, res: Response): Promise<void>;
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

interface PopulatedAuthor {
  _id: Types.ObjectId;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

interface PopulatedPost {
  _id: Types.ObjectId;
  title: string;
  content: string;
  coverImageUrl?: string;
  images?: string[];
  author: PopulatedAuthor;
  privacy: 'public' | 'private';
  relatedPlan?: Types.ObjectId;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostService: IPostService = {
  createPost: async (req: Request, res: Response) => {
    // creating a post is add the post data from the request body to the database
    try {
      const postData: IPostData & { author: string } = {
        author: req.user as string,
        title: req.body.title,
        content: req.body.body,
        privacy: req.body.privacy || 'public',
        coverImageUrl: req.body.coverImageUrl, // Get cover image URL from req.body.fileUrl
        images: req.body.images, // Get image URLs from req.body.images
        relatedPlan: req.body.relatedPlan || undefined,
      };

      // Convert string ids to ObjectId where necessary
      const docToCreate: any = {
        ...postData,
        author: new Types.ObjectId(postData.author),
      };
      if (docToCreate.relatedPlan) {
        docToCreate.relatedPlan = new Types.ObjectId(docToCreate.relatedPlan);
      }

      const post = new Post(docToCreate);
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

  getPost: async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      
      if (!postId) {
        res.status(400).json({ message: 'Post ID is required' });
        return;
      }

      // Validate postId format
      if (!Types.ObjectId.isValid(postId)) {
        res.status(400).json({ message: 'Invalid post ID format' });
        return;
      }

      // Find the post and populate author information
      const post = await Post.findById(postId)
        .populate('author', 'username displayName avatarUrl')
        .populate('relatedPlan', 'title destination')
        .lean();

      if (!post) {
        res.status(404).json({ message: 'Post not found' });
        return;
      }

      // Check if the current user can view this post
      const currentUserId = req.user as string;
      if (post.privacy === 'private' && post.author._id.toString() !== currentUserId) {
        res.status(403).json({ message: 'Access denied. This post is private.' });
        return;
      }

      // Check if user has liked this post
      let isLiked = false;
      if (currentUserId) {
        isLiked = await LikeService.isLiked({
          userId: new Types.ObjectId(currentUserId),
          targetId: new Types.ObjectId(postId),
          onModel: 'Post',
        });
      }

      // Add isLiked to the response
      const postWithLikeStatus = {
        ...post,
        isLiked,
        author: {
          _id: post.author._id,
          name: (post.author as any).displayName || (post.author as any).username,
          profilePicture: (post.author as any).avatarUrl,
        },
      };

      res.status(200).json({ 
        message: 'Post retrieved successfully', 
        data: postWithLikeStatus 
      });
    } catch (error) {
      console.error('Error retrieving post:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      res
        .status(500)
        .json({ message: 'Internal server error', error: errorMessage });
    }
  },
};

export default PostService;
