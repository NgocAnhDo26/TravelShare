/* eslint-disable @typescript-eslint/no-explicit-any */
import FeedPlan from '@/components/FeedPlan';
import PostItem from '../../components/PostItem';
import PersonItem from '@/components/PersonItem';
import type { FilterType, DiscoveryData } from '@/types/discovery';
import API from '@/utils/axiosInstance';
import { useEffect, useState, useCallback, useRef } from 'react';
import { SearchInput } from '@/components/SearchInput';
import { Button } from '@/components/ui/button';
import HeaderTabs from '@/components/HeaderTabs';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'react-router-dom';
const DiscoverPage = () => {
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
  // Per-tab pagination state
  const [pagePlans, setPagePlans] = useState(1);
  const [pagePosts, setPagePosts] = useState(1);
  const [pagePeople, setPagePeople] = useState(1);
  const [hasMorePlans, setHasMorePlans] = useState(true);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [hasMorePeople, setHasMorePeople] = useState(true);
  const [loadingMorePlans, setLoadingMorePlans] = useState(false);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [loadingMorePeople, setLoadingMorePeople] = useState(false);

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
      const params: Record<string, string | number> = { limit: 12 };
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

  const fetchPlans = useCallback(
    async (query?: string, page = 1, limit = 12) => {
      try {
        const params: Record<string, string | number> = query
          ? { q: query, page, limit }
          : { page, limit };
        const res = await API.get('/discovery/plans', { params });
        // If server starts supporting pagination meta, adapt here
        return {
          data: res.data || [],
          hasMore: (res.data?.length || 0) === limit,
        };
      } catch (err) {
        console.error('Error fetching plans:', err);
        return { data: [], hasMore: false };
      }
    },
    [],
  );

  const fetchPosts = useCallback(
    async (query?: string, page = 1, limit = 12) => {
      try {
        const params: Record<string, string | number> = query
          ? { q: query, page, limit }
          : { page, limit };
        const res = await API.get('/discovery/posts', { params });
        return {
          data: res.data || [],
          hasMore: (res.data?.length || 0) === limit,
        };
      } catch (err) {
        console.error('Error fetching posts:', err);
        return { data: [], hasMore: false };
      }
    },
    [],
  );

  const fetchPeople = useCallback(
    async (query?: string, page = 1, limit = 12) => {
      try {
        const params: Record<string, string | number> = query
          ? { q: query, page, limit }
          : { page, limit };
        const res = await API.get('/discovery/people', { params });
        return {
          data: res.data || [],
          hasMore: (res.data?.length || 0) === limit,
        };
      } catch (err) {
        console.error('Error fetching people:', err);
        return { data: [], hasMore: false };
      }
    },
    [],
  );

  // fetchAllData was inlined into the tab/search effect above

  // Refetch data whenever the tab or search query changes
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (selectedFilter === 'all') {
          if (searchQuery.trim()) {
            // When searching, fetch all three categories
            const [plansRes, postsRes, peopleRes] = await Promise.all([
              fetchPlans(searchQuery),
              fetchPosts(searchQuery),
              fetchPeople(searchQuery),
            ]);
            if (!cancelled)
              setDiscoveryData({
                plans: plansRes.data,
                posts: postsRes.data,
                people: peopleRes.data,
              });
            setCursor(null);
            setHasMore(false);
          } else {
            // Default All: trending plans & posts with pagination
            const result = await fetchTrendingPlans();
            const plans = result.data.filter(
              (item: any) =>
                item.type === 'TravelPlan' || 'destination' in item,
            );
            const posts = result.data.filter(
              (item: any) => item.type === 'Post' || 'content' in item,
            );
            if (!cancelled) setDiscoveryData({ plans, posts, people: [] });
            setCursor(result.pagination.next_cursor);
            setHasMore(result.pagination.has_next_page);
          }
          return;
        }

        // Individual tabs always refetch fresh data
        if (selectedFilter === 'plans') {
          const { data: plans, hasMore } = await fetchPlans(
            searchQuery.trim() || undefined,
            1,
            12,
          );
          if (!cancelled) {
            setDiscoveryData((prev) => ({ ...prev, plans }));
            setPagePlans(1);
            setHasMorePlans(hasMore);
          }
          setCursor(null);
          setHasMore(false);
          return;
        }
        if (selectedFilter === 'posts') {
          const { data: posts, hasMore } = await fetchPosts(
            searchQuery.trim() || undefined,
            1,
            12,
          );
          if (!cancelled) {
            setDiscoveryData((prev) => ({ ...prev, posts }));
            setPagePosts(1);
            setHasMorePosts(hasMore);
          }
          setCursor(null);
          setHasMore(false);
          return;
        }
        if (selectedFilter === 'people') {
          const { data: people, hasMore } = await fetchPeople(
            searchQuery.trim() || undefined,
            1,
            12,
          );
          if (!cancelled) {
            setDiscoveryData((prev) => ({ ...prev, people }));
            setPagePeople(1);
            setHasMorePeople(hasMore);
          }
          setCursor(null);
          setHasMore(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching data for tab:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [
    selectedFilter,
    searchQuery,
    fetchTrendingPlans,
    fetchPlans,
    fetchPosts,
    fetchPeople,
  ]);

  // Removed: one-off posts loader. All tabs now refetch via the effect above.

  // Load more function for infinite scrolling
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || selectedFilter !== 'all') return;

    setIsLoadingMore(true);
    try {
      const result = await fetchTrendingPlans(cursor);

      // Separate plans and posts from the trending results
      const newPlans = result.data.filter(
        (item: any) => item.type === 'TravelPlan' || 'destination' in item,
      );
      const newPosts = result.data.filter(
        (item: any) => item.type === 'Post' || 'content' in item,
      );

      // Prevent duplicates by filtering out items that already exist
      const existingPlanIds = new Set(
        discoveryData.plans.map((plan: any) => plan._id),
      );
      const existingPostIds = new Set(
        discoveryData.posts.map((post: any) => post._id),
      );

      const filteredNewPlans = newPlans.filter(
        (plan: any) => !existingPlanIds.has(plan._id),
      );
      const filteredNewPosts = newPosts.filter(
        (post: any) => !existingPostIds.has(post._id),
      );

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
  // Search handler logic moved to the effect above

  // Get current data based on selected filter
  const getCurrentData = () => {
    // Filter out user's own content
    const filterUserContent = (items: any[]) => {
      if (!user) return items;
      return items.filter((item) => {
        // For plans and posts, check author._id
        if (item.author && item.author._id) {
          // For Posts tab, requirement is to show all public posts including user's
          if (selectedFilter === 'posts') return true;
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
          : [...discoveryData.plans, ...discoveryData.posts];
        return filterUserContent(allData);
      }
    }
  };

  const currentData = getCurrentData();
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const sentinelPlansRef = useRef<HTMLDivElement | null>(null);
  const sentinelPostsRef = useRef<HTMLDivElement | null>(null);
  const sentinelPeopleRef = useRef<HTMLDivElement | null>(null);
  // Track whether user has scrolled in each tab to avoid auto-loading page 2 immediately
  const hasUserScrolledPlans = useRef(false);
  const hasUserScrolledPosts = useRef(false);
  const hasUserScrolledPeople = useRef(false);

  // Intersection observer for infinite scrolling
  useEffect(() => {
    if (selectedFilter !== 'all' || !hasMore || isLoadingMore) return;

    const rootEl = sentinelRef.current?.closest(
      '.overflow-auto, .overflow-y-auto',
    ) as Element | null;

    const currentObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1, root: rootEl ?? null, rootMargin: '150px' },
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

  // Infinite scroll for Plans tab
  useEffect(() => {
    if (selectedFilter !== 'plans' || isLoading) return;
    hasUserScrolledPlans.current = false; // reset on tab/select change
    const rootEl = sentinelPlansRef.current?.closest(
      '.overflow-auto, .overflow-y-auto',
    ) as Element | null;
    const onScroll = () => {
      const el = rootEl as HTMLElement | null;
      if (el && el.scrollTop > 0) hasUserScrolledPlans.current = true;
    };
    if (rootEl) rootEl.addEventListener('scroll', onScroll, { passive: true });
    const plansObserver = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMorePlans &&
          !loadingMorePlans &&
          hasUserScrolledPlans.current
        ) {
          (async () => {
            setLoadingMorePlans(true);
            const nextPage = pagePlans + 1;
            const { data: morePlans, hasMore } = await fetchPlans(
              searchQuery.trim() || undefined,
              nextPage,
              12,
            );
            let addedCount = 0;
            setDiscoveryData((prev) => {
              const filtered = morePlans.filter(
                (p: any) => !prev.plans.some((x: any) => x._id === p._id),
              );
              addedCount = filtered.length;
              return { ...prev, plans: [...prev.plans, ...filtered] };
            });
            setPagePlans(nextPage);
            setHasMorePlans(hasMore && addedCount > 0);
            setLoadingMorePlans(false);
          })();
        }
      },
      { threshold: 0.1, root: rootEl ?? null, rootMargin: '0px' },
    );
    if (sentinelPlansRef.current)
      plansObserver.observe(sentinelPlansRef.current);
    return () => {
      plansObserver.disconnect();
      if (rootEl) rootEl.removeEventListener('scroll', onScroll);
    };
  }, [
    selectedFilter,
    isLoading,
    hasMorePlans,
    loadingMorePlans,
    pagePlans,
    fetchPlans,
    searchQuery,
  ]);

  // Infinite scroll for Posts tab
  useEffect(() => {
    if (selectedFilter !== 'posts' || isLoading) return;
    hasUserScrolledPosts.current = false;
    const rootEl = sentinelPostsRef.current?.closest(
      '.overflow-auto, .overflow-y-auto',
    ) as Element | null;
    const onScroll = () => {
      const el = rootEl as HTMLElement | null;
      if (el && el.scrollTop > 0) hasUserScrolledPosts.current = true;
    };
    if (rootEl) rootEl.addEventListener('scroll', onScroll, { passive: true });
    const postsObserver = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMorePosts &&
          !loadingMorePosts &&
          hasUserScrolledPosts.current
        ) {
          (async () => {
            setLoadingMorePosts(true);
            const nextPage = pagePosts + 1;
            const { data: morePosts, hasMore } = await fetchPosts(
              searchQuery.trim() || undefined,
              nextPage,
              12,
            );
            let addedCount = 0;
            setDiscoveryData((prev) => {
              const filtered = morePosts.filter(
                (p: any) => !prev.posts.some((x: any) => x._id === p._id),
              );
              addedCount = filtered.length;
              return { ...prev, posts: [...prev.posts, ...filtered] };
            });
            setPagePosts(nextPage);
            setHasMorePosts(hasMore && addedCount > 0);
            setLoadingMorePosts(false);
          })();
        }
      },
      { threshold: 0.1, root: rootEl ?? null, rootMargin: '0px' },
    );
    if (sentinelPostsRef.current)
      postsObserver.observe(sentinelPostsRef.current);
    return () => {
      postsObserver.disconnect();
      if (rootEl) rootEl.removeEventListener('scroll', onScroll);
    };
  }, [
    selectedFilter,
    isLoading,
    hasMorePosts,
    loadingMorePosts,
    pagePosts,
    fetchPosts,
    searchQuery,
  ]);

  // Infinite scroll for People tab
  useEffect(() => {
    if (selectedFilter !== 'people' || isLoading) return;
    hasUserScrolledPeople.current = false;
    const rootEl = sentinelPeopleRef.current?.closest(
      '.overflow-auto, .overflow-y-auto',
    ) as Element | null;
    const onScroll = () => {
      const el = rootEl as HTMLElement | null;
      if (el && el.scrollTop > 0) hasUserScrolledPeople.current = true;
    };
    if (rootEl) rootEl.addEventListener('scroll', onScroll, { passive: true });
    const peopleObserver = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMorePeople &&
          !loadingMorePeople &&
          hasUserScrolledPeople.current
        ) {
          (async () => {
            setLoadingMorePeople(true);
            const nextPage = pagePeople + 1;
            const { data: morePeople, hasMore } = await fetchPeople(
              searchQuery.trim() || undefined,
              nextPage,
              12,
            );
            let addedCount = 0;
            setDiscoveryData((prev) => {
              const filtered = morePeople.filter(
                (p: any) => !prev.people.some((x: any) => x._id === p._id),
              );
              addedCount = filtered.length;
              return { ...prev, people: [...prev.people, ...filtered] };
            });
            setPagePeople(nextPage);
            setHasMorePeople(hasMore && addedCount > 0);
            setLoadingMorePeople(false);
          })();
        }
      },
      { threshold: 0.1, root: rootEl ?? null, rootMargin: '0px' },
    );
    if (sentinelPeopleRef.current)
      peopleObserver.observe(sentinelPeopleRef.current);
    return () => {
      peopleObserver.disconnect();
      if (rootEl) rootEl.removeEventListener('scroll', onScroll);
    };
  }, [
    selectedFilter,
    isLoading,
    hasMorePeople,
    loadingMorePeople,
    pagePeople,
    fetchPeople,
    searchQuery,
  ]);

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'plans', label: 'Plans' },
    { value: 'posts', label: 'Posts' },
    { value: 'people', label: 'People' },
  ];

  const handlePostDeleted = (postId: string) => {
    setDiscoveryData((prev) => ({
      ...prev,
      posts: prev.posts.filter((post) => post._id !== postId),
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
            onClick: () => setSelectedFilter(option.value),
          }))}
          activeTab={selectedFilter}
          onTabChange={(value) => setSelectedFilter(value as FilterType)}
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
                  : selectedFilter === 'posts'
                    ? 'Loading posts...'
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

          {selectedFilter === 'plans' && !isLoading && !error && (
            <div className='mt-4'>
              {hasMorePlans && <div ref={sentinelPlansRef} className='h-4' />}
              {loadingMorePlans && (
                <div className='text-center py-4'>
                  <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto'></div>
                  <p className='text-muted-foreground text-sm mt-2'>
                    Loading more plans...
                  </p>
                </div>
              )}
            </div>
          )}

          {selectedFilter === 'posts' && !isLoading && !error && (
            <div className='mt-4'>
              {hasMorePosts && <div ref={sentinelPostsRef} className='h-4' />}
              {loadingMorePosts && (
                <div className='text-center py-4'>
                  <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto'></div>
                  <p className='text-muted-foreground text-sm mt-2'>
                    Loading more posts...
                  </p>
                </div>
              )}
            </div>
          )}

          {selectedFilter === 'people' && !isLoading && !error && (
            <div className='mt-4'>
              {hasMorePeople && <div ref={sentinelPeopleRef} className='h-4' />}
              {loadingMorePeople && (
                <div className='text-center py-4'>
                  <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto'></div>
                  <p className='text-muted-foreground text-sm mt-2'>
                    Loading more people...
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
