import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
  MoreVertical,
  ThumbsUp,
  EyeOff,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { cn } from '@/lib/utils';
import LikesModal from './LikesModal';
import { Link } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';

interface IMention {
  _id: string;
  username: string;
}

export interface IComment {
  _id: string;
  user: {
    _id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  content: string;
  imageUrl?: string;
  likesCount: number;
  replyCount: number;
  mentions?: IMention[];
  createdAt: string;
}

export interface CommentItemProps {
  comment: IComment;
  isAuthor: boolean;
  isLiked: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onEdit: (newContent: string) => Promise<void>;
  onSetReplyTarget: () => void;
  onLike: (commentId: string) => void;
  onHide: (commentId: string) => void;
  onImageLoad?: () => void;
}

const renderContentWithMentions = (
  text: string | undefined,
  mentions: IMention[] | undefined,
) => {
  if (!text) return null;
  if (!mentions || mentions.length === 0) {
    return text;
  }

  const mentionMap = new Map(mentions.map((m) => [m.username, m._id]));
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const parts = text.split(mentionRegex);

  return (
    <>
      {parts.map((part, index) => {
        if (index % 2 === 1 && mentionMap.has(part)) {
          const userId = mentionMap.get(part);
          return (
            <Link
              to={`/profile/${userId}`}
              key={index}
              className='text-blue-600 font-semibold no-underline hover:underline'
            >
              @{part}
            </Link>
          );
        }
        return part;
      })}
    </>
  );
};

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  isAuthor,
  isLiked,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onDelete,
  onEdit,
  onSetReplyTarget,
  onLike,
  onHide,
  onImageLoad,
}) => {
  const [editedContent, setEditedContent] = useState(comment.content);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditedContent(comment.content);
    if (isSaving) {
      setIsSaving(false);
    }
  }, [comment.content, isSaving]);

  const name = comment.user.displayName || comment.user.username;
  const userId = comment.user._id;
  const avatarUrl = comment.user.avatarUrl;
  const fallback = name.charAt(0).toUpperCase();
  const timeAgo = formatTimeAgo(comment.createdAt);

  const handleEditSave = async () => {
    if (isSaving) return;

    if (editedContent.trim() && editedContent !== comment.content) {
      setIsSaving(true);
      try {
        await onEdit(editedContent);
      } catch (error) {
        console.error('Edit failed, parent will handle rollback.');
      } finally {
        setIsSaving(false);
      }
    } else {
      onCancelEdit();
    }
  };

  const handleLikeClick = () => {
    onLike(comment._id);
  };

  return (
    <div className='flex items-start gap-3'>
      <Link to={`/profile/${userId}`}>
        <Avatar className='w-9 h-9'>
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
      </Link>
      <div className='flex-1 group'>
        {isEditing ? (
          <div className='flex flex-col items-end gap-2 w-full'>
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className='min-h-[60px] max-h-[200px] resize-none w-full break-all'
              disabled={isSaving}
              autoFocus
              rows={2}
            />
            <div className='flex gap-2'>
              <Button
                size='sm'
                variant='ghost'
                onClick={onCancelEdit}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button size='sm' onClick={handleEditSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className='flex items-center gap-2'>
            <div className='w-fit max-w-full'>
              <div className='bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2 text-left min-w-[70px]'>
                <Link
                  to={`/profile/${userId}`}
                  className='text-sm font-medium hover:underline'
                >
                  {name}
                </Link>
                {comment.content && (
                  <p className='text-sm max-w-full whitespace-pre-wrap break-all'>
                    {renderContentWithMentions(
                      comment.content,
                      comment.mentions,
                    )}
                  </p>
                )}
                {comment.imageUrl && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className='mt-2'>
                        <img
                          src={comment.imageUrl}
                          alt='comment-attachment'
                          className='rounded-lg max-h-60 max-w-full cursor-pointer object-cover'
                          onLoad={onImageLoad}
                        />
                      </div>
                    </DialogTrigger>
                    <DialogContent className='p-0 max-w-4xl w-auto bg-transparent border-none'>
                      <img
                        src={comment.imageUrl}
                        alt='comment-attachment'
                        className='max-h-[90vh] w-auto rounded-lg object-contain'
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-full'
                >
                  <MoreVertical className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {isAuthor ? (
                  <>
                    <DropdownMenuItem onClick={onStartEdit}>
                      <Pencil className='mr-2 h-4 w-4' />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={onDelete}
                      className='text-red-500 focus:text-red-500'
                    >
                      <Trash2 className='mr-2 h-4 w-4' />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={() => onHide(comment._id)}>
                    <EyeOff className='mr-2 h-4 w-4' />
                    <span>Hide comment</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        <div className='flex items-center gap-4 text-xs mt-1 ml-3'>
          <span>{timeAgo}</span>
          <button
            onClick={handleLikeClick}
            className={cn(
              'font-semibold hover:underline',
              isLiked ? 'text-blue-600' : 'text-gray-500',
            )}
          >
            Like
          </button>
          <button
            onClick={onSetReplyTarget}
            className='font-semibold text-gray-500 hover:underline'
          >
            Reply
          </button>
          {comment.likesCount > 0 && (
            <LikesModal targetId={comment._id} onModel='Comment'>
              <div className='flex items-center gap-1 cursor-pointer'>
                <ThumbsUp className='w-4 h-4 text-white bg-blue-600 rounded-full p-0.5' />
                <span className='font-semibold text-gray-500'>
                  {comment.likesCount}
                </span>
              </div>
            </LikesModal>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;