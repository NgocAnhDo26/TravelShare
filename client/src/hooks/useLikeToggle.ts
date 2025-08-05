import { useState, useRef, useEffect, useCallback } from 'react';
import API from '../utils/axiosInstance';
import toast from 'react-hot-toast';

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
  // UI state for immediate visual feedback
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [pop, setPop] = useState(false); // For animation

  // Refs to manage state across renders without causing re-renders
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  // Stores the original state from the server before any clicks in the current sequence
  const serverStateRef = useRef({ isLiked: initialIsLiked, likesCount: initialLikesCount });
  // Stores the user's final intended state after a sequence of rapid clicks
  const intendedStateRef = useRef({ isLiked: initialIsLiked });

  // Effect to reset the hook's state if the component re-renders with a new target item
  useEffect(() => {
    setIsLiked(initialIsLiked);
    setLikesCount(initialLikesCount);
    serverStateRef.current = { isLiked: initialIsLiked, likesCount: initialLikesCount };
    intendedStateRef.current = { isLiked: initialIsLiked };
  }, [initialIsLiked, initialLikesCount, targetId]);

  // Cleanup the debounce timer when the component unmounts
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleToggleLike = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation?.();

      // 1. Perform an optimistic UI update for immediate feedback.
      // This makes the interface feel responsive.
      setPop(true);
      setTimeout(() => setPop(false), 200);

      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      setLikesCount((prevCount) => (newLikedState ? prevCount + 1 : prevCount - 1));

      // 2. Record the user's latest intended state. This is the crucial step.
      // No matter how many times they click, this ref will hold the final desired state.
      intendedStateRef.current = { isLiked: newLikedState };

      // 3. Clear any pending API call and start a new debounce timer.
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(async () => {
        // 4. After 700ms of no clicks, this code runs.
        // It checks if the user's final intention is different from the original server state.
        if (intendedStateRef.current.isLiked !== serverStateRef.current.isLiked) {
          try {
            // If there's a difference, send a single API request to toggle the like.
            await API.post(`${apiPath}/${targetId}/like`);

            // On success, update our reference of the "server state" to the new state.
            // This ensures subsequent clicks are based on the new reality.
            serverStateRef.current = {
                isLiked: intendedStateRef.current.isLiked,
                // We read the latest count from the state, which was optimistically updated
                likesCount: isLiked ? likesCount + 1 : likesCount -1,
             };
          } catch (err) {
            // If the API call fails, revert the UI back to the last known good state.
            toast.error('Could not update like status.');
            setIsLiked(serverStateRef.current.isLiked);
            setLikesCount(serverStateRef.current.likesCount);
          }
        }
      }, 700); // Debounce window of 700ms
    },
    [isLiked, likesCount, apiPath, targetId],
  );

  return { isLiked, likesCount, pop, handleToggleLike };
}