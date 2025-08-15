import type { IPerson } from '@/types/discovery';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, UserMinus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import API from '@/utils/axiosInstance';
import { toast } from 'react-hot-toast';
import { useState, useCallback } from 'react';

interface PersonItemProps {
  person: IPerson & { isFollowing?: boolean };
}

const PersonItem: React.FC<PersonItemProps> = ({ person }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState<boolean>(!!person.isFollowing);
  const [counts, setCounts] = useState({
    followerCount: person.followerCount,
    followingCount: person.followingCount,
  });

  const goProfile = useCallback(() => {
    navigate(`/profile/${person._id}`);
  }, [navigate, person._id]);

  const onFollowToggle = useCallback(async () => {
    if (!user) {
      toast.error('Please login to follow users');
      navigate('/login');
      return;
    }
    if (user.userId === person._id) return; // no-op on self

    try {
      if (isFollowing) {
        await API.delete(`/users/${person._id}/unfollow`);
        setIsFollowing(false);
        setCounts((c) => ({
          ...c,
          followerCount: Math.max(0, c.followerCount - 1),
        }));
        toast.success('Unfollowed');
      } else {
        await API.post(`/users/${person._id}/follow`);
        setIsFollowing(true);
        setCounts((c) => ({ ...c, followerCount: c.followerCount + 1 }));
        toast.success('Followed');
      }
    } catch (e) {
      console.error('Follow toggle failed', e);
      toast.error('Failed to update follow status');
    }
  }, [user, navigate, isFollowing, person._id]);

  return (
    <Card className='w-full'>
      <CardHeader className='pb-3'>
        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={goProfile}
            className='rounded-full focus:outline-none focus:ring-2 focus:ring-primary'
          >
            <Avatar className='h-12 w-12'>
              <AvatarImage
                src={person.avatarUrl}
                alt={person.displayName || person.username}
              />
              <AvatarFallback>
                {(person.displayName || person.username)
                  .charAt(0)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-1'>
              <button
                type='button'
                onClick={goProfile}
                className='font-semibold text-left hover:underline'
              >
                {person.displayName || person.username}
              </button>
              <button
                type='button'
                onClick={goProfile}
                className='text-muted-foreground text-sm hover:underline'
              >
                @{person.username}
              </button>
            </div>
            <div className='flex items-center gap-4 text-sm text-muted-foreground'>
              <div className='flex items-center gap-1'>
                <Users className='h-3 w-3' />
                <span>{counts.followerCount} followers</span>
              </div>
              <div className='flex items-center gap-1'>
                <UserPlus className='h-3 w-3' />
                <span>{counts.followingCount} following</span>
              </div>
            </div>
          </div>
          {user && user.userId !== person._id && (
            <Button
              variant={isFollowing ? 'default' : 'outline'}
              size='sm'
              className='ml-auto'
              onClick={(e) => {
                e.stopPropagation();
                onFollowToggle();
              }}
            >
              {isFollowing ? (
                <>
                  <UserMinus className='h-4 w-4 mr-1' /> Unfollow
                </>
              ) : (
                <>
                  <UserPlus className='h-4 w-4 mr-1' /> Follow
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      {person.bio && (
        <CardContent className='pt-0'>
          <p className='text-muted-foreground text-sm'>{person.bio}</p>
        </CardContent>
      )}
    </Card>
  );
};

export default PersonItem;
