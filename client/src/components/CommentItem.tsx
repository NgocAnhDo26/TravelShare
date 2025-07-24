import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { IComment } from '@/types/comment';
import { formatTimeAgo } from '@/utils/formatTimeAgo';

interface CommentItemProps {
  comment: IComment;
  isAuthor: boolean;
  onDelete: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, isAuthor, onDelete }) => {
  const name = comment.user.displayName || comment.user.username;
  const message = comment.content;
  const avatarUrl = comment.user.avatarUrl;
  const fallback = name.charAt(0).toUpperCase();
  const timeAgo = formatTimeAgo(comment.createdAt);

  return (
    <div className="flex items-start gap-4 group relative">
      <Avatar>
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={name} />
        ) : (
          <AvatarFallback>{fallback}</AvatarFallback>
        )}
      </Avatar>
      <div className="flex flex-col items-start">
        <div className="flex flex-col items-start bg-gray-100 rounded-md px-3 py-2">
          <div className="text-sm font-medium">{name}</div>
          <div className="text-sm">{message}</div>
        </div>
        <div className="text-xs text-gray-500 mt-1 ml-1">{timeAgo}</div>
      </div>
      {isAuthor && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          aria-label="Delete comment"
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
        >
          <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
        </Button>
      )}
    </div>
  );
};

export default CommentItem;