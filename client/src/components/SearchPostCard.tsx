import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Calendar, FileText } from 'lucide-react';
import type { SearchPost } from '@/types/search';

interface SearchPostCardProps {
  post: SearchPost;
  onClick?: () => void;
}

const SearchPostCard: React.FC<SearchPostCardProps> = ({ post, onClick }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  };

  return (
    <Card
      className='cursor-pointer hover:shadow-md transition-shadow'
      onClick={onClick}
    >
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <Badge className='bg-blue-100 text-blue-800'>
            <FileText className='h-3 w-3 mr-1' />
            Post
          </Badge>
          {post.relatedPlan && (
            <Badge variant='outline' className='text-xs'>
              Related to: {post.relatedPlan.title}
            </Badge>
          )}
        </div>
        <CardTitle className='text-lg line-clamp-2'>{post.title}</CardTitle>
      </CardHeader>

      <CardContent>
        <p className='text-sm text-muted-foreground mb-4 line-clamp-3'>
          {truncateContent(post.content)}
        </p>

        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center space-x-2'>
            <Avatar className='h-6 w-6'>
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
            <span className='text-sm text-muted-foreground'>
              {post.author.displayName || post.author.username}
            </span>
          </div>

          <div className='flex items-center space-x-3 text-sm text-muted-foreground'>
            <div className='flex items-center'>
              <Heart className='h-4 w-4 mr-1' />
              {post.likesCount}
            </div>
            <div className='flex items-center'>
              <MessageCircle className='h-4 w-4 mr-1' />
              {post.commentsCount}
            </div>
          </div>
        </div>

        <div className='flex items-center justify-between text-xs text-muted-foreground'>
          <div className='flex items-center'>
            <Calendar className='h-3 w-3 mr-1' />
            {formatDate(post.createdAt)}
          </div>
          {post.relatedPlan && (
            <div className='text-xs text-blue-600'>
              → {post.relatedPlan.destination.name}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchPostCard;
