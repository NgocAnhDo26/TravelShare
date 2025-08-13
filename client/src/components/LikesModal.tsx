import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import API from '@/utils/axiosInstance';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isFollowing?: boolean;
}

interface LikesModalProps {
  children: React.ReactNode;
  targetId: string;
  onModel: 'Comment' | 'TravelPlan' | 'Post';
}

const LikesModal: React.FC<LikesModalProps> = ({
  children,
  targetId,
  onModel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [likers, setLikers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const fetchLikers = useCallback(async (pageNum: number) => {
    if (!targetId) return;

    setIsLoading(true);
    try {
      const apiPrefix = onModel === 'Comment' ? '/comments' : onModel === 'TravelPlan' ? '/plans' : '/posts';
      const response = await API.get<{ users: User[], totalPages: number }>(
        `${apiPrefix}/${targetId}/likes`,
        { params: { page: pageNum, limit: 20 } }
      );
      
      const newLikers = response.data.users || [];
      setLikers(prev => pageNum === 1 ? newLikers : [...prev, ...newLikers]);
      setHasMore(pageNum < response.data.totalPages);
      setPage(pageNum);

    } catch (error) {
      console.error("Failed to fetch likers:", error);
      toast.error("Failed to load likers.");
    } finally {
      setIsLoading(false);
    }
  }, [targetId, onModel]);

  useEffect(() => {
    if (isOpen) {
      setLikers([]);
      setPage(1);
      setHasMore(true);
      fetchLikers(1);
    }
  }, [isOpen, fetchLikers]);
  
  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
    setIsOpen(false);
  };
  
  const handleFollowToggle = async (targetUserId: string) => {
    if (!currentUser) {
      toast.error("Please log in to follow users.");
      navigate('/login');
      return;
    }

    const originalLikers = [...likers];
    setLikers(prev => 
      prev.map(u => u._id === targetUserId ? { ...u, isFollowing: !u.isFollowing } : u)
    );
    
    try {
      const isCurrentlyFollowing = originalLikers.find(u => u._id === targetUserId)?.isFollowing;
      if (isCurrentlyFollowing) {
        await API.delete(`/users/${targetUserId}/unfollow`);
        toast.success('Unfollowed successfully');
      } else {
        await API.post(`/users/${targetUserId}/follow`);
        toast.success('Followed successfully');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      setLikers(originalLikers);
    }
  };
  
  const loadMoreLikers = () => {
    if (!isLoading && hasMore) {
        fetchLikers(page + 1);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[60vh] flex flex-col">
        <DialogHeader className='pb-4 border-b'>
          <DialogTitle className="flex items-center gap-2">
            <ThumbsUp className='w-5 h-5' />
            Likes
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6">
            <div className="px-6 py-2">
            {isLoading && likers.length === 0 ? (
                <div className='space-y-3'>
                  {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className='flex items-center gap-4'>
                        <Skeleton className='w-10 h-10 rounded-full' />
                        <Skeleton className='h-4 w-28 flex-1' />
                      </div>
                  ))}
                </div>
            ) : likers.length > 0 ? (
                <div className="space-y-1">
                  {likers.map((user) => (
                      <div
                          key={user._id}
                          className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                          <div 
                              className="flex items-center gap-4 flex-1 cursor-pointer"
                              onClick={() => handleUserClick(user._id)}
                          >
                              <Avatar>
                                  <AvatarImage src={user.avatarUrl} alt={user.displayName || user.username} />
                                  <AvatarFallback>{(user.displayName || user.username).charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <p className="font-medium truncate">{user.displayName || user.username}</p>
                          </div>
                          {currentUser && currentUser.userId !== user._id && (
                              <Button
                                  size="sm"
                                  variant={user.isFollowing ? 'outline' : 'default'}
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      handleFollowToggle(user._id);
                                  }}
                                  className="ml-auto w-[90px]"
                              >
                                  {user.isFollowing ? 'Unfollow' : 'Follow'}
                              </Button>
                          )}
                      </div>
                  ))}
                  {hasMore && (
                    <div className='text-center py-4'>
                        <Button variant="outline" onClick={loadMoreLikers} disabled={isLoading}>
                            {isLoading ? 'Loading...' : 'Load More'}
                        </Button>
                    </div>
                  )}
                </div>
            ) : (
                <div className='text-center py-8 text-gray-500'>
                    <p>No one has liked this yet.</p>
                </div>
            )}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default LikesModal;