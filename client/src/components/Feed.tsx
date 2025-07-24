import React, { useState, useEffect, useRef, useCallback } from 'react';
import API from '../utils/axiosInstance';
import FeedPlan from './FeedPlan';
import { Skeleton } from './ui/skeleton';
import { Card, CardHeader, CardContent } from './ui/card';
import type { IPlan } from '@/types/trip';

interface FeedProps {
  feedType?: 'user' | 'guest';
}

const Feed: React.FC<FeedProps> = ({ feedType = 'user' }) => {
  const [plans, setPlans] = useState<IPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchFeed = useCallback(
    async (currentCursor: string | null) => {
      // Prevent fetching if already loading or no more data
      if (isLoading || !hasMore) return;

      setIsLoading(true);
      try {
        let response;
        if (feedType === 'user') {
          const params = new URLSearchParams({ limit: '5' });
          if (currentCursor) {
            params.append('after', currentCursor);
          }
          response = await API.get(`/plans/feed?${params.toString()}`);
        } else {
          // Guest feed doesn't use the new paginated endpoint yet
          // For now, it will fetch all public plans and won't paginate
          response = await API.get(`/plans/public`);
          setHasMore(false); // No pagination for guest feed
        }

        const newPlans = response.data.data || response.data; // Handle both API response shapes
        const pagination = response.data.pagination;

        if (newPlans.length > 0) {
          setPlans((prev) => [...prev, ...newPlans]);
        }

        if (pagination) {
          setCursor(pagination.next_cursor);
          setHasMore(pagination.has_next_page);
        }
      } catch (err) {
        console.error('Failed to fetch feed:', err);
        setHasMore(false); // Stop trying on error
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, hasMore, feedType],
  );

  // Initial fetch
  useEffect(() => {
    setPlans([]);
    setCursor(null);
    setHasMore(true);
    // The fetch will be triggered by the hasMore change in the observer setup
  }, [feedType]);

  // Infinite scroll observer setup
  useEffect(() => {
    if (feedType !== 'user') return;

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && !isLoading && hasMore) {
        fetchFeed(cursor);
      }
    };

    if (observer.current) observer.current.disconnect();

    observer.current = new window.IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '200px',
      threshold: 0,
    });

    if (sentinelRef.current) {
      observer.current.observe(sentinelRef.current);
    }

    // Initial fetch for user feed
    if (plans.length === 0 && hasMore) {
      fetchFeed(null);
    }

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [fetchFeed, feedType, isLoading, hasMore, cursor, plans.length]);

  const renderSkeletons = () =>
    Array.from({ length: 2 }).map((_, index) => (
      <Card
        key={index}
        className='overflow-hidden bg-white/80 backdrop-blur-sm border-blue-50 shadow-xl shadow-slate-200/50 text-left gap-0 pb-1'
      >
        <CardHeader>
          <div className='flex gap-3'>
            <Skeleton className='w-12 h-12 rounded-full' />
            <div className='flex-1'>
              <Skeleton className='h-5 w-32 mb-2' />
              <Skeleton className='h-4 w-24' />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className='h-5 w-full mb-2' />
          <Skeleton className='h-4 w-3/4 mb-4' />
          <Skeleton className='h-64 w-full rounded-lg mb-4' />
        </CardContent>
      </Card>
    ));

  return (
    <div className='space-y-8'>
      {plans.map((plan) => (
        <FeedPlan key={plan._id} plan={plan} />
      ))}
      {isLoading && renderSkeletons()}
      {feedType === 'user' && hasMore && (
        <div ref={sentinelRef} style={{ height: 1 }} />
      )}
      {!isLoading && !hasMore && plans.length === 0 && (
        <div className='text-center py-10'>
          <p className='text-lg font-semibold text-gray-600'>
            {feedType === 'user'
              ? 'Your feed is looking a bit empty!'
              : 'No public travel plans found.'}
          </p>
          <p className='text-gray-500 mt-2'>
            {feedType === 'user'
              ? 'Follow other travelers to see their plans here.'
              : 'Be the first to share a public plan!'}
          </p>
        </div>
      )}
      {/* Add this block for end-of-feed message when there are posts but no more to load */}
      {!isLoading && !hasMore && plans.length > 0 && (
        <div className='text-center py-6 text-gray-400 text-sm'>
          <span>This is the end of your feed...</span>
        </div>
      )}
    </div>
  );
};

export default Feed;
