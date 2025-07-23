import React, { useState, useEffect, useRef, useCallback } from 'react';
import API from '../utils/axiosInstance';
import FeedPost from './PlanCardPost';
import { Skeleton } from './ui/skeleton';
import { Card, CardHeader, CardContent } from './ui/card';

interface FeedProps {
  feedType?: 'user' | 'guest';
}

const Feed: React.FC<FeedProps> = ({ feedType = 'user' }) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Fetch feed data
  useEffect(() => {
    const fetchFeed = async () => {
      if (!hasMore && feedType === 'user') return;
      setIsLoading(true);
      try {
        let response;
        if (feedType === 'user') {
          response = await API.get(`/plans/feed?page=${page}&limit=5`);
        } else {
          response = await API.get(`/plans/public`);
        }
        if (feedType === 'user') {
          if (response.data.length > 0) {
            setPlans((prev) => [...prev, ...response.data]);
          } else {
            setHasMore(false);
          }
        } else {
          setPlans(response.data);
          setHasMore(false); // No pagination for guest/public feed
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, feedType]);

  // Infinite scroll logic for user feed
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && !isLoading && hasMore && feedType === 'user') {
      setPage((prev) => prev + 1);
    }
  }, [isLoading, hasMore, feedType]);

  useEffect(() => {
    if (feedType !== 'user') return;
    if (observer.current) observer.current.disconnect();
    observer.current = new window.IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '200px', // Trigger before reaching the bottom
      threshold: 0,
    });
    if (sentinelRef.current) {
      observer.current.observe(sentinelRef.current);
    }
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [handleObserver, feedType]);

  const renderSkeletons = () =>
    Array.from({ length: 2 }).map((_, index) => (
      <Card
        key={index}
        className='overflow-hidden bg-white/80 backdrop-blur-sm border-blue-50 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 text-left gap-0 pb-1'
      >
        <CardHeader>
          <div className='flex gap-3'>
            <Skeleton className='w-10 h-10 rounded-full' />
            <div className='flex-1'>
              <Skeleton className='h-4 w-32 mb-2' />
              <Skeleton className='h-3 w-24' />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className='h-4 w-full mb-2' />
          <Skeleton className='h-4 w-3/4 mb-4' />
          <Skeleton className='h-48 w-full rounded-lg mb-4' />
        </CardContent>
      </Card>
    ));

  return (
    <div className='space-y-8'>
      {plans.map((plan) => (
        <FeedPost key={plan._id} plan={plan} />
      ))}
      {isLoading && renderSkeletons()}
      {/* Sentinel for infinite scroll (only for user feed) */}
      {feedType === 'user' && hasMore && (
        <div ref={sentinelRef} style={{ height: 1 }} />
      )}
      {!hasMore && plans.length === 0 && (
        <p className='text-center text-gray-500'>
          {feedType === 'user'
            ? 'Your feed is empty. Follow someone to see their plans!'
            : 'No public travel plans found.'}
        </p>
      )}
    </div>
  );
};
export default Feed;
