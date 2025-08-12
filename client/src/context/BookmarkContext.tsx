import { createContext, useContext, useState, useEffect, useCallback,type ReactNode } from 'react';
import API from '@/utils/axiosInstance';
import { useAuth } from './AuthContext';

interface BookmarkContextType {
  bookmarkedIds: Set<string>;
  toggleBookmark: (targetId: string, targetModel: 'TravelPlan' | 'Post') => Promise<void>;
  isLoading: boolean;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export const BookmarkProvider = ({ children }: { children: ReactNode }) => {  
  const { user } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookmarkedIds = useCallback(async () => {
    if (!user) {
      setBookmarkedIds(new Set());
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await API.get('/bookmarks/me/ids'); 
      const ids = response.data || [];
      setBookmarkedIds(new Set(ids));
    } catch (error) {
      console.error("Failed to fetch bookmarked IDs:", error);
      setBookmarkedIds(new Set());
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookmarkedIds();
  }, [fetchBookmarkedIds]);

  const toggleBookmark = async (targetId: string, targetModel: 'TravelPlan' | 'Post') => {
    const apiPath = targetModel === 'TravelPlan' 
      ? `/plans/${targetId}/bookmark` 
      : `/posts/${targetId}/bookmark`;

    const originalIds = new Set(bookmarkedIds);
    const newBookmarkedIds = new Set(bookmarkedIds);
    if (newBookmarkedIds.has(targetId)) {
      newBookmarkedIds.delete(targetId);
    } else {
      newBookmarkedIds.add(targetId);
    }
    setBookmarkedIds(newBookmarkedIds);

    try {
      await API.post(apiPath);
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
      setBookmarkedIds(originalIds); 
    }
  };

  const value = { bookmarkedIds, toggleBookmark, isLoading };

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
};

export const useBookmarks = () => {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
};
