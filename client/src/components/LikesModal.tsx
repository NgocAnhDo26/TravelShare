import React, { useState, useEffect } from 'react';
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

interface User {
  _id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
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

  useEffect(() => {
    if (isOpen && targetId) {
      const fetchLikers = async () => {
        setIsLoading(true);
        try {
          const apiPrefix =
            onModel === 'Comment'
              ? '/comments'
              : onModel === 'TravelPlan'
                ? '/plans'
                : '/posts';
          const response = await API.get<{ users: User[] }>(
            `${apiPrefix}/${targetId}/likes`,
          );
          setLikers(response.data.users);
        } catch (error) {
          console.error('Failed to fetch likers:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchLikers();
    }
  }, [isOpen, targetId, onModel]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Likes</DialogTitle>
        </DialogHeader>
        <ScrollArea className='h-[300px] w-full'>
          <div className='p-4'>
            {isLoading ? (
              <p>Loading...</p>
            ) : likers.length > 0 ? (
              <div className='space-y-4'>
                {likers.map((user) => (
                  <div key={user._id} className='flex items-center gap-4'>
                    <Avatar>
                      <AvatarImage
                        src={user.avatarUrl}
                        alt={user.displayName || user.username}
                      />
                      <AvatarFallback>
                        {(user.displayName || user.username)
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className='font-medium'>
                      {user.displayName || user.username}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No one has liked this yet.</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default LikesModal;
