import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '@/utils/axiosInstance';
import type { SearchSuggestionsResponse, SearchSuggestion } from '@/types/search';

export const useSearchSuggestions = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle search input changes with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length > 0) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchSearchSuggestions(searchQuery.trim());
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const fetchSearchSuggestions = async (query: string) => {
    try {
      setIsLoading(true);
      const response = await API.get<SearchSuggestionsResponse>(
        `/search/suggestions?q=${encodeURIComponent(query)}&limit=5`
      );

      if (response.data.success) {
        const allSuggestions = [
          ...response.data.data.plans,
          ...response.data.data.users,
          ...response.data.data.posts,
        ];
        setSuggestions(allSuggestions);
        setShowSuggestions(allSuggestions.length > 0);
      }
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query?: string) => {
    const searchTerm = query || searchQuery;
    if (searchTerm.trim()) {
      // Navigate to explore page with search query
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setShowSuggestions(false);
      setSearchQuery('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    // Navigate directly to the specific item based on type
    if (suggestion.type === 'user') {
      // Navigate to other user profile using the ID
      navigate(`/profile/${suggestion.id}`);
    } else if (suggestion.type === 'plan') {
      // Navigate to plan details using the ID
      navigate(`/plans/${suggestion.id}`);
    } else if (suggestion.type === 'post') {
      // Navigate to post details using the ID
      navigate(`/posts/${suggestion.id}`);
    }

    setShowSuggestions(false);
    setSearchQuery('');
  };

  return {
    searchQuery,
    setSearchQuery,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    isLoading,
    handleSearch,
    handleKeyPress,
    handleSuggestionClick,
  };
};
