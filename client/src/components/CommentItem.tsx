import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

interface CommentItemProps {
  name: string;
  message: string;
  timeAgo: string;
  avatarUrl?: string;
  fallback: string;
}

const CommentItem: React.FC<CommentItemProps> = ({ name, message, avatarUrl, fallback, timeAgo }) => (
  <div className="flex items-start gap-4">
    <Avatar>
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} />
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
  </div>
);

export default CommentItem;
