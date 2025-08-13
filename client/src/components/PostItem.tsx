import type { IPost } from '@/types/discovery';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark, 
  Loader2, 
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/dropdown-menu';

import { useBookmarks } from '@/context/BookmarkContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '@/utils/axiosInstance';

interface PostItemProps {
  post: IPost;
  currentUserId?: string;
  onPostDeleted?: (postId: string) => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, currentUserId, onPostDeleted }) => {
  const navigate = useNavigate();
  const {
    bookmarkedIds,
    toggleBookmark,
    isLoading: isBookmarkLoading,
  } = useBookmarks();
  const isBookmarked = bookmarkedIds.has(post._id);
  
  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(post._id, 'Post');
  };

  const handleDeletePost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await API.delete(`/posts/${post._id}`);
        toast.success('Post deleted successfully');
        onPostDeleted?.(post._id);
      } catch (error) {
        console.error('Error deleting post:', error);
        toast.error('Failed to delete post');
      }
    }
  };

  const isAuthor = currentUserId && post.author._id === currentUserId;
  return (
    <Card className='w-full'>
      <CardHeader className='pb-3'>
        <div className='flex items-center gap-3'>
          <Avatar className='h-10 w-10'>
            <AvatarImage
              src={post.author.avatarUrl}
              alt={post.author.displayName || post.author.username}
            />
            <AvatarFallback>
              {(post.author.displayName || post.author.username)
                .charAt(0)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1'>
            <div className='flex items-center gap-2'>
              <span className='font-semibold text-sm'>
                {post.author.displayName || post.author.username}
              </span>
              <span className='text-muted-foreground text-sm'>
                @{post.author.username}
              </span>
            </div>
            <span className='text-muted-foreground text-xs'>
              {formatTimeAgo(post.createdAt)}
            </span>
          </div>
          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size='icon'
                  variant='ghost'
                  className='w-7 h-7'
                  onClick={(e) => e.stopPropagation()}
                >
                  <EllipsisVerticalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/posts/${post._id}/edit`);
                  }}
                >
                  <PencilIcon className='w-4 h-4 mr-2' />
                  Edit post
                </DropdownMenuItem>
                <DropdownMenuItem
                  className='text-red-600 focus:text-red-700'
                  onClick={handleDeletePost}
                >
                  <TrashIcon className='w-4 h-4 mr-2 text-red-600' />
                  Delete post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        <h3 className='font-semibold text-lg mb-2'>{post.title}</h3>
        <p className='text-muted-foreground text-sm mb-4 line-clamp-3'>
          {post.content}
        </p>

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <button className='flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer'>
              <Heart className='h-4 w-4' />
              <span className='text-sm'>{post.likesCount}</span>
            </button>
            <button className='flex items-center gap-1 text-muted-foreground hover:text-blue-500 transition-colors cursor-pointer'>
              <MessageCircle className='h-4 w-4' />
              <span className='text-sm'>{post.commentsCount}</span>
            </button>
            <button className='flex items-center gap-1 text-muted-foreground hover:text-green-500 transition-colors cursor-pointer'>
              <Share className='h-4 w-4' />
            </button>
          </div>

          {post.relatedPlan && (
            <Badge variant='secondary' className='text-xs'>
              Related Plan
            </Badge>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleToggleBookmark}
                  onMouseDown={(e) => e.stopPropagation()}
                  disabled={isBookmarkLoading}
                  className='text-slate-600 hover:text-yellow-500 transition-colors duration-200 cursor-pointer disabled:cursor-wait'
                >
                  {isBookmarkLoading ? (
                    <Loader2 className='w-5 h-5 animate-spin' />
                  ) : (
                    <Bookmark
                      className={`w-5 h-5 hover:scale-110 transition-transform duration-200 ${isBookmarked ? 'fill-yellow-400 text-yellow-500' : 'fill-transparent'}`}
                    />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isBookmarked ? 'Remove from saved' : 'Save it'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostItem;
