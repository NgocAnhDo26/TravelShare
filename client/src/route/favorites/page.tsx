import React, { useEffect, useState } from 'react';
import API from '@/utils/axiosInstance';
import FeedPost from '@/components/PlanCardPost';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

const FavoritesPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await API.get('/users/likes');
        setPlans(response.data || []);
      } catch (err: any) {
        setPlans([]);
        setError(
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load favorites. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  const renderSkeletons = () =>
    Array.from({ length: 2 }).map((_, index) => (
      <Card key={index}>
        <CardHeader>
          <div className="flex gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </CardContent>
      </Card>
    ));

  return (
    <div className="max-w-2xl w-full mx-auto py-8">
      <div className="space-y-4 w-full">
        <h2 className="text-2xl font-bold mb-4">Your Favorites</h2>
        {plans.map(plan => (
          <FeedPost key={plan._id} plan={plan} />
        ))}
        {isLoading && renderSkeletons()}
        {!isLoading && error && (
          <p className="text-center text-red-500">{error}</p>
        )}
        {!isLoading && !error && plans.length === 0 && (
          <p className="text-center text-gray-500">
            No favorites to show.
          </p>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;