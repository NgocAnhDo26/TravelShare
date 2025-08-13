import { useState, useCallback } from 'react';
import API from '@/utils/axiosInstance';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UseBookmarkToggleProps {
  targetId: string;
  initialIsBookmarked: boolean;
  onModel: 'TravelPlan' | 'Post';
}

export const useBookmarkToggle = ({
  targetId,
  initialIsBookmarked,
  onModel,
}: UseBookmarkToggleProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);

  const handleToggleBookmark = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      toast.error('Please log in to save items.');
      navigate('/login');
      return;
    }

    if (!targetId) return;

    setIsBookmarked(prev => !prev);

    const apiPath = onModel === 'TravelPlan' ? `/plans/${targetId}/bookmark` : `/posts/${targetId}/bookmark`;

    try {
      const { data } = await API.post(apiPath);
      setIsBookmarked(data.bookmarked);
      toast.success(data.bookmarked ? 'Saved successfully!' : 'Removed from saved items.');
    } catch (error) {
      setIsBookmarked(prev => !prev);
      console.error('Failed to toggle bookmark:', error);
      toast.error('An error occurred. Please try again.');
    }
  }, [user, navigate, targetId, onModel]);

  return { isBookmarked, handleToggleBookmark };
};
