import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '@/utils/axiosInstance';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  AtSign,
  Share2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { useSocket } from '@/context/SocketProvider';

interface Notification {
  _id: string;
  type: string;
  actor: {
    _id: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
  };
  target?: {
    plan?: {
      _id: string;
      title: string;
    };
    post?: {
      _id: string;
      title: string;
    };
    comment?: {
      _id: string;
      content: string;
    };
  };
  read: boolean;
  createdAt: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

function NotificationIcon({ type }: { type: string }) {
  const iconProps = { className: 'h-4 w-4' };
  switch (type) {
    case 'like_plan':
    case 'like_post':
    case 'like_comment':
      return <Heart {...iconProps} className='h-4 w-4 text-red-500' />;
    case 'comment_plan':
    case 'comment_post':
    case 'reply_comment':
      return <MessageCircle {...iconProps} className='h-4 w-4 text-blue-500' />;
    case 'follow':
      return <UserPlus {...iconProps} className='h-4 w-4 text-green-500' />;
    case 'mention_in_comment':
      return <AtSign {...iconProps} className='h-4 w-4 text-purple-500' />;
    case 'remix_plan':
      return <Share2 {...iconProps} className='h-4 w-4 text-orange-500' />;
    default:
      return <Bell {...iconProps} />;
  }
}

function getNotificationMessage(type: string): string {
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
      return type.replace('_', ' ');
  }
}

