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
import API from '@/utils/axiosInstance';
import { useAuth } from '@/context/AuthContext';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
    individualHasMore,
    individualLoading,
    loadMoreForType,
    updateUserFollowStatus,
  } = useSearch();

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Refs for individual content type infinite scroll
  const plansLoadMoreRef = useRef<HTMLDivElement>(null);
  const postsLoadMoreRef = useRef<HTMLDivElement>(null);
  const usersLoadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          console.log('Intersection observer triggered for individual tab');
          loadMore();
        }
      },
      { threshold: 0.1 },
    );

    const currentRef = loadMoreRef.current;
    if (currentRef && type !== 'all') {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, isLoadingMore, type, loadMore, results]);

  // Individual intersection observers for each content type in "all" tab
  useEffect(() => {
    const plansContainer =
      plansLoadMoreRef.current?.closest('.overflow-y-auto');
    const plansObserver = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          individualHasMore.plans &&
          !individualLoading.plans &&
          type === 'all'
        ) {
          console.log('Plans intersection observer triggered');
          loadMoreForType('plans');
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        root: (plansContainer as Element) || null,
      },
    );

    if (plansLoadMoreRef.current) {
      plansObserver.observe(plansLoadMoreRef.current);
    }

    return () => plansObserver.disconnect();
  }, [loadMoreForType, individualHasMore.plans, individualLoading.plans, type]);

  useEffect(() => {
    const postsContainer =
      postsLoadMoreRef.current?.closest('.overflow-y-auto');
    const postsObserver = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          individualHasMore.posts &&
          !individualLoading.posts &&
          type === 'all'
        ) {
          console.log('Posts intersection observer triggered');
          loadMoreForType('posts');
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        root: (postsContainer as Element) || null,
      },
    );

    if (postsLoadMoreRef.current) {
      postsObserver.observe(postsLoadMoreRef.current);
    }

    return () => postsObserver.disconnect();
  }, [loadMoreForType, individualHasMore.posts, individualLoading.posts, type]);

  useEffect(() => {
    const usersContainer =
      usersLoadMoreRef.current?.closest('.overflow-y-auto');
    const usersObserver = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          individualHasMore.users &&
          !individualLoading.users &&
          type === 'all'
        ) {
          console.log('Users intersection observer triggered');
          loadMoreForType('users');
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        root: (usersContainer as Element) || null,
      },
    );

    if (usersLoadMoreRef.current) {
      usersObserver.observe(usersLoadMoreRef.current);
    }

    return () => usersObserver.disconnect();
  }, [loadMoreForType, individualHasMore.users, individualLoading.users, type]);

  const handlePlanClick = (planId: string) => {
    navigate(`/plans/${planId}`);
  };

  const handlePostClick = (postId: string) => {
    navigate(`/posts/${postId}`);
  };

  const handleUserFollow = async (
    userId: string,
    isCurrentlyFollowing: boolean,
  ) => {
    if (!user) {
      toast.error('Please login to follow users');
      navigate('/login');
      return;
    }

    try {
      if (isCurrentlyFollowing) {
        // Unfollow user
        await API.delete(`/users/${userId}/unfollow`);
        toast.success('User unfollowed successfully');
        updateUserFollowStatus(userId, false, -1);
      } else {
        // Follow user
        await API.post(`/users/${userId}/follow`);
        toast.success('User followed successfully');
        updateUserFollowStatus(userId, true, 1);
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      toast.error('Failed to update follow status');
    }
  };

  const handleUserViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  if (!query.trim() && !isLoading) {
    return (
      <div className='flex flex-col'>
        <main className='flex-1 p-6 max-w-7xl mx-auto w-full'>
          <div className='mb-6'>
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
        </main>
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
    <div className='flex flex-col'>
      <main className='flex-1 p-6 max-w-7xl mx-auto w-full'>
        <div className='mb-6'>
          <SearchInput
            placeholder='Search for travel plans, posts, or people...'
            fullWidth={true}
          />
        </div>

        <div className='mb-6'>
          <h1 className='text-3xl font-bold mb-2'>
            Search Results for "{query}"
          </h1>
          <p className='text-muted-foreground'>
            {getTotalCount()} result{getTotalCount() !== 1 ? 's' : ''} found
          </p>
        </div>

        <Tabs value={type} onValueChange={handleTabChange} className='mb-6'>
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
                <div className='flex flex-col lg:flex-row gap-8 h-[600px]'>
                  {/* Travel Plans Section */}
                  {results.plans.length > 0 && (
                    <div className='flex flex-col h-full lg:flex-1'>
                      <h2 className='text-xl font-semibold mb-4 flex-shrink-0'>
                        Travel Plans ({totalCounts.plans})
                      </h2>
                      <div className='flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300'>
                        <div className='grid grid-cols-1 gap-4'>
                          {results.plans.map((plan) => (
                            <SearchPlanCard
                              key={plan._id}
                              plan={plan}
                              onClick={() => handlePlanClick(plan._id)}
                            />
                          ))}
                        </div>
                        {individualHasMore.plans && (
                          <div
                            ref={plansLoadMoreRef}
                            className='flex justify-center py-4'
                          >
                            {individualLoading.plans && (
                              <div className='flex items-center space-x-2'>
                                <Loader2 className='h-4 w-4 animate-spin' />
                                <span className='text-sm'>
                                  Loading more plans...
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Posts Section */}
                  {results.posts.length > 0 && (
                    <div className='flex flex-col h-full lg:flex-1'>
                      <h2 className='text-xl font-semibold mb-4 flex-shrink-0'>
                        Posts ({totalCounts.posts})
                      </h2>
                      <div className='flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300'>
                        <div className='grid grid-cols-1 gap-4'>
                          {results.posts.map((post) => (
                            <SearchPostCard
                              key={post._id}
                              post={post}
                              onClick={() => handlePostClick(post._id)}
                            />
                          ))}
                        </div>
                        {individualHasMore.posts && (
                          <div
                            ref={postsLoadMoreRef}
                            className='flex justify-center py-4'
                          >
                            {individualLoading.posts && (
                              <div className='flex items-center space-x-2'>
                                <Loader2 className='h-4 w-4 animate-spin' />
                                <span className='text-sm'>
                                  Loading more posts...
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Users Section */}
                  {results.users.length > 0 && (
                    <div className='flex flex-col h-full lg:flex-1'>
                      <h2 className='text-xl font-semibold mb-4 flex-shrink-0'>
                        Users ({totalCounts.users})
                      </h2>
                      <div className='flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300'>
                        <div className='grid grid-cols-1 gap-4'>
                          {results.users.map((searchUser) => (
                            <SearchUserCard
                              key={searchUser._id}
                              user={searchUser}
                              onFollow={handleUserFollow}
                              onViewProfile={() =>
                                handleUserViewProfile(searchUser._id)
                              }
                              currentUserId={user?.userId}
                              isAuthenticated={!!user}
                            />
                          ))}
                        </div>
                        {individualHasMore.users && (
                          <div
                            ref={usersLoadMoreRef}
                            className='flex justify-center py-4'
                          >
                            {individualLoading.users && (
                              <div className='flex items-center space-x-2'>
                                <Loader2 className='h-4 w-4 animate-spin' />
                                <span className='text-sm'>
                                  Loading more users...
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Show message if no results in any category */}
                {results.plans.length === 0 &&
                  results.posts.length === 0 &&
                  results.users.length === 0 &&
                  !isLoading && (
                    <div className='text-center mt-12'>
                      <Search className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
                      <h2 className='text-xl font-semibold mb-2'>
                        No results found
                      </h2>
                      <p className='text-muted-foreground'>
                        Try searching with different keywords or check your
                        spelling.
                      </p>
                    </div>
                  )}
              </TabsContent>

              <TabsContent value='plans' className='mt-8'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {results.users.map((searchUser) => (
                    <SearchUserCard
                      key={searchUser._id}
                      user={searchUser}
                      onFollow={handleUserFollow}
                      onViewProfile={() =>
                        handleUserViewProfile(searchUser._id)
                      }
                      currentUserId={user?.userId}
                      isAuthenticated={!!user}
                    />
                  ))}
                </div>
              </TabsContent>

              {hasMore && type !== 'all' && (
                <div ref={loadMoreRef} className='flex justify-center py-4'>
                  {isLoadingMore && (
                    <div className='flex items-center space-x-2'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      <span>Loading more...</span>
                    </div>
                  )}
                </div>
              )}

              {getTotalCount() === 0 && !isLoading && type !== 'all' && (
                <div className='text-center mt-12'>
                  <Search className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
                  <h2 className='text-xl font-semibold mb-2'>
                    No results found
                  </h2>
                  <p className='text-muted-foreground'>
                    Try searching with different keywords or check your
                    spelling.
                  </p>
                </div>
              )}
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default SearchPage;
