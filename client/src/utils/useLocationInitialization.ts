import { useState, useEffect } from 'react';
import { LocationService, type UserLocation } from './locationService';

export function useLocationInitialization() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeLocation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const userLocation =
          await LocationService.initializeLocationForSession();

        if (isMounted) {
          setLocation(userLocation);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to get location',
          );
          console.error('Location initialization failed:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userLocation = await LocationService.getLocationSmart();
      setLocation(userLocation);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to refresh location',
      );
      console.error('Location refresh failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    location,
    isLoading,
    error,
    refreshLocation,
  };
}
