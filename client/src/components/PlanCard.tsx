
import React, { useState, useEffect } from 'react';
import API from '../utils/axiosInstance';
import FeedPost from './PlanCardPost';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { Card, CardHeader, CardContent } from './ui/card';

const Feed: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      if (!hasMore) return;
      setIsLoading(true);
      try {
        const response = await API.get(`/plans/feed?page=${page}&limit=5`);
        if (response.data.length > 0) {
          setPlans(prev => [...prev, ...response.data]);
        } else {
          setHasMore(false);
        }
      } catch (err) { console.error(err); } 
      finally { setIsLoading(false); }
    };
    fetchFeed();
  }, [page]);

  const renderSkeletons = () => Array.from({ length: 2 }).map((_, index) => (
    <Card key={index}><CardHeader><div className="flex gap-3"><Skeleton className="w-10 h-10 rounded-full" /><div className="flex-1"><Skeleton className="h-4 w-32 mb-2" /><Skeleton className="h-3 w-24" /></div></div></CardHeader><CardContent><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-3/4 mb-4" /><Skeleton className="h-48 w-full rounded-lg" /></CardContent></Card>
  ));

  return (
    <div className="space-y-4">
      {plans.map(plan => <FeedPost key={plan._id} plan={plan} />)}
      {isLoading && renderSkeletons()}
      {!isLoading && hasMore && <Button onClick={() => setPage(p => p + 1)} variant="outline" className="w-full">Load More</Button>}
      {!hasMore && plans.length === 0 && <p className="text-center text-gray-500">Your feed is empty. Follow someone to see their plans!</p>}
    </div>
  );
};
export default Feed;