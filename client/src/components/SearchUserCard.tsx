import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, UserMinus } from 'lucide-react';
import type { SearchUser } from '@/types/search';

interface SearchUserCardProps {
  user: SearchUser;
  onFollow?: (userId: string, isCurrentlyFollowing: boolean) => void;
  onViewProfile?: (userId: string) => void;
  currentUserId?: string; // Add current user ID to hide follow button for self
  isAuthenticated?: boolean; // Add authentication status
}

const SearchUserCard: React.FC<SearchUserCardProps> = ({
  user,
  onFollow,
  onViewProfile,
  currentUserId,
  isAuthenticated,
}) => {
  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFollow?.(user._id, user.isFollowing || false);
  };

  const handleViewProfile = () => {
    onViewProfile?.(user._id);
  };

  return (
    <Card
      className='cursor-pointer hover:shadow-md transition-shadow p-4'
      onClick={handleViewProfile}
    >
      <CardContent className='p-0'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center space-x-3'>
            <Avatar className='h-12 w-12'>
              <AvatarImage
                src={user.avatarUrl}
                alt={user.displayName || user.username}
              />
              <AvatarFallback className='text-lg'>
                {(user.displayName || user.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className='flex-1 min-w-0'>
              <h3 className='font-semibold text-sm truncate text-left'>
                {user.displayName || user.username}
              </h3>
              <p className='text-sm text-muted-foreground text-left'>
                @{user.username}
              </p>
            </div>
          </div>

          <Badge className='bg-green-100 text-green-800'>
            <Users className='h-3 w-3 mr-1' />
            User
          </Badge>
        </div>

        {user.bio && (
          <p className='text-sm text-muted-foreground mb-3 line-clamp-2'>
            {user.bio}
          </p>
        )}

        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4 text-sm text-muted-foreground'>
            <div>
              <span className='font-medium text-foreground'>
                {user.followerCount}
              </span>{' '}
              followers
            </div>
            <div>
              <span className='font-medium text-foreground'>
                {user.followingCount}
              </span>{' '}
              following
            </div>
          </div>

          {/* Only show follow button if user is authenticated and it's not their own profile */}
          {isAuthenticated && currentUserId !== user._id && (
            <Button
              size='sm'
              variant={user.isFollowing ? 'default' : 'outline'}
              onClick={handleFollowClick}
              className='ml-2'
            >
              {user.isFollowing ? (
                <>
                  <UserMinus className='h-4 w-4 mr-1' />
                  Unfollow
                </>
              ) : (
                <>
                  <UserPlus className='h-4 w-4 mr-1' />
                  Follow
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchUserCard;
