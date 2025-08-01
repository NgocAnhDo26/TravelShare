import type { IPost } from '@/types/discovery';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share } from 'lucide-react';

interface PostItemProps {
  post: IPost;
}

const PostItem: React.FC<PostItemProps> = ({ post }) => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author.avatarUrl} alt={post.author.displayName || post.author.username} />
            <AvatarFallback>
              {(post.author.displayName || post.author.username).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                {post.author.displayName || post.author.username}
              </span>
              <span className="text-muted-foreground text-sm">@{post.author.username}</span>
            </div>
            <span className="text-muted-foreground text-xs">
              {formatTimeAgo(post.createdAt)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
          {post.content}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors">
              <Heart className="h-4 w-4" />
              <span className="text-sm">{post.likesCount}</span>
            </button>
            <button className="flex items-center gap-1 text-muted-foreground hover:text-blue-500 transition-colors">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{post.commentsCount}</span>
            </button>
            <button className="flex items-center gap-1 text-muted-foreground hover:text-green-500 transition-colors">
              <Share className="h-4 w-4" />
            </button>
          </div>
          
          {post.relatedPlan && (
            <Badge variant="secondary" className="text-xs">
              Related Plan
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PostItem; 