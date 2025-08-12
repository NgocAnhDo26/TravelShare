import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '@/utils/axiosInstance';
import toast from 'react-hot-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';

interface User {
  _id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isFollowing?: boolean;
}

interface LikerListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  onModel: 'TravelPlan' | 'Post';
}

const LikerListDialog: React.FC<LikerListDialogProps> = ({
  isOpen,
  onClose,
  targetId,
  onModel,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const apiPrefix = onModel === 'TravelPlan' ? '/plans' : '/posts';

  const fetchLikers = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (!targetId) return;

      setLoading(true);
      const startTime = Date.now();

      try {
        const response = await API.get(`${apiPrefix}/${targetId}/likes`, {
          params: { page: pageNum, limit: 20 },
        });

        // The controller wraps the payload in a `users` object
        const data = response.data.users;
        const newUsers = data.users || [];

        // Ensure smooth transition
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < 500) {
          await new Promise((resolve) => setTimeout(resolve, 500 - elapsedTime));
        }

        setUsers((prev) => (append ? [...prev, ...newUsers] : newUsers));
        setHasMore(pageNum < data.totalPages);
        setPage(pageNum);
      } catch (error) {
        console.error(`Error fetching likers:`, error);
        toast.error(`Failed to fetch likers`);
      } finally {
        setLoading(false);
      }
    },
    [targetId, apiPrefix],
  );

  const handleFollowToggle = async (targetUserId: string) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      const userToUpdate = users.find((u) => u._id === targetUserId);
      if (!userToUpdate) return;

      if (userToUpdate.isFollowing) {
        await API.delete(`/users/${targetUserId}/unfollow`);
        setUsers((prev) =>
          prev.map((u) => (u._id === targetUserId ? { ...u, isFollowing: false } : u)),
        );
        toast.success('Unfollowed successfully');
      } else {
        await API.post(`/users/${targetUserId}/follow`);
        setUsers((prev) =>
          prev.map((u) => (u._id === targetUserId ? { ...u, isFollowing: true } : u)),
        );
        toast.success('Followed successfully');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    }
  };
  
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchLikers(page + 1, true);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setUsers([]);
      setPage(1);
      setHasMore(true);
      fetchLikers(1);
    }
  }, [isOpen, fetchLikers]);

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-md max-h-[80vh] overflow-hidden flex flex-col'>
        <DialogHeader className='pb-4 border-b'>
          <DialogTitle className='flex items-center gap-2'>
            <Heart className='w-5 h-5' />
            Likes
          </DialogTitle>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto p-2'>
          {loading && users.length === 0 ? (
            <div className='space-y-2'>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className='flex items-center justify-between py-1'>
                  <div className='flex items-center gap-3 flex-1'>
                    <Skeleton className='w-10 h-10 rounded-full' />
                    <div className='flex-1 space-y-2'>
                      <Skeleton className='h-4 w-24' />
                      <Skeleton className='h-3 w-16' />
                    </div>
                  </div>
                  <Skeleton className='w-20 h-9 rounded-md' />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>No one has liked this yet.</div>
          ) : (
            <div className='space-y-1'>
              {users.map((userItem) => (
                <div key={userItem._id} className='flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded-lg transition-colors'>
                  <div className='flex items-center gap-3 flex-1 cursor-pointer' onClick={() => handleUserClick(userItem._id)}>
                    <Avatar className='w-10 h-10'>
                      <AvatarImage src={userItem.avatarUrl} alt={userItem.username} />
                      <AvatarFallback>{userItem.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium text-gray-900 truncate'>{userItem.displayName || userItem.username}</p>
                      <p className='text-sm text-gray-500 truncate'>@{userItem.username}</p>
                    </div>
                  </div>
                  {currentUser && currentUser.userId !== userItem._id && (
                    <Button size='sm' variant={userItem.isFollowing ? 'outline' : 'default'} onClick={() => handleFollowToggle(userItem._id)} className='ml-2 w-20 flex-shrink-0'>
                      {userItem.isFollowing ? 'Unfollow' : 'Follow'}
                    </Button>
                  )}
                </div>
              ))}
              {hasMore && (
                <div className='text-center pt-4'>
                  <Button variant='outline' onClick={loadMore} disabled={loading} className='w-full'>
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LikerListDialog;