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

  useEffect(() => {
    setResults({ plans: [], posts: [], users: [] });
    setCurrentPage(1);
    setHasMore(true);
    fetchSearchResults(1, false);
  }, [query, type, fetchSearchResults]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchSearchResults(currentPage + 1, true);
    }
  }, [isLoadingMore, hasMore, currentPage, fetchSearchResults]);

  const handleTabChange = (newType: string) => {
    setSearchParams({ q: query, type: newType as SearchType });
  };

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
  };
};
