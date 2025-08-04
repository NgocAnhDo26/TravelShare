import React, { useState, useEffect, type FormEvent } from 'react';
import API from '@/utils/axiosInstance';
import type { IComment } from '@/types/comment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Heart, User as UserIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import CommentItem from '@/components/CommentItem';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useLikeToggle } from '@/hooks/useLikeToggle';

interface AuthUser {
  _id?: string;
  userId?: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

interface SocialSectionProps {
  targetId: string;
  onModel: 'TravelPlan' | 'Post';
  initialLikesCount: number;
  initialCommentsCount: number;
  initialIsLiked?: boolean;
  currentUser?: AuthUser | null;
}

const SocialSection: React.FC<SocialSectionProps> = ({
  targetId,
  onModel,
  initialLikesCount,
  initialCommentsCount,
  initialIsLiked = false,
  currentUser,
}) => {
  const [comments, setComments] = useState<IComment[]>([]);
  const [commentCount, setCommentCount] = useState(initialCommentsCount);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Determine the API path based on the model
  const apiPath = onModel === 'TravelPlan' ? '/plans' : '/posts';

  // Use the like toggle hook for like functionality
  const { isLiked, likesCount, handleToggleLike } = useLikeToggle({
    targetId,
    initialIsLiked,
    initialLikesCount,
    onModel,
    apiPath,
  });

  useEffect(() => {
    const fetchComments = async () => {
      if (!targetId || !onModel) return;
      try {
        const response = await API.get<IComment[]>('/comments', {
          params: { targetId, onModel },
        });
        setComments(response.data);
        setCommentCount(response.data.length);
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      }
    };
    fetchComments();
  }, [targetId, onModel]);

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!currentUser) {
      alert('Please log in to post a comment.');
      return;
    }

    setIsPosting(true);
    try {
      const response = await API.post<IComment>('/comments', {
        content: newComment,
        targetId,
        onModel,
      });
      setComments((prev) => [response.data, ...prev]);
      setCommentCount((prev) => prev + 1);
      setNewComment('');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'error' in error.response.data &&
        typeof error.response.data.error === 'string'
          ? error.response.data.error
          : 'Could not post comment. Please try again.';
      alert(errorMessage);
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteComment = (commentId: string) => async () => {
    const originalComments = [...comments];
    setComments((prev) => prev.filter((c) => c._id !== commentId));
    setCommentCount((prev) => prev - 1);

    try {
      await API.delete(`/comments/${commentId}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'error' in error.response.data &&
        typeof error.response.data.error === 'string'
          ? error.response.data.error
          : 'Failed to delete comment.';
      alert(errorMessage);
      setComments(originalComments);
      setCommentCount((prev) => prev + 1);
    }
  };

  const currentUserId = currentUser?._id || currentUser?.userId;

  return (
    <Card className='flex flex-col gap-2 mt-4 border shadow-sm py-3'>
      <div className='flex items-center gap-4 mx-4'>
        <Button
          variant='ghost'
          aria-label={isLiked ? 'Unlike this trip' : 'Like this trip'}
          className={`transition-colors hover:bg-red-50 focus:bg-red-50 ${
            isLiked
              ? 'text-red-600 hover:text-red-700'
              : 'text-gray-600 hover:text-red-600'
          }`}
          onClick={handleToggleLike}
        >
          <Heart
            size={18}
            className='mr-2'
            fill={isLiked ? 'currentColor' : 'none'}
          />
          <span className='font-medium'>{isLiked ? 'Liked' : 'Like'}</span>
        </Button>
        <Separator orientation='vertical' />
        <span className='text-sm text-gray-500'>{likesCount} likes</span>
        <span className='text-sm text-gray-500'>•</span>
        <span className='text-sm text-gray-500'>{commentCount} comments</span>
      </div>

      <Separator />

      <div className='space-y-6 px-6 py-4'>
        {comments.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            isAuthor={comment.user._id === currentUserId}
            onDelete={handleDeleteComment(comment._id)}
          />
        ))}
      </div>

      <Separator />

      <form
        className='flex items-center gap-2 px-6 my-2'
        onSubmit={handleAddComment}
      >
        <Avatar>
          {currentUser ? (
            <>
              <AvatarImage
                src={currentUser.avatarUrl || '/default-avatar.png'}
                alt={currentUser.username}
              />
              <AvatarFallback>
                {currentUser.displayName?.charAt(0).toUpperCase() ||
                  currentUser.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </>
          ) : (
            <AvatarFallback>
              <UserIcon className='h-5 w-5 text-gray-500' />
            </AvatarFallback>
          )}
        </Avatar>
        <Input
          type='text'
          className='flex-1 ml-2'
          placeholder='Add a comment...'
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={isPosting}
        />
        <Button
          type='submit'
          className='text-sm font-medium'
          disabled={isPosting || !newComment.trim()}
        >
          {isPosting ? 'Posting...' : 'Post'}
        </Button>
      </form>
    </Card>
  );
};

export default SocialSection;
