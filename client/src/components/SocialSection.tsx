import React, { useState, useEffect, useCallback, useRef } from 'react';
import API from '@/utils/axiosInstance';
import type { IComment } from '@/types/comment';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, User as UserIcon, ImagePlus, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import CommentThread from './CommentThread';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import CommentSkeleton from './CommentSkeleton';
import type { AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { Textarea } from '@/components/ui/textarea';

interface AuthUser {
  _id: string;
  userId?: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

interface SocialSectionProps {
  targetId: string;
  onModel: 'TravelPlan' | 'Post';
  likesCount: number;
  initialCommentsCount: number;
  isLiked: boolean;
  onToggleLike: () => void;
  currentUser?: AuthUser | null;
}

const SocialSection: React.FC<SocialSectionProps> = ({
  targetId,
  onModel,
  likesCount, // Use live prop
  initialCommentsCount,
  isLiked, // Use live prop
  onToggleLike, // Use handler from props
  currentUser,
}) => {
  const [comments, setComments] = useState<IComment[]>([]);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(
    new Set(),
  );
  const [hiddenCommentIds, setHiddenCommentIds] = useState<Set<string>>(
    new Set(),
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const targetApiPrefix = onModel === 'TravelPlan' ? '/plans' : '/posts';

  useEffect(() => {
    setCommentsCount(initialCommentsCount);
  }, [initialCommentsCount]);

  const fetchUserLikes = useCallback(
    async (commentIds: string[]) => {
      if (commentIds.length === 0 || !currentUser) return;
      try {
        const response = await API.get<string[]>(`/likes/me/targets`, {
          params: { onModel: 'Comment', targetIds: commentIds.join(',') },
        });
        setLikedCommentIds(new Set(response.data));
      } catch (error) {
        console.error("Failed to fetch user's likes", error);
      }
    },
    [currentUser],
  );

  const fetchComments = useCallback(
    async (page = 1, loadMore = false) => {
      if (isLoading && !loadMore) return;
      setIsLoading(true);
      try {
        const response = await API.get<{
          comments: IComment[];
          currentPage: number;
          totalPages: number;
        }>(`${targetApiPrefix}/${targetId}/comments`, {
          params: { page, sort: 'desc' },
        });

        setComments((prev) =>
          loadMore
            ? [...prev, ...response.data.comments]
            : response.data.comments,
        );
        setCurrentPage(response.data.currentPage);
        setTotalPages(response.data.totalPages);

        if (currentUser) {
          const allCommentIds = response.data.comments.flatMap((c) => [
            c._id,
            ...(c.replies?.map((r) => r._id) || []),
          ]);
          if (allCommentIds.length > 0) fetchUserLikes(allCommentIds);
        }
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [targetId, targetApiPrefix, currentUser, fetchUserLikes, isLoading],
  );

  useEffect(() => {
    fetchComments(1);
  }, [targetId, onModel]);

  const handleLoadMore = useCallback(() => {
    if (currentPage < totalPages && !isLoading) {
      fetchComments(currentPage + 1, true);
    }
  }, [currentPage, totalPages, isLoading, fetchComments]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: 1.0,
        rootMargin: '0px 0px 100px 0px',
      },
    );

    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observer.observe(currentLoadMoreRef);
    }

    return () => {
      if (currentLoadMoreRef) {
        observer.unobserve(currentLoadMoreRef);
      }
    };
  }, [handleLoadMore]);

  const handleAddComment = (
    formData: FormData,
  ): Promise<AxiosResponse<IComment>> => {
    return API.post(`${targetApiPrefix}/${targetId}/comments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };
  const handleFormSubmit = async () => {
    if (!newComment.trim() && !imageFile) return;
    setIsPosting(true);
    const loadingToast = toast.loading('Posting comment...');
    const formData = new FormData();
    formData.append('content', newComment);
    if (imageFile) formData.append('commentImage', imageFile);

    try {
      const response = await handleAddComment(formData);
      setComments((prev) => [response.data, ...prev]);
      setCommentsCount((prev) => prev + 1);
      setNewComment('');
      removeImage();
      toast.dismiss(loadingToast);
      toast.success('Comment posted!');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Could not post comment. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const handleDeleteComment = async (
    commentId: string,
    parentId: string | null,
  ): Promise<boolean> => {
    const confirmed = await new Promise<boolean>((resolve) =>
      toast(
        (t) => (
          <div className='flex flex-col items-center gap-4 p-2'>
            <span className='text-center font-medium'>
              Are you sure you want to delete this comment?
            </span>
            <div className='flex gap-2'>
              <Button
                variant='destructive'
                size='sm'
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
              >
                Delete
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ),
        { duration: Infinity },
      ),
    );

    if (!confirmed) return false;

    const loadingToast = toast.loading('Deleting comment...');
    try {
      await API.delete(`/comments/${commentId}`);
      toast.dismiss(loadingToast);
      toast.success('Comment deleted successfully.');

      if (parentId) {
        setComments((prevComments) =>
          prevComments.map((c) =>
            c._id === parentId
              ? { ...c, replyCount: Math.max(0, c.replyCount - 1) }
              : c,
          ),
        );
        setCommentsCount((prev) => prev - 1);
      } else {
        const commentToDelete = comments.find((c) => c._id === commentId);
        const numSubReplies = commentToDelete?.replyCount || 0;
        setCommentsCount((prev) => prev - (1 + numSubReplies));
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      }
      return true;
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to delete comment.');
      return false;
    }
  };
  const handleEditComment = async (
    commentId: string,
    content: string,
  ): Promise<void> => {
    const originalComments = [...comments];
    setComments((prevComments) =>
      prevComments.map((c) => (c._id === commentId ? { ...c, content } : c)),
    );
    try {
      await API.patch<IComment>(`/comments/${commentId}`, { content });
      toast.success('Comment updated!');
    } catch (error) {
      setComments(originalComments);
      toast.error('Failed to update comment. Changes reverted.');
      throw error;
    }
  };
  const handleLikeComment = async (commentId: string) => {
    if (!currentUser) {
      toast.error('Please log in to like comments.');
      return;
    }

    const isCurrentlyLiked = likedCommentIds.has(commentId);

    const newLikedIds = new Set(likedCommentIds);
    if (isCurrentlyLiked) {
      newLikedIds.delete(commentId);
    } else {
      newLikedIds.add(commentId);
    }
    setLikedCommentIds(newLikedIds);

    try {
      const { data: updatedComment } = await API.post<IComment>(
        `/comments/${commentId}/like`,
      );

      setComments((prevComments) => {
        const updateRecursive = (commentList: IComment[]): IComment[] => {
          return commentList.map((c) => {
            if (c._id === commentId) {
              return { ...c, likesCount: updatedComment.likesCount };
            }
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: updateRecursive(c.replies) };
            }
            return c;
          });
        };
        return updateRecursive(prevComments);
      });
    } catch (error) {
      toast.error('Action failed. Please try again.');
      setLikedCommentIds(likedCommentIds);
    }
  };
  const handleHideComment = (commentId: string) => {
    setHiddenCommentIds((prev) => new Set(prev).add(commentId));
  };
  const filterHiddenComments = (c: IComment[]) =>
    c.filter((c) => !hiddenCommentIds.has(c._id));

  return (
    <Card className='flex flex-col mt-4 py-0 border shadow-sm h-[100vh]'>
      <div className='flex-shrink-0 px-4 py-3 border-b'>
        <div className='flex items-center gap-4 mx-4'>
          <Button
            variant='ghost'
            aria-label={isLiked ? 'Unlike this trip' : 'Like this trip'}
            className={`transition-colors hover:bg-red-50 focus:bg-red-50 w-22 justify-start ${
              isLiked
                ? 'text-red-600 hover:text-red-700'
                : 'text-gray-600 hover:text-red-600'
            }`}
            onClick={onToggleLike} // Use the handler from props
          >
            <Heart
              size={18}
              className='mr-2'
              fill={isLiked ? 'currentColor' : 'none'}
            />
            <span className='font-medium'>{isLiked ? 'Liked' : 'Like'}</span>
          </Button>
          <Separator orientation='vertical' className='h-6' />
          <span className='text-sm text-gray-500'>{likesCount} likes</span>
          <span className='text-sm text-gray-500'>•</span>
          <span className='text-sm text-gray-500'>
            {commentsCount} comments
          </span>
        </div>
      </div>

     

      <div
        ref={scrollContainerRef}
        className='flex-1 space-y-6 px-4 sm:px-6 py-4 overflow-y-auto'
      >
        {filterHiddenComments(comments).map((comment) => (
          <CommentThread
            key={comment._id}
            comment={comment}
            currentUser={currentUser}
            likedCommentIds={likedCommentIds}
            hiddenCommentIds={hiddenCommentIds}
            onDelete={handleDeleteComment}
            onEdit={handleEditComment}
            onAddComment={handleAddComment}
            onLike={handleLikeComment}
            onHide={handleHideComment}
            onReplyAdded={(parentId) => {
              setCommentsCount((prev) => prev + 1);
              setComments((prevComments) =>
                prevComments.map((c) =>
                  c._id === parentId
                    ? { ...c, replyCount: c.replyCount + 1 }
                    : c,
                ),
              );
            }}
          />
        ))}
        {isLoading && comments.length === 0 && (
          <>
            <CommentSkeleton />
            <CommentSkeleton />
          </>
        )}
        <div ref={loadMoreRef} style={{ height: '1px' }} />
      </div>

      <div className='flex-shrink-0 px-4 sm:px-6 py-3 border-t'>
        <form
          className='flex flex-col gap-2'
          onSubmit={(e) => {
            e.preventDefault();
            handleFormSubmit();
          }}
        >
          <div className='flex items-start gap-2 w-full'>
            <Avatar>
              {currentUser ? (
                <>
                  <AvatarImage
                    src={currentUser.avatarUrl || ''}
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
            <div className='relative flex-1'>
              <Textarea
                placeholder='Add a comment...'
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isPosting || !currentUser}
                className='min-h-[40px] max-h-[150px] resize-none pr-10 break-all'
                rows={1}
              />
              <input
                type='file'
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept='image/*'
                className='hidden'
              />
              <Button
                type='button'
                size='icon'
                variant='ghost'
                className='absolute right-1 top-2 h-8 w-8'
                onClick={() => fileInputRef.current?.click()}
                disabled={isPosting || !currentUser}
              >
                <ImagePlus className='h-5 w-5' />
              </Button>
            </div>
            <Button
              type='submit'
              disabled={
                isPosting || (!newComment.trim() && !imageFile) || !currentUser
              }
            >
              {isPosting ? 'Posting...' : 'Post'}
            </Button>
          </div>
          {imagePreview && (
            <div className='relative w-fit self-start ml-12 mt-2'>
              <img
                src={imagePreview}
                alt='Preview'
                className='max-h-40 rounded-lg'
              />
              <button
                type='button'
                onClick={removeImage}
                className='absolute top-1 right-1 bg-gray-900/50 text-white rounded-full p-1'
              >
                <X className='h-4 w-4' />
              </button>
            </div>
          )}
        </form>
      </div>
    </Card>
  );
};

export default SocialSection;