function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
  actionLoading,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  actionLoading: string | null;
}) {
  const navigate = useNavigate();

  const truncateTitle = (title: string, maxLength: number = 50) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  const handleTargetClick = async (
    targetType: 'plan' | 'post',
    targetId: string,
  ) => {
    try {
      // Mark notification as read if it's not already read
      if (!notification.read) {
        await onMarkAsRead(notification._id);
      }

      // Navigate to the target
      if (targetType === 'plan') {
        navigate(`/plans/${targetId}`);
      } else if (targetType === 'post') {
        navigate(`/posts/${targetId}`);
      }
    } catch (error) {
      console.error('Error handling target click:', error);
      // Still navigate even if marking as read fails
      if (targetType === 'plan') {
        navigate(`/plans/${targetId}`);
      } else if (targetType === 'post') {
        navigate(`/posts/${targetId}`);
      }
    }
  };

  const handleUserClick = () => {
    navigate(`/profile/${notification.actor._id}`);
  };

  const getTargetDisplay = () => {
    if (notification.target?.plan?.title) {
      return (
        <p className='text-sm text-muted-foreground mb-2'>
          on:{' '}
          <span
            className='font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors duration-200'
            title={`Click to view "${notification.target.plan.title}"`}
            onClick={() =>
              handleTargetClick('plan', notification.target!.plan!._id)
            }
          >
            "{truncateTitle(notification.target.plan.title)}"
          </span>
        </p>
      );
    }
    if (notification.target?.post?.title) {
      return (
        <p className='text-sm text-muted-foreground mb-2'>
          on:{' '}
          <span
            className='font-medium text-green-600 hover:text-green-700 hover:underline cursor-pointer transition-colors duration-200'
            title={`Click to view "${notification.target.post.title}"`}
            onClick={() =>
              handleTargetClick('post', notification.target!.post!._id)
            }
          >
            "{truncateTitle(notification.target.post.title)}"
          </span>
        </p>
      );
    }
    return null;
  };

  return (
    <Card
      className={`bg-white/70 backdrop-blur-sm border-blue-50 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/60 hover:scale-[102%] transition-all duration-200 py-1 ${!notification.read ? 'bg-white/90 border-blue-300 border-1' : ''}`}
    >
      <CardContent className='p-4'>
        <div className='flex items-start space-x-3'>
          <Avatar
            className='h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity duration-200'
            onClick={handleUserClick}
          >
            <AvatarImage
              src={notification.actor?.avatarUrl || '/logo.png'}
              alt={notification.actor?.displayName}
            />
            <AvatarFallback>
              {notification.actor?.displayName
                ?.split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1 min-w-0 text-left'>
            <div className='flex items-center space-x-2 mb-1'>
              <NotificationIcon type={notification.type} />
              <span
                className='font-semibold text-sm hover:text-blue-600 hover:underline cursor-pointer transition-colors duration-200'
                onClick={handleUserClick}
                title={`Click to view ${notification.actor?.displayName}'s profile`}
              >
                {notification.actor?.displayName}
              </span>
              <span className='text-xs text-muted-foreground'>
                @{notification.actor?.username}
              </span>
              {!notification.read && (
                <Badge
                  variant='secondary'
                  className='h-2 w-2 p-0 bg-blue-500'
                />
              )}
            </div>
            <p className='text-sm text-muted-foreground mb-1'>
              {getNotificationMessage(notification.type)}
            </p>
            {notification.target?.comment?.content && (
              <div className='bg-muted/50 rounded-md p-2 mb-2 border-l-4 border-blue-200'>
                <p className='text-sm italic text-gray-700'>
                  "{truncateTitle(notification.target.comment.content, 100)}"
                </p>
              </div>
            )}
            {getTargetDisplay()}
            <p className='text-xs text-muted-foreground'>
              {formatTimeAgo(notification.createdAt)}
            </p>
          </div>
          <div className='flex flex-col space-y-1'>
            {!notification.read && (
              <Button
                variant='outline'
                size='sm'
                className='bg-transparent'
                onClick={() => onMarkAsRead(notification._id)}
                disabled={actionLoading === notification._id}
              >
                {actionLoading === notification._id
                  ? 'Marking...'
                  : 'Mark as Read'}
              </Button>
            )}
            <Button
              variant='outline'
              size='sm'
              className='bg-transparent'
              onClick={() => onDelete(notification._id)}
              disabled={actionLoading === notification._id}
            >
              {actionLoading === notification._id ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationSkeleton() {
  return (
    <Card className='bg-white/80 backdrop-blur-sm border-blue-50 shadow-xl shadow-slate-200/50 py-1'>
      <CardContent className='p-4'>
        <div className='flex items-start space-x-3'>
          <Skeleton className='h-10 w-10 rounded-full' />
          <div className='flex-1 min-w-0'>
            <div className='flex items-center space-x-2 mb-1'>
              <Skeleton className='h-4 w-4 rounded' />
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-3 w-16' />
              <Skeleton className='h-2 w-2 rounded-full' />
            </div>
            <Skeleton className='h-4 w-32 mb-1' />
            <Skeleton className='h-4 w-48 mb-2' />
            <Skeleton className='h-3 w-20' />
          </div>
          <div className='flex flex-col space-y-1'>
            <Skeleton className='h-8 w-20' />
            <Skeleton className='h-8 w-16' />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const NotificationPage: React.FC = () => {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [pagination, setPagination] = React.useState<Pagination | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null); // notificationId or 'all' for mark all
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const limit = 15;
  const { decrementUnread, incrementUnread, setUnreadCount, unreadCount } = useSocket();

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/notifications', {
        params: { page, limit },
        withCredentials: true,
      });
      setNotifications(res.data.data);
      setPagination(res.data.pagination);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Mark single notification as read
  const handleMarkAsRead = async (id: string) => {
    setActionLoading(id);
    setActionError(null);
    const previous = notifications;
    try {
      // Optimistic update
      setNotifications((current) =>
        current.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
      // Adjust unread counter if this item was unread
      const wasUnread = previous.find((n) => n._id === id)?.read === false;
      if (wasUnread) {
        decrementUnread(1);
      }

      await axios.post(`/notifications/${id}/mark-as-read`);
    } catch (err: any) {
      // Rollback on error
      setActionError(err?.response?.data?.message || 'Failed to mark as read');
      setNotifications(previous);
      const wasUnread = previous.find((n) => n._id === id)?.read === false;
      if (wasUnread) {
        incrementUnread(1);
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    setActionLoading('all');
    setActionError(null);
    const previous = notifications;
    const prevCount = unreadCount;
    try {
      // Optimistic update
      setNotifications((current) => current.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);

      await axios.post('/notifications/mark-all-as-read');
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || 'Failed to mark all as read',
      );
      // Rollback on error
      setNotifications(previous);
      setUnreadCount(prevCount);
    } finally {
      setActionLoading(null);
    }
  };

  // Delete notification
  const handleDelete = async (id: string) => {
    setActionLoading(id);
    setActionError(null);
    const previous = notifications;
    const wasUnread = previous.find((n) => n._id === id)?.read === false;
    try {
      // Optimistic update
      setNotifications((current) =>
        current.filter((n) => n._id !== id),
      );

      // Optionally adjust pagination counts optimistically
      setPagination((p) => {
        if (!p) return p;
        const newTotalResults = Math.max(0, p.totalResults - 1);
        const newTotalPages = Math.max(1, Math.ceil(newTotalResults / limit));
        const newCurrentPage = Math.min(p.currentPage, newTotalPages);

        // If current page becomes invalid, navigate to the last valid page
        if (newCurrentPage !== p.currentPage) {
          setPage(newCurrentPage);
        }

        return {
          ...p,
          totalResults: newTotalResults,
          totalPages: newTotalPages,
          currentPage: newCurrentPage,
          hasNextPage: newCurrentPage < newTotalPages,
          hasPrevPage: newCurrentPage > 1,
        };
      });

      if (wasUnread) {
        decrementUnread(1);
      }

      await axios.delete(`/notifications/${id}`);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || 'Failed to delete notification',
      );
      // Rollback on error
      setNotifications(previous);
      if (wasUnread) {
        incrementUnread(1);
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Keep local count available if needed for page-only display logic
  // const localUnread = notifications.filter((n) => !n.read).length;

  return (
    <div className='min-h-screen flex flex-col'>
      <header className='flex h-16 shrink-0 items-center gap-2 border-b px-6'>
        <Bell className='h-5 w-5' />
        <h1 className='text-lg font-semibold'>Notifications</h1>
        {unreadCount > 0 && (
          <Badge variant='destructive' className='h-5 px-2 text-xs'>
            {unreadCount} new
          </Badge>
        )}
        <div className='ml-auto flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleMarkAllAsRead}
            disabled={
              actionLoading === 'all' ||
              loading ||
              notifications.every((n) => n.read)
            }
          >
            {actionLoading === 'all' ? 'Marking...' : 'Mark all as read'}
          </Button>
        </div>
      </header>
      <main className='flex-1 flex flex-col min-h-0'>
        <div className='flex-1 overflow-y-auto p-6'>
          <div className='max-w-2xl mx-auto space-y-4'>
            {loading && (
              <>
                <NotificationSkeleton />
                <NotificationSkeleton />
                <NotificationSkeleton />
                <NotificationSkeleton />
                <NotificationSkeleton />
                <NotificationSkeleton />
                <NotificationSkeleton />
                <NotificationSkeleton />
                <NotificationSkeleton />
                <NotificationSkeleton />
              </>
            )}
            {error && <div className='text-red-500 mb-2'>{error}</div>}
            {actionError && (
              <div className='text-red-500 mb-2'>{actionError}</div>
            )}
            {!loading && notifications.length === 0 ? (
              <div className='text-center py-12'>
                <Bell className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <h3 className='text-lg font-semibold mb-2'>No notifications</h3>
                <p className='text-muted-foreground'>
                  You're all caught up! Check back later for new notifications.
                </p>
              </div>
            ) : (
              <>
                {notifications.map((notification) => (
                  <NotificationCard
                    key={notification._id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                    actionLoading={actionLoading}
                  />
                ))}
              </>
            )}
          </div>
        </div>
        {pagination && notifications.length > 0 && (
          <div className='flex-shrink-0 p-6'>
            <div className='max-w-2xl mx-auto'>
              <div className='flex justify-center'>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href='#'
                        onClick={(e) => {
                          e.preventDefault();
                          if (pagination.currentPage > 1)
                            setPage(pagination.currentPage - 1);
                        }}
                        className={
                          pagination.currentPage === 1
                            ? 'pointer-events-none opacity-50'
                            : ''
                        }
                      />
                    </PaginationItem>
                    {/* Page numbers with ellipsis logic */}
                    {(() => {
                      const pages = [];
                      const { currentPage, totalPages } = pagination;
                      let start = Math.max(1, currentPage - 2);
                      let end = Math.min(totalPages, currentPage + 2);
                      if (currentPage <= 3) {
                        start = 1;
                        end = Math.min(5, totalPages);
                      } else if (currentPage >= totalPages - 2) {
                        start = Math.max(1, totalPages - 4);
                        end = totalPages;
                      }
                      if (start > 1) {
                        pages.push(
                          <PaginationItem key={1}>
                            <PaginationLink
                              href='#'
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(1);
                              }}
                              isActive={currentPage === 1}
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>,
                        );
                        if (start > 2) {
                          pages.push(
                            <PaginationItem key='start-ellipsis'>
                              <PaginationEllipsis />
                            </PaginationItem>,
                          );
                        }
                      }
                      for (let i = start; i <= end; i++) {
                        pages.push(
                          <PaginationItem key={i}>
                            <PaginationLink
                              href='#'
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(i);
                              }}
                              isActive={currentPage === i}
                            >
                              {i}
                            </PaginationLink>
                          </PaginationItem>,
                        );
                      }
                      if (end < totalPages) {
                        if (end < totalPages - 1) {
                          pages.push(
                            <PaginationItem key='end-ellipsis'>
                              <PaginationEllipsis />
                            </PaginationItem>,
                          );
                        }
                        pages.push(
                          <PaginationItem key={totalPages}>
                            <PaginationLink
                              href='#'
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(totalPages);
                              }}
                              isActive={currentPage === totalPages}
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>,
                        );
                      }
                      return pages;
                    })()}
                    <PaginationItem>
                      <PaginationNext
                        href='#'
                        onClick={(e) => {
                          e.preventDefault();
                          if (pagination.currentPage < pagination.totalPages)
                            setPage(pagination.currentPage + 1);
                        }}
                        className={
                          pagination.currentPage === pagination.totalPages
                            ? 'pointer-events-none opacity-50'
                            : ''
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NotificationPage;
