import { useState, useRef, useEffect, useCallback } from 'react';
import API from '../utils/axiosInstance';

export type OnModel = 'TravelPlan' | 'Post';

interface UseLikeToggleOptions {
  targetId: string;
  initialIsLiked: boolean;
  initialLikesCount: number;
  onModel: OnModel;
  apiPath: string; // e.g. '/plans' or '/posts'
}

export function useLikeToggle({
  targetId,
  initialIsLiked,
  initialLikesCount,
  apiPath,
}: UseLikeToggleOptions) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [pop, setPop] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clean up timer on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Optionally, update state if props change (e.g. on navigation)
  useEffect(() => {
    setIsLiked(initialIsLiked);
    setLikesCount(initialLikesCount);
  }, [initialIsLiked, initialLikesCount, targetId]);

  const handleToggleLike = useCallback(
    (e: React.MouseEvent) => {
      e?.stopPropagation?.();
      setPop(true);
      setTimeout(() => setPop(false), 200);
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      setLikesCount((count) => (newLikedState ? count + 1 : count - 1));
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(async () => {
        try {
          await API.post(`${apiPath}/${targetId}/like`);
          // Optionally: refetch or update state from server
        } catch (err) {
          setIsLiked((prev) => !prev);
          setLikesCount((count) => (newLikedState ? count - 1 : count + 1));
        }
      }, 700);
    },
    [isLiked, apiPath, targetId],
  );

  return { isLiked, likesCount, pop, handleToggleLike };
}
