import FeedPlan from '@/components/FeedPlan';
import PostItem from '@/components/PostItem';
import PersonItem from '@/components/PersonItem';
import type { FilterType, DiscoveryData } from '@/types/discovery';
import API from '@/utils/axiosInstance';
import { useEffect, useState, useCallback, useRef } from 'react';
import { SearchInput } from '@/components/SearchInput';
import { Button } from '@/components/ui/button';
import HeaderTabs from '@/components/HeaderTabs';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'react-router-dom';

interface DiscoverPageProps {}

const DiscoverPage: React.FC<DiscoverPageProps> = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [discoveryData, setDiscoveryData] = useState<DiscoveryData>({
    plans: [],
    posts: [],
    people: [],
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Initialize search query from URL params
  useEffect(() => {
    const queryFromUrl = searchParams.get('q');
    if (queryFromUrl) {
      setSearchQuery(queryFromUrl);
      setSelectedFilter('all'); // Set to 'all' to show all results
    }
  }, [searchParams]);

  // API call functions for different content types
  const fetchTrendingPlans = useCallback(async (cursor?: string | null) => {
    try {
      const params: any = { limit: 4 };
      if (cursor) {
        params.after = cursor;
      }
      const res = await API.get('/discovery/discover', { params });
      return {
        data: res.data.data || [],
        pagination: res.data.pagination || {
          next_cursor: null,
          has_next_page: false,
        },
      };
    } catch (err) {
      console.error('Error fetching trending content:', err);
      return {
        data: [],
        pagination: { next_cursor: null, has_next_page: false },
      };
    }
  }, []);

  const fetchPlans = useCallback(async (query?: string) => {
    try {
      const params = query ? { q: query } : {};
      const res = await API.get('/discovery/plans', { params });
      return res.data || [];
    } catch (err) {
      console.error('Error fetching plans:', err);
      return [];
    }
  }, []);

  const fetchPosts = useCallback(async (query?: string) => {
    try {
      const params = query ? { q: query } : {};
      const res = await API.get('/discovery/posts', { params });
      return res.data || [];
    } catch (err) {
      console.error('Error fetching posts:', err);
      return [];
    }
  }, []);

  const fetchPeople = useCallback(async (query?: string) => {
    try {
      const params = query ? { q: query } : {};
      const res = await API.get('/discovery/people', { params });
      return res.data || [];
    } catch (err) {
      console.error('Error fetching people:', err);
      return [];
    }
  }, []);

  const fetchAllData = useCallback(
    async (query?: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const [plans, posts, people] = await Promise.all([
          fetchPlans(query),
          fetchPosts(query),
          fetchPeople(query),
        ]);

        setDiscoveryData({ plans, posts, people });
      } catch (err) {
        console.error('Error fetching discovery data:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    },
    [fetchPlans, fetchPosts, fetchPeople],
  );

  // Initial data load - fetch trending content (plans and posts)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setCursor(null);
        setHasMore(true);

        // Fetch trending content (plans and posts) for initial load using the discover endpoint
        const result = await fetchTrendingPlans();
        
        // Separate plans and posts from the trending results
        const plans = result.data.filter((item: any) => item.type === 'TravelPlan' || 'destination' in item);
        const posts = result.data.filter((item: any) => item.type === 'Post' || 'content' in item);
        
        setDiscoveryData({ plans, posts, people: [] });
        setCursor(result.pagination.next_cursor);
        setHasMore(result.pagination.has_next_page);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [fetchTrendingPlans]);

  // Load more function for infinite scrolling
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || selectedFilter !== 'all') return;

    setIsLoadingMore(true);
    try {
      const result = await fetchTrendingPlans(cursor);

      // Separate plans and posts from the trending results
      const newPlans = result.data.filter((item: any) => item.type === 'TravelPlan' || 'destination' in item);
      const newPosts = result.data.filter((item: any) => item.type === 'Post' || 'content' in item);

      // Prevent duplicates by filtering out items that already exist
      const existingPlanIds = new Set(discoveryData.plans.map((plan: any) => plan._id));
      const existingPostIds = new Set(discoveryData.posts.map((post: any) => post._id));
      
      const filteredNewPlans = newPlans.filter((plan: any) => !existingPlanIds.has(plan._id));
      const filteredNewPosts = newPosts.filter((post: any) => !existingPostIds.has(post._id));

      setDiscoveryData((prev) => ({
        ...prev,
        plans: [...prev.plans, ...filteredNewPlans],
        posts: [...prev.posts, ...filteredNewPosts],
      }));
      setCursor(result.pagination.next_cursor);
      setHasMore(result.pagination.has_next_page);
    } catch (err) {
      console.error('Error loading more content:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    isLoadingMore,
    hasMore,
    selectedFilter,
    cursor,
    fetchTrendingPlans,
    discoveryData.plans,
    discoveryData.posts,
  ]);

  // Search function
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      // If no search query, reset to trending content for the current tab
      if (selectedFilter === 'all') {
        const result = await fetchTrendingPlans();
        
        // Separate plans and posts from the trending results
        const plans = result.data.filter((item: any) => item.type === 'TravelPlan' || 'destination' in item);
        const posts = result.data.filter((item: any) => item.type === 'Post' || 'content' in item);
        
        setDiscoveryData({ plans, posts, people: [] });
        setCursor(result.pagination.next_cursor);
        setHasMore(result.pagination.has_next_page);
      } else {
        // For specific tabs, clear that tab's data
        setDiscoveryData((prev) => ({
          ...prev,
          [selectedFilter === 'plans'
            ? 'plans'
            : selectedFilter === 'posts'
              ? 'posts'
              : 'people']: [],
        }));
        setCursor(null);
        setHasMore(false);
      }
      return;
    }

    // Perform search
    await fetchAllData(searchQuery);
    setCursor(null);
    setHasMore(false);
  }, [searchQuery, selectedFilter, fetchTrendingPlans, fetchAllData]);

  // Get current data based on selected filter
  const getCurrentData = () => {
    // Filter out user's own content
    const filterUserContent = (items: any[]) => {
      if (!user) return items;
      return items.filter((item) => {
        // For plans and posts, check author._id
        if (item.author && item.author._id) {
          return item.author._id !== user.userId;
        }
        // For people, check _id directly
        if (item._id) {
          return item._id !== user.userId;
        }
        return true;
      });
    };

    switch (selectedFilter) {
      case 'plans':
        return filterUserContent(discoveryData.plans);
      case 'posts':
        return filterUserContent(discoveryData.posts);
      case 'people':
        return filterUserContent(discoveryData.people);
      case 'all':
      default: {
        // For "All" tab, show trending content (plans and posts) by default, or all data if there's a search query
        const allData = searchQuery.trim()
          ? [
              ...discoveryData.plans,
              ...discoveryData.posts,
              ...discoveryData.people,
            ]
          : [
              ...discoveryData.plans,
              ...discoveryData.posts,
            ];
        return filterUserContent(allData);
      }
    }
  };

  const currentData = getCurrentData();
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Intersection observer for infinite scrolling
  useEffect(() => {
    if (selectedFilter !== 'all' || !hasMore || isLoadingMore) return;

    const currentObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );

    if (sentinelRef.current) {
      currentObserver.observe(sentinelRef.current);
    }

    observer.current = currentObserver;

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, selectedFilter, loadMore]);

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'plans', label: 'Plans' },
    { value: 'posts', label: 'Posts' },
    { value: 'people', label: 'People' },
  ];

  const handlePostDeleted = (postId: string) => {
    setDiscoveryData(prev => ({
      ...prev,
      posts: prev.posts.filter(post => post._id !== postId)
    }));
  };

  const renderContentItem = (item: any, type: FilterType) => {
    switch (type) {
      case 'plans':
        return <FeedPlan key={item._id} plan={item} />;
      case 'posts':
        return (
          <PostItem 
            key={item._id} 
            post={item} 
            currentUserId={user?.userId}
            onPostDeleted={handlePostDeleted}
          />
        );
      case 'people':
        return <PersonItem key={item._id} person={item} />;
      default:
        return null;
    }
  };

  return (
    <div className='flex flex-col'>
      <main className='flex-1 p-6 max-w-7xl mx-auto w-full'>
        {/* Full width search bar like Twitter */}
        <div className='mb-6 w-full'>
          <SearchInput
            placeholder='Search for travel plans, posts, or people...'
            fullWidth={true}
          />
        </div>

        {/* Filter Tabs */}
        <HeaderTabs
          tabs={filterOptions.map((option) => ({
            label: option.label,
            value: option.value,
            onClick: () => {
              setSelectedFilter(option.value);
              // Trigger search for the new tab if there's a search query
              if (searchQuery.trim()) {
                setTimeout(() => handleSearch(), 0);
              }
            },
          }))}
          activeTab={selectedFilter}
          onTabChange={(value) => {
            setSelectedFilter(value as FilterType);
            // Trigger search for the new tab if there's a search query
            if (searchQuery.trim()) {
              setTimeout(() => handleSearch(), 0);
            }
          }}
          className='mb-6'
        />

        {/* Content */}
        <div className='flex flex-col gap-8'>
          {isLoading && (
            <div className='text-center py-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
              <p className='text-muted-foreground'>
                {selectedFilter === 'plans'
                  ? 'Loading plans...'
                  : 'Loading content...'}
              </p>
            </div>
          )}

          {error && (
            <div className='text-center py-12'>
              <div className='text-destructive mb-4'>
                <svg
                  className='h-12 w-12 mx-auto mb-2'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
              </div>
              <p className='text-destructive font-medium mb-2'>
                Something went wrong
              </p>
              <p className='text-muted-foreground text-sm'>{error}</p>
              <Button
                variant='outline'
                className='mt-4'
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          )}

          {!isLoading &&
            !error &&
            currentData &&
            currentData.length > 0 &&
            currentData.map((item: any) => {
              // Render different components based on content type
              if (
                selectedFilter === 'plans' ||
                (selectedFilter === 'all' && 'destination' in item)
              ) {
                return renderContentItem(item, 'plans');
              } else if (
                selectedFilter === 'posts' ||
                (selectedFilter === 'all' && 'content' in item)
              ) {
                return renderContentItem(item, 'posts');
              } else if (
                selectedFilter === 'people' ||
                (selectedFilter === 'all' && 'followerCount' in item)
              ) {
                return renderContentItem(item, 'people');
              }
              return null;
            })}

          {!isLoading && !error && currentData && currentData.length === 0 && (
            <div className='text-center py-12'>
              <div className='text-muted-foreground mb-4'>
                <svg
                  className='h-12 w-12 mx-auto mb-2'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                  />
                </svg>
              </div>
              <p className='text-muted-foreground font-medium mb-2'>
                {searchQuery
                  ? selectedFilter === 'plans'
                    ? 'No plans found'
                    : 'No results found'
                  : selectedFilter === 'plans'
                    ? 'No plans available'
                    : 'No content available'}
              </p>
              <p className='text-muted-foreground text-sm'>
                {searchQuery
                  ? selectedFilter === 'plans'
                    ? `No plans match "${searchQuery}"`
                    : `No ${selectedFilter} match "${searchQuery}"`
                  : selectedFilter === 'plans'
                    ? 'Check back later for new travel plans'
                    : `Check back later for new ${selectedFilter}`}
              </p>
            </div>
          )}

          {/* Infinite scroll sentinel and load more button */}
          {selectedFilter === 'all' &&
            !isLoading &&
            !error &&
            currentData.length > 0 && (
              <div className='mt-8'>
                {hasMore && <div ref={sentinelRef} className='h-4' />}
                {isLoadingMore && (
                  <div className='text-center py-4'>
                    <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto'></div>
                    <p className='text-muted-foreground text-sm mt-2'>
                      Loading more...
                    </p>
                  </div>
                )}
                {!hasMore && currentData.length > 0 && (
                  <div className='text-center py-4'>
                    <p className='text-muted-foreground text-sm'>
                      No more content to load
                    </p>
                  </div>
                )}
              </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default DiscoverPage;
