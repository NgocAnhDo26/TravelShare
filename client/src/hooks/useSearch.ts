import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '@/utils/axiosInstance';
import type {
  SearchResponse,
  SearchType,
  SearchTravelPlan,
  SearchPost,
  SearchUser,
} from '@/types/search';

export const useSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const type = (searchParams.get('type') || 'all') as SearchType;

  const [results, setResults] = useState<{
    plans: SearchTravelPlan[];
    posts: SearchPost[];
    users: SearchUser[];
  }>({
    plans: [],
    posts: [],
    users: [],
  });

  const [totalCounts, setTotalCounts] = useState({
    plans: 0,
    posts: 0,
    users: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Individual pagination states for "all" tab
  const [individualPages, setIndividualPages] = useState({
    plans: 1,
    posts: 1,
    users: 1,
  });

  const [individualHasMore, setIndividualHasMore] = useState({
    plans: true,
    posts: true,
    users: true,
  });

  const [individualLoading, setIndividualLoading] = useState({
    plans: false,
    posts: false,
    users: false,
  });

  // Add ref to prevent duplicate calls
  const isCallInProgress = useRef(false);
  const lastCallKey = useRef('');

  const fetchSearchResults = useCallback(
    async (page: number, append: boolean) => {
      if (!query.trim()) {
        setResults({ plans: [], posts: [], users: [] });
        setTotalCounts({ plans: 0, posts: 0, users: 0 });
        setIsLoading(false);
        return;
      }

      // Create a unique key for this call to prevent duplicates
      const callKey = `${query}-${type}-${page}`;

      // Prevent duplicate calls
      if (isCallInProgress.current && lastCallKey.current === callKey) {
        return;
      }

      isCallInProgress.current = true;
      lastCallKey.current = callKey;

      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        const response = await API.get<SearchResponse>(
          `/search?q=${encodeURIComponent(query)}&page=${page}&limit=12&type=${type}`,
        );

        if (response.data.success) {
          const data = response.data.data;
          const pagination = response.data.data.pagination;

          setResults((prev) => ({
            plans: append ? [...prev.plans, ...data.plans] : data.plans,
            posts: append ? [...prev.posts, ...data.posts] : data.posts,
            users: append ? [...prev.users, ...data.users] : data.users,
          }));

          // Update total counts only on first page
          if (page === 1) {
            setTotalCounts({
              plans: data.totalPlans,
              posts: data.totalPosts,
              users: data.totalUsers,
            });
          }

          setHasMore(pagination.hasNextPage);
          setCurrentPage(page);
        } else {
          setError('Failed to fetch search results');
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('An error occurred while searching');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        isCallInProgress.current = false;
      }
    },
    [query, type],
  );

  useEffect(() => {
    // Only reset total counts when the query changes, not when type changes
    if (query.trim()) {
      setTotalCounts({ plans: 0, posts: 0, users: 0 });
    }
  }, [query]);

  // Function to load all content types separately for "all" tab
  const loadAllContentTypes = useCallback(async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load all content types in parallel
      const [plansResponse, postsResponse, usersResponse] = await Promise.all([
        API.get<SearchResponse>(
          `/search?q=${encodeURIComponent(query)}&page=1&limit=12&type=plans`,
        ),
        API.get<SearchResponse>(
          `/search?q=${encodeURIComponent(query)}&page=1&limit=12&type=posts`,
        ),
        API.get<SearchResponse>(
          `/search?q=${encodeURIComponent(query)}&page=1&limit=12&type=users`,
        ),
      ]);

      if (
        plansResponse.data.success &&
        postsResponse.data.success &&
        usersResponse.data.success
      ) {
        setResults({
          plans: plansResponse.data.data.plans,
          posts: postsResponse.data.data.posts,
          users: usersResponse.data.data.users,
        });

        setTotalCounts({
          plans: plansResponse.data.data.totalPlans,
          posts: postsResponse.data.data.totalPosts,
          users: usersResponse.data.data.totalUsers,
        });

        setIndividualHasMore({
          plans: plansResponse.data.data.pagination.hasNextPage,
          posts: postsResponse.data.data.pagination.hasNextPage,
          users: usersResponse.data.data.pagination.hasNextPage,
        });
      }
    } catch (err) {
      console.error('Error loading all content types:', err);
      setError('An error occurred while searching');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    setResults({ plans: [], posts: [], users: [] });
    setCurrentPage(1);
    setHasMore(true);
    // Reset individual pagination states
    setIndividualPages({ plans: 1, posts: 1, users: 1 });
    setIndividualHasMore({ plans: true, posts: true, users: true });
    setIndividualLoading({ plans: false, posts: false, users: false });

    if (type === 'all') {
      // For "all" tab, load each content type separately
      loadAllContentTypes();
    } else {
      fetchSearchResults(1, false);
    }
  }, [query, type, fetchSearchResults, loadAllContentTypes]);

  const loadMore = useCallback(() => {
    console.log(
      'loadMore called. isLoadingMore:',
      isLoadingMore,
      'hasMore:',
      hasMore,
      'currentPage:',
      currentPage,
    );
    if (!isLoadingMore && hasMore) {
      fetchSearchResults(currentPage + 1, true);
    }
  }, [isLoadingMore, hasMore, currentPage, fetchSearchResults]);

  // Function to load more for a specific content type in "all" tab
  const loadMoreForType = useCallback(
    async (contentType: 'plans' | 'posts' | 'users') => {
      if (
        !query.trim() ||
        type !== 'all' ||
        individualLoading[contentType] ||
        !individualHasMore[contentType]
      ) {
        return;
      }

      const nextPage = individualPages[contentType] + 1;

      setIndividualLoading((prev) => ({ ...prev, [contentType]: true }));

      try {
        const response = await API.get<SearchResponse>(
          `/search?q=${encodeURIComponent(query)}&page=${nextPage}&limit=12&type=${contentType}`,
        );

        if (response.data.success) {
          const data = response.data.data;
          const pagination = response.data.data.pagination;

          setResults((prev) => ({
            ...prev,
            [contentType]: [...prev[contentType], ...data[contentType]],
          }));

          setIndividualPages((prev) => ({ ...prev, [contentType]: nextPage }));
          setIndividualHasMore((prev) => ({
            ...prev,
            [contentType]: pagination.hasNextPage,
          }));
        }
      } catch (err) {
        console.error(`Error loading more ${contentType}:`, err);
      } finally {
        setIndividualLoading((prev) => ({ ...prev, [contentType]: false }));
      }
    },
    [query, type, individualPages, individualHasMore, individualLoading],
  );

  const handleTabChange = (newType: string) => {
    setSearchParams({ q: query, type: newType as SearchType });
  };

  // Function to update user follow status
  const updateUserFollowStatus = useCallback(
    (userId: string, isFollowing: boolean, followerCountChange: number) => {
      setResults((prev) => ({
        ...prev,
        users: prev.users.map((user) =>
          user._id === userId
            ? {
                ...user,
                isFollowing,
                followerCount: user.followerCount + followerCountChange,
              }
            : user,
        ),
      }));
    },
    [],
  );

  return {
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
    // Individual pagination for "all" tab
    individualHasMore,
    individualLoading,
    loadMoreForType,
    updateUserFollowStatus,
    // Add debugging info
    currentPage,
  };
};
