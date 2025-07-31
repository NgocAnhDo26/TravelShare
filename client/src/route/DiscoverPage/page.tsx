import FeedPlan from '@/components/FeedPlan';
import PostItem from '@/components/PostItem';
import PersonItem from '@/components/PersonItem';
import type { FilterType, DiscoveryData } from '@/types/discovery';
import API from '@/utils/axiosInstance';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HeaderTabs from '@/components/HeaderTabs';
import { useAuth } from '@/context/AuthContext';

interface DiscoverPageProps {}

const DiscoverPage: React.FC<DiscoverPageProps> = () => {
  const { user } = useAuth();
  const [discoveryData, setDiscoveryData] = useState<DiscoveryData>({
    plans: [],
    posts: [],
    people: []
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

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
        pagination: res.data.pagination || { next_cursor: null, has_next_page: false }
      };
    } catch (err) {
      console.error('Error fetching trending plans:', err);
      return { data: [], pagination: { next_cursor: null, has_next_page: false } };
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

  const fetchAllData = useCallback(async (query?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [plans, posts, people] = await Promise.all([
        fetchPlans(query),
        fetchPosts(query),
        fetchPeople(query)
      ]);

      setDiscoveryData({ plans, posts, people });
    } catch (err) {
      console.error('Error fetching discovery data:', err);
      setError('Failed to load content. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPlans, fetchPosts, fetchPeople]);

  // Initial data load - fetch trending plans
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setCursor(null);
        setHasMore(true);
        
        // Fetch trending plans for initial load using the discover endpoint
        const result = await fetchTrendingPlans();
        setDiscoveryData({ plans: result.data, posts: [], people: [] });
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
      
      // Prevent duplicates by filtering out items that already exist
      const existingIds = new Set(discoveryData.plans.map((plan: any) => plan._id));
      const newPlans = result.data.filter((plan: any) => !existingIds.has(plan._id));
      
      setDiscoveryData(prev => ({
        ...prev,
        plans: [...prev.plans, ...newPlans]
      }));
      setCursor(result.pagination.next_cursor);
      setHasMore(result.pagination.has_next_page);
    } catch (err) {
      console.error('Error loading more plans:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, selectedFilter, cursor, fetchTrendingPlans, discoveryData.plans]);

  // Search function
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      // If no search query, reset to trending plans for the current tab
      if (selectedFilter === 'all') {
        const result = await fetchTrendingPlans();
        setDiscoveryData({ plans: result.data, posts: [], people: [] });
        setCursor(result.pagination.next_cursor);
        setHasMore(result.pagination.has_next_page);
      } else {
        // For specific tabs, clear that tab's data
        setDiscoveryData(prev => ({
          ...prev,
          [selectedFilter === 'plans' ? 'plans' : selectedFilter === 'posts' ? 'posts' : 'people']: []
        }));
        setCursor(null);
        setHasMore(false);
      }
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      switch (selectedFilter) {
        case 'plans':
          const plans = await fetchPlans(searchQuery);
          setDiscoveryData(prev => ({ ...prev, plans }));
          break;
        case 'posts':
          const posts = await fetchPosts(searchQuery);
          setDiscoveryData(prev => ({ ...prev, posts }));
          break;
        case 'people':
          const people = await fetchPeople(searchQuery);
          setDiscoveryData(prev => ({ ...prev, people }));
          break;
        case 'all':
        default:
          await fetchAllData(searchQuery);
          break;
      }
    } catch (err) {
      console.error('Error searching:', err);
      setError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, selectedFilter, fetchPlans, fetchPosts, fetchPeople, fetchAllData]);

  // Get current data based on selected filter
  const getCurrentData = () => {
    // Filter out user's own content
    const filterUserContent = (items: any[]) => {
      if (!user) return items;
      return items.filter(item => {
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
      default:
        // For "All" tab, show trending plans by default, or all data if there's a search query
        const allData = searchQuery.trim() 
          ? [...discoveryData.plans, ...discoveryData.posts, ...discoveryData.people]
          : discoveryData.plans;
        return filterUserContent(allData);
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
      { threshold: 0.1 }
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

  return (
    <div className='max-w-3xl w-full p-4 self-center'>
      {/* Search Bar */}
      <div className='mb-6 w-full'>
        <div className='relative flex gap-2'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              type='text'
              placeholder='Search for plans, posts, or people...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className='pl-10'
            />
          </div>
          <Button 
            onClick={handleSearch}
            disabled={isSearching}
            className='px-6 w-20 bg-gradient-to-r from-teal-500 to-blue-600 shadow-md shadow-teal-500/25 cursor-pointer'
          >
            {isSearching ? (
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
            ) : (
              'Search'
            )}
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <HeaderTabs 
        tabs={filterOptions.map(option => ({
          label: option.label,
          value: option.value,
          onClick: () => {
            setSelectedFilter(option.value);
            // Trigger search for the new tab if there's a search query
            if (searchQuery.trim()) {
              setTimeout(() => handleSearch(), 0);
            }
          }
        }))}
        activeTab={selectedFilter}
        onTabChange={(value) => {
          setSelectedFilter(value as FilterType);
          // Trigger search for the new tab if there's a search query
          if (searchQuery.trim()) {
            setTimeout(() => handleSearch(), 0);
          }
        }}
        className="mb-6"
      />

      {/* Content */}
      <div className='flex flex-col gap-8'>
        {isLoading && (
          <div className='text-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
            <p className='text-muted-foreground'>
              {selectedFilter === 'plans' ? 'Loading plans...' : 'Loading content...'}
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
            <p className='text-destructive font-medium mb-2'>Something went wrong</p>
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

        {!isLoading && !error && currentData && currentData.length > 0 && (
          currentData.map((item: any) => {
            // Render different components based on content type
            if (selectedFilter === 'plans' || (selectedFilter === 'all' && 'destination' in item)) {
              return <FeedPlan key={item._id} plan={item} />;
            } else if (selectedFilter === 'posts' || (selectedFilter === 'all' && 'content' in item)) {
              return <PostItem key={item._id} post={item} />;
            } else if (selectedFilter === 'people' || (selectedFilter === 'all' && 'followerCount' in item)) {
              return <PersonItem key={item._id} person={item} />;
            }
            return null;
          })
        )}

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
                ? (selectedFilter === 'plans' ? 'No plans found' : 'No results found') 
                : (selectedFilter === 'plans' ? 'No plans available' : 'No content available')}
            </p>
            <p className='text-muted-foreground text-sm'>
              {searchQuery
                ? (selectedFilter === 'plans' 
                    ? `No plans match "${searchQuery}"`
                    : `No ${selectedFilter} match "${searchQuery}"`)
                : (selectedFilter === 'plans' 
                    ? 'Check back later for new travel plans'
                    : `Check back later for new ${selectedFilter}`)}
            </p>
          </div>
        )}

        {/* Infinite scroll sentinel and load more button */}
        {selectedFilter === 'all' && !isLoading && !error && currentData.length > 0 && (
          <div className='mt-8'>
            {hasMore && (
              <div ref={sentinelRef} className='h-4' />
            )}
            {isLoadingMore && (
              <div className='text-center py-4'>
                <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto'></div>
                <p className='text-muted-foreground text-sm mt-2'>Loading more...</p>
              </div>
            )}
            {!hasMore && currentData.length > 0 && (
              <div className='text-center py-4'>
                <p className='text-muted-foreground text-sm'>No more content to load</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoverPage;
