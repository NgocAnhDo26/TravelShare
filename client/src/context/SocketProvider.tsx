import React, { createContext, useContext, useEffect, useState } from 'react';
import { socket } from '../socket';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import axios from '@/utils/axiosInstance';

interface RealtimeNotificationActor {
  _id?: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  name?: string;
  profilePicture?: string;
}

interface RealtimeNotificationTarget {
  plan?: { _id: string; title?: string };
  post?: { _id: string; title?: string };
  comment?: { _id: string; content?: string };
}

interface RealtimeNotification {
  _id?: string;
  type?: string;
  actor?: RealtimeNotificationActor;
  target?: RealtimeNotificationTarget;
  read?: boolean;
  createdAt?: string;
  message?: string; // some payloads may directly include a message
}

interface SocketContextType {
  notifications: RealtimeNotification[];
  unreadCount: number;
  incrementUnread: (by?: number) => void;
  decrementUnread: (by?: number) => void;
  setUnreadCount: (value: number) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { user } = useAuth(); // <-- Get user from your AuthProvider
  const navigate = useNavigate();

  useEffect(() => {
    // Only connect if the user is logged in
    if (user && user.userId) {
      socket.connect();
      socket.emit('register', user.userId); // Register the user with their ID
      // Fetch initial unread count
      axios
        .get('/notifications/unread-count', { withCredentials: true })
        .then((res) => {
          if (typeof res.data?.count === 'number') {
            setUnreadCount(res.data.count);
          }
        })
        .catch(() => {
          // Silently ignore; we can recover on next successful action
        });

      const getNotificationMessage = (type?: string): string => {
        switch (type) {
          case 'like_plan':
            return 'liked your travel plan';
          case 'like_post':
            return 'liked your post';
          case 'like_comment':
            return 'liked your comment';
          case 'comment_plan':
            return 'commented on your travel plan';
          case 'comment_post':
            return 'commented on your post';
          case 'reply_comment':
            return 'replied to your comment';
          case 'follow':
            return 'started following you';
          case 'mention_in_comment':
            return 'mentioned you in a comment';
          case 'remix_plan':
            return 'remixed your travel plan';
          default:
            return type ? type.replace('_', ' ') : 'sent you a notification';
        }
      };

      const truncate = (text: string, maxLen = 60) =>
        text.length <= maxLen ? text : text.slice(0, maxLen) + '...';

      const buildToastText = (
        payload: RealtimeNotification | string,
      ): string => {
        if (typeof payload === 'string') return payload;
        if (payload.message) return payload.message;

        const actorName =
          payload.actor?.displayName ||
          payload.actor?.name ||
          payload.actor?.username ||
          'Someone';
        const base = `${actorName} ${getNotificationMessage(payload.type)}`;

        // Add brief context if available
        if (payload.target?.plan?.title) {
          return `${base}: "${truncate(payload.target.plan.title)}"`;
        }
        if (payload.target?.post?.title) {
          return `${base}: "${truncate(payload.target.post.title)}"`;
        }
        if (payload.target?.comment?.content) {
          return `${base}: "${truncate(payload.target.comment.content, 80)}"`;
        }
        return base;
      };

      const onNewNotification = (value: any) => {
        // Store raw payload for potential consumers
        console.log(value);
        setNotifications((prev) => [value as RealtimeNotification, ...prev]);
        // Increment unread counter for new incoming notification
        setUnreadCount((c) => c + 1);
        const text = buildToastText(value as RealtimeNotification | string);

        const onClick = () => {
          const payload = value as RealtimeNotification & { url?: string };
          // Optimistically mark as read if this notification has an id and is unread
          const id = payload._id;
          if (id && payload.read === false) {
            // Optimistic update of unread counter and local list
            setUnreadCount((c) => Math.max(0, c - 1));
            setNotifications((prev) =>
              prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
            );
            axios
              .post(`/notifications/${id}/mark-as-read`, undefined, {
                withCredentials: true,
              })
              .catch(() => {
                // Rollback on failure
                setUnreadCount((c) => c + 1);
                setNotifications((prev) =>
                  prev.map((n) => (n._id === id ? { ...n, read: false } : n)),
                );
              });
          }
          if (
            typeof value === 'object' &&
            value &&
            'url' in value &&
            (value as any).url
          ) {
            navigate((value as any).url as string);
            return;
          }
          if (payload.target?.plan?._id) {
            navigate(`/plans/${payload.target.plan._id}`);
            return;
          }
          if (payload.target?.post?._id) {
            navigate(`/posts/${payload.target.post._id}`);
            return;
          }
          if (payload.actor?._id) {
            navigate(`/profile/${payload.actor._id}`);
            return;
          }
          navigate('/notifications');
        };

        toast.custom(
          () => (
            <div
              onClick={onClick}
              className='cursor-pointer flex items-start gap-3 rounded-md shadow-lg border bg-white p-3'
            >
              <span>🔔</span>
              <div className='text-sm flex flex-col items-start'>
                <div className='font-medium'>Notification</div>
                <div className='text-gray-700'>{text}</div>
              </div>
            </div>
          ),
          { duration: 5000, position: 'bottom-right' },
        );
      };

      socket.on('new-notification', onNewNotification);

      // Cleanup function: runs when user changes or component unmounts
      return () => {
        socket.off('new-notification', onNewNotification);
        socket.disconnect();
      };
    } else {
      // If there is no user, disconnect the socket
      socket.disconnect();
      setUnreadCount(0);
      setNotifications([]);
    }
  }, [user]); // <-- The effect depends on the user object

  return (
    <SocketContext.Provider
      value={{
        notifications,
        unreadCount,
        incrementUnread: (by = 1) => setUnreadCount((c) => Math.max(0, c + by)),
        decrementUnread: (by = 1) => setUnreadCount((c) => Math.max(0, c - by)),
        setUnreadCount,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to easily access the socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
