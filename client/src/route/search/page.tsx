import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Search } from 'lucide-react';
import { SearchInput } from '@/components/SearchInput';
import SearchPlanCard from '@/components/SearchPlanCard';
import SearchPostCard from '@/components/SearchPostCard';
import SearchUserCard from '@/components/SearchUserCard';
import { useSearch } from '@/hooks/useSearch';
import { toast } from 'react-hot-toast';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    query,
    type,
    results,
    totalCounts,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    handleTabChange,
  } = useSearch();

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoadingMore]);

  const handlePlanClick = (planId: string) => {
    navigate(`/plans/${planId}`);
  };

  const handlePostClick = (postId: string) => {
    navigate(`/posts/${postId}`);
  };

  const handleUserFollow = () => {
    toast.success('Follow functionality to be implemented');
  };

  const handleUserViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  if (!query.trim() && !isLoading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='mb-8'>
          <SearchInput
            placeholder='Search for travel plans, posts, or people...'
            fullWidth={true}
          />
        </div>
        <div className='text-center'>
          <Search className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
          <h1 className='text-2xl font-bold mb-2'>Search TravelShare</h1>
          <p className='text-muted-foreground'>
            Find your next adventure or connect with fellow travelers.
          </p>
        </div>
      </div>
    );
  }

  const getTotalCount = () => {
    switch (type) {
      case 'plans':
        return totalCounts.plans;
      case 'posts':
        return totalCounts.posts;
      case 'users':
        return totalCounts.users;
      default:
        return totalCounts.plans + totalCounts.posts + totalCounts.users;
    }
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-8'>
        <SearchInput
          placeholder='Search for travel plans, posts, or people...'
          fullWidth={true}
        />
      </div>

      <div className='mb-8'>
        <h1 className='text-3xl font-bold mb-2'>
          Search Results for "{query}"
        </h1>
        <p className='text-muted-foreground'>
          {getTotalCount()} result{getTotalCount() !== 1 ? 's' : ''} found
        </p>
      </div>

      <Tabs value={type} onValueChange={handleTabChange} className='mb-8'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='all'>All</TabsTrigger>
          <TabsTrigger value='plans'>Plans</TabsTrigger>
          <TabsTrigger value='posts'>Posts</TabsTrigger>
          <TabsTrigger value='users'>Users</TabsTrigger>
        </TabsList>

        {isLoading && (
          <div className='mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className='p-4'>
                <Skeleton className='h-32 w-full mb-4' />
                <Skeleton className='h-4 w-3/4 mb-2' />
                <Skeleton className='h-3 w-1/2' />
              </Card>
            ))}
          </div>
        )}

        {error && (
          <div className='mt-8 text-center'>
            <Card className='mx-auto max-w-md'>
              <CardContent className='pt-6'>
                <p className='text-red-500 mb-4'>{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <TabsContent value='all' className='mt-8'>
              <div className='space-y-8'>
                {results.plans.length > 0 && (
                  <div>
                    <h2 className='text-xl font-semibold mb-4'>Travel Plans</h2>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                      {results.plans.map((plan) => (
                        <SearchPlanCard
                          key={plan._id}
                          plan={plan}
                          onClick={() => handlePlanClick(plan._id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {results.posts.length > 0 && (
                  <div>
                    <h2 className='text-xl font-semibold mb-4'>Posts</h2>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      {results.posts.map((post) => (
                        <SearchPostCard
                          key={post._id}
                          post={post}
                          onClick={() => handlePostClick(post._id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {results.users.length > 0 && (
                  <div>
                    <h2 className='text-xl font-semibold mb-4'>Users</h2>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                      {results.users.map((user) => (
                        <SearchUserCard
                          key={user._id}
                          user={user}
                          onFollow={handleUserFollow}
                          onViewProfile={() => handleUserViewProfile(user._id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value='plans' className='mt-8'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {results.plans.map((plan) => (
                  <SearchPlanCard
                    key={plan._id}
                    plan={plan}
                    onClick={() => handlePlanClick(plan._id)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value='posts' className='mt-8'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {results.posts.map((post) => (
                  <SearchPostCard
                    key={post._id}
                    post={post}
                    onClick={() => handlePostClick(post._id)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value='users' className='mt-8'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {results.users.map((user) => (
                  <SearchUserCard
                    key={user._id}
                    user={user}
                    onFollow={handleUserFollow}
                    onViewProfile={() => handleUserViewProfile(user._id)}
                  />
                ))}
              </div>
            </TabsContent>

            {hasMore && (
              <div ref={loadMoreRef} className='flex justify-center py-4'>
                {isLoadingMore && (
                  <div className='flex items-center space-x-2'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    <span>Loading more...</span>
                  </div>
                )}
              </div>
            )}

            {getTotalCount() === 0 && !isLoading && (
              <div className='text-center mt-12'>
                <Search className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
                <h2 className='text-xl font-semibold mb-2'>No results found</h2>
                <p className='text-muted-foreground'>
                  Try searching with different keywords or check your spelling.
                </p>
              </div>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
};

export default SearchPage;
