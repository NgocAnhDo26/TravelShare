import type { IPost } from '@/types/discovery';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from '@/components/ui/button';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Loader2,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  MapPin,
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
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '@/utils/axiosInstance';
import timeAgo from '@/utils/time';
import { useLikeToggle } from '@/hooks/useLikeToggle';
import { useBookmarks } from '@/context/BookmarkContext';

interface PostItemProps {
  post: IPost;
  currentUserId?: string;
  onPostDeleted?: (postId: string) => void;
}

const PostItem: React.FC<PostItemProps> = ({
  post,
  currentUserId,
  onPostDeleted,
}) => {
  const navigate = useNavigate();
  const {
    bookmarkedIds,
    toggleBookmark,
    isLoading: isBookmarkLoading,
  } = useBookmarks();
  const isBookmarked = bookmarkedIds.has(post._id);

  const { isLiked, likesCount, pop, handleToggleLike } = useLikeToggle({
    targetId: post._id,
    initialIsLiked: !!post.isLiked,
    initialLikesCount: post.likesCount,
    onModel: 'Post',
    apiPath: '/posts',
  });

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(post._id, 'Post');
  };

  const handleDeletePost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm(
        'Are you sure you want to delete this post? This action cannot be undone.',
      )
    ) {
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
  // Convert content to a clean preview (handle TipTap JSON or HTML)
  const getPreviewText = (content: string, maxLength = 200): string => {
    const safeSlice = (t: string) =>
      t.length > maxLength ? t.slice(0, maxLength) + '…' : t;
    if (!content) return '';
    try {
      const json = JSON.parse(content);
      if (json && typeof json === 'object' && json.type === 'doc') {
        // Walk TipTap nodes to extract text
        const walk = (node: unknown): string => {
          if (!node || typeof node !== 'object') return '';
          const n = node as {
            type?: string;
            text?: string;
            content?: unknown[];
          };
          if (n.type === 'text') return n.text || '';
          if (Array.isArray(n.content)) return n.content.map(walk).join(' ');
          return '';
        };
        const text = walk(json).replace(/\s+/g, ' ').trim();
        return safeSlice(text);
      }
    } catch {
      // not JSON -> treat as HTML
    }
    const plain = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return safeSlice(plain);
  };

  const preview = getPreviewText(post.content);
  const handleViewPost = () => navigate(`/posts/${post._id}`);
  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${post.author._id}`);
  };

  const fallbackChar = (post.author.displayName || post.author.username || 'A')
    .charAt(0)
    .toUpperCase();

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/posts/${post._id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link: ', err);
      toast.error('Could not copy link.');
    }
  };

  return (
    <Card className='overflow-hidden bg-white/80 backdrop-blur-sm border-blue-50 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 text-left gap-0 pb-1'>
      <CardHeader className='pb-4'>
        <div className='flex items-center gap-3'>
          <Avatar
            onClick={handleViewProfile}
            className='cursor-pointer w-12 h-12 ring-2 ring-blue-500/20'
          >
            <AvatarImage
              src={post.author.avatarUrl}
              alt={post.author.displayName || post.author.username}
            />
            <AvatarFallback className='bg-gradient-to-br from-teal-500 to-blue-600 text-white font-semibold'>
              {fallbackChar}
            </AvatarFallback>
          </Avatar>
          <div onClick={handleViewProfile} className='flex-1 cursor-pointer'>
            <h3 className='font-semibold text-slate-800'>
              {post.author.displayName || post.author.username}
            </h3>
            <p className='text-sm text-slate-500'>@{post.author.username}</p>
          </div>
          <Badge variant='secondary' className='bg-blue-100 text-blue-700'>
            {timeAgo(post.createdAt)}
          </Badge>
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
      <CardContent className='px-6 pb-4 pt-0'>
        <div className='mb-4'>
          <h4
            className='text-xl font-bold text-slate-800 mb-1 cursor-pointer'
            onClick={handleViewPost}
          >
            {post.title}
          </h4>
          {post.relatedPlan && (
            <Link
              to={`/plans/${typeof post.relatedPlan === 'string' ? post.relatedPlan : post.relatedPlan._id}`}
              className='inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors'
            >
              <MapPin className='w-3 h-3' />
              {typeof post.relatedPlan === 'string'
                ? 'Related plan'
                : post.relatedPlan.title || 'Related plan'}
            </Link>
          )}
        </div>
        <p className='text-slate-600 mb-3 line-clamp-3'>{preview}</p>
        <div
          className='relative rounded-2xl overflow-hidden group cursor-pointer'
          onClick={handleViewPost}
        >
          <img
            src={
              post.coverImageUrl ||
              'https://placehold.co/1200x400/CCCCCC/FFFFFF?text=TravelShare'
            }
            alt={post.title}
            width={600}
            height={400}
            className='w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
          <div className='absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
            <p className='font-semibold'>{post.title}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className='flex flex-col gap-4 px-6 py-4 bg-slate-50/50'>
        <Separator />
        <div className='flex items-center justify-between w-full'>
          <div className='flex items-center gap-6'>
            <button
              type='button'
              onClick={handleToggleLike}
              onMouseDown={(e) => e.stopPropagation()}
              className='group flex items-center gap-2 px-2 py-1 rounded-full transition bg-transparent hover:bg-gray-100 active:bg-gray-200 focus:outline-none cursor-pointer active:scale-95'
              aria-label={isLiked ? 'Unlike' : 'Like'}
              tabIndex={0}
            >
              <Heart
                size={22}
                className={`transition-all duration-200 ${
                  isLiked
                    ? 'text-red-500 fill-red-500 group-hover:scale-125 group-hover:fill-red-500 group-hover:text-red-500'
                    : 'text-gray-400 fill-transparent group-hover:scale-125 group-hover:text-red-500 group-hover:fill-red-200'
                } ${pop ? 'scale-150' : ''}`}
                style={{
                  filter: isLiked ? 'drop-shadow(0 0 4px #f87171)' : undefined,
                  transition:
                    'transform 0.05s, color 0.05s, fill 0.05s, filter 0.05s',
                }}
              />
              <span className='font-medium'>{likesCount}</span>
            </button>
            <button className='flex items-center gap-2 text-slate-600 hover:text-blue-500 transition-colors duration-200 group cursor-pointer'>
              <MessageCircle className='w-5 h-5 group-hover:scale-110 transition-transform duration-200' />
              <span className='text-sm font-medium'>{post.commentsCount}</span>
            </button>
            <button
              onClick={handleShare}
              onMouseDown={(e) => e.stopPropagation()}
              className='flex items-center gap-2 text-slate-600 hover:text-green-500 transition-colors duration-200 group cursor-pointer'
            >
              <Share2 className='w-5 h-5 group-hover:scale-110 transition-transform duration-200' />
              <span className='text-sm font-medium'>Share</span>
            </button>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleToggleBookmark}
                  onMouseDown={(e) => e.stopPropagation()}
                  disabled={isBookmarkLoading}
                  className='text-slate-600 hover:text-yellow-500 transition-colors duration-200 cursor-pointer'
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
      </CardFooter>
    </Card>
  );
};

export default PostItem;
