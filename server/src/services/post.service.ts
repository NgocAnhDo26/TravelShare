import { Request, Response } from 'express';
import Post from '../models/post.model'; // Assuming you have a Post model defined
import { Types } from 'mongoose';
import { LikeService } from './like.service';

interface IPostService {
  createPost(req: Request, res: Response): Promise<void>;
  getPost(req: Request, res: Response): Promise<void>;
  getPostsByAuthor(req: Request, res: Response): Promise<void>;
  updatePost(req: Request, res: Response): Promise<void>;
  deletePost(req: Request, res: Response): Promise<void>;
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
        content: req.body.content, // Fixed: was req.body.body
        privacy: req.body.privacy || 'public',
        coverImageUrl: req.body.coverImageUrl, // Get cover image URL from req.body.coverImageUrl
        images: req.body.images, // Get image URLs from req.body.images
        relatedPlan: req.body.relatedPlan || undefined,
      };

      // Validate content length (strip HTML tags for validation)
      const textContent = postData.content.replace(/<[^>]*>/g, '').trim();
      if (textContent.length < 10) {
        res.status(400).json({
          message:
            'Content must be at least 10 characters (excluding HTML tags)',
          error: 'Content too short',
        });
        return;
      }

      // Convert string ids to ObjectId where necessary
      const docToCreate: any = {
        ...postData,
        author: new Types.ObjectId(postData.author),
      };
      if (docToCreate.relatedPlan) {
        docToCreate.relatedPlan = new Types.ObjectId(docToCreate.relatedPlan);
      }

      console.log('Final document to create:', docToCreate);

      const post = new Post(docToCreate);
      await post.save(); // Save the post to the database
      res
        .status(201)
        .json({ message: 'Post created successfully', data: post });
    } catch (error) {
      console.error('Error creating post:', error);

      // Log the data that was being saved for debugging
      if (error instanceof Error) {
        console.error('Validation error details:', error.message);
        if (error.name === 'ValidationError') {
          console.error('Validation error fields:', (error as any).errors);
        }
      }

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
      if (
        post.privacy === 'private' &&
        post.author._id.toString() !== currentUserId
      ) {
        res
          .status(403)
          .json({ message: 'Access denied. This post is private.' });
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
          name:
            (post.author as any).displayName || (post.author as any).username,
          profilePicture: (post.author as any).avatarUrl,
        },
      };

      res.status(200).json({
        message: 'Post retrieved successfully',
        data: postWithLikeStatus,
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

  getPostsByAuthor: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      console.log('getPostsByAuthor called with userId:', userId);
      console.log('Request user:', req.user);

      if (!userId) {
        console.log('No userId provided');
        res.status(400).json({ message: 'User ID is required' });
        return;
      }

      // Validate userId format
      if (!Types.ObjectId.isValid(userId)) {
        console.log('Invalid userId format:', userId);
        res.status(400).json({ message: 'Invalid user ID format' });
        return;
      }

      console.log('Searching for posts by author:', userId);

      // Find posts by author and populate author information
      const posts = await Post.find({ author: userId })
        .populate('author', 'username displayName avatarUrl')
        .sort({ createdAt: -1 })
        .lean();

      console.log('Found posts:', posts.length);
      console.log('Posts data:', posts);

      // Transform posts to include author ID in the correct format
      const transformedPosts = posts.map((post) => ({
        ...post,
        author: post.author._id.toString(), // Convert ObjectId to string for frontend
      }));

      // Check if current user can view private posts
      const currentUserId = req.user as string;
      const canViewPrivate = currentUserId === userId;

      console.log('Current user ID:', currentUserId);
      console.log('Can view private posts:', canViewPrivate);

      // Filter posts based on privacy settings
      const filteredPosts = transformedPosts.filter((post) => {
        if (post.privacy === 'public') return true;
        if (post.privacy === 'private' && canViewPrivate) return true;
        return false;
      });

      console.log('Filtered posts count:', filteredPosts.length);
      console.log('Sending response with data:', filteredPosts);

      res.status(200).json({
        message: 'Posts retrieved successfully',
        data: filteredPosts,
      });
    } catch (error) {
      console.error('Error retrieving posts by author:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      res
        .status(500)
        .json({ message: 'Internal server error', error: errorMessage });
    }
  },

  updatePost: async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const currentUserId = req.user as string;

      if (!Types.ObjectId.isValid(postId)) {
        res.status(400).json({ message: 'Invalid post ID format' });
        return;
      }

      // Find the post and check ownership
      const post = await Post.findById(postId);
      if (!post) {
        res.status(404).json({ message: 'Post not found' });
        return;
      }

      // Check if the current user is the author of the post
      if (post.author.toString() !== currentUserId) {
        res.status(403).json({ message: 'You can only edit your own posts' });
        return;
      }

      // Validate content length (strip HTML tags for validation)
      if (req.body.content) {
        const textContent = req.body.content.replace(/<[^>]*>/g, '').trim();
        if (textContent.length < 10) {
          res.status(400).json({
            message:
              'Content must be at least 10 characters (excluding HTML tags)',
            error: 'Content too short',
          });
          return;
        }
      }

      // Update the post
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        {
          title: req.body.title,
          content: req.body.content,
          privacy: req.body.privacy,
          relatedPlan: req.body.relatedPlan,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true },
      ).populate('author', 'username displayName avatarUrl');

      res.status(200).json({
        message: 'Post updated successfully',
        data: updatedPost,
      });
    } catch (error) {
      console.error('Error updating post:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      res
        .status(500)
        .json({ message: 'Internal server error', error: errorMessage });
    }
  },

  deletePost: async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const currentUserId = req.user as string;

      if (!Types.ObjectId.isValid(postId)) {
        res.status(400).json({ message: 'Invalid post ID format' });
        return;
      }

      // Find the post and check ownership
      const post = await Post.findById(postId);
      if (!post) {
        res.status(404).json({ message: 'Post not found' });
        return;
      }

      // Check if the current user is the author of the post
      if (post.author.toString() !== currentUserId) {
        res.status(403).json({ message: 'You can only delete your own posts' });
        return;
      }

      // Delete the post
      await Post.findByIdAndDelete(postId);

      res.status(200).json({
        message: 'Post deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      res
        .status(500)
        .json({ message: 'Internal server error', error: errorMessage });
    }
  },
};

export default PostService;
