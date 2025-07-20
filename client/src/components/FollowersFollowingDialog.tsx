import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { User, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '@/utils/axiosInstance';
import toast from 'react-hot-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';

// --- FollowersFollowingDialog Component ---
interface User {
  _id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isFollowing?: boolean;
}

interface FollowersFollowingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'followers' | 'following';
  currentUserId: string;
}

const FollowersFollowingDialog: React.FC<FollowersFollowingDialogProps> = ({
  isOpen,
  onClose,
  type,
  currentUserId,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchUsers = async (pageNum: number, append: boolean = false) => {
    if (!currentUserId) return;
    
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await API.get(`/users/${type}`, {
        params: { page: pageNum, limit: 20 }
      });
      
      const newUsers = response.data.data?.map((item: any) => {
        // The API returns different structures for followers vs following
        let userData;
        if (type === 'followers') {
          userData = item.follower;
        } else {
          userData = item.following;
        }
        
        // Extract user data from _doc if it exists (Mongoose populated document)
        if (userData && userData._doc) {
          return {
            ...userData._doc,
            isFollowing: userData.isFollowing || false
          };
        }
        
        // Fallback to direct user data
        return userData;
      }).filter((user: any) => user && user._id && user.username) || [];

      // Ensure minimum loading time of 500ms for smooth transitions
      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 500;
      
      if (elapsedTime < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
      }

      if (append) {
        setUsers(prev => [...prev, ...newUsers]);
      } else {
        setUsers(newUsers);
      }

      setHasMore(pageNum < response.data.pagination.totalPages);
      setPage(pageNum);
    } catch (error: any) {
      console.error(`Error fetching ${type}:`, error);
      toast.error(`Failed to fetch ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (targetUserId: string) => {
    if (!user || !targetUserId) {
      navigate('/login');
      return;
    }

    try {
      // Find the user in the current list
      const userIndex = users.findIndex(u => u._id === targetUserId);
      if (userIndex === -1) return;
      
      const isCurrentlyFollowing = users[userIndex].isFollowing;
      
      if (isCurrentlyFollowing) {
        await API.delete(`/users/${targetUserId}/unfollow`);
        // Update the user's follow status in the list
        setUsers(prev => prev.map(u => 
          u._id === targetUserId ? { ...u, isFollowing: false } : u
        ));
        toast.success('Unfollowed successfully');
      } else {
        await API.post(`/users/${targetUserId}/follow`);
        // Update the user's follow status in the list
        setUsers(prev => prev.map(u => 
          u._id === targetUserId ? { ...u, isFollowing: true } : u
        ));
        toast.success('Followed successfully');
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      toast.error(error.response?.data?.message || 'Failed to update follow status');
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchUsers(page + 1, true);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setUsers([]);
      setPage(1);
      setHasMore(true);
      fetchUsers(1);
    }
  }, [isOpen, type, currentUserId]);



  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-200">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            {type === 'followers' ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
            {type === 'followers' ? 'Followers' : 'Following'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {loading && users.length === 0 ? (
            // Skeleton loading state
            <div className="space-y-2 animate-in fade-in duration-300">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between px-2 py-1">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="w-16 h-8 rounded-md" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500 animate-in fade-in duration-300">
              {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
            </div>
          ) : (
            <div className="space-y-2 animate-in fade-in duration-300">
              {users.map((userItem, index) => (
                <div
                  key={`${userItem._id}-${index}`}
                  className="flex items-center justify-between px-2 py-1 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors animate-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div 
                    className="flex items-center gap-3 flex-1"
                    onClick={() => handleUserClick(userItem._id)}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={userItem.avatarUrl} />
                      <AvatarFallback className="text-sm">
                        {userItem.username?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {userItem.displayName || userItem.username || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        @{userItem.username || 'unknown'}
                      </p>
                    </div>
                  </div>
                  
                  {user && user.userId !== userItem._id && userItem._id && (
                    <Button
                      size="sm"
                      variant={userItem.isFollowing ? 'outline' : 'default'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollowToggle(userItem._id);
                      }}
                      className="ml-2"
                    >
                      {userItem.isFollowing ? 'Unfollow' : 'Follow'}
                    </Button>
                  )}
                </div>
              ))}
              
              {hasMore && (
                <div className="text-center py-4">
                  {loading ? (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex items-center justify-between px-2 py-1">
                          <div className="flex items-center gap-3 flex-1">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                          <Skeleton className="w-16 h-8 rounded-md" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      className="w-full transition-all duration-200 hover:scale-105"
                    >
                      Load More
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowersFollowingDialog; 