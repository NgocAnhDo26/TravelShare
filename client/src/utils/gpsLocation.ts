// Legacy file - now imports from the new LocationService
// This file exists for backward compatibility
import { LocationService } from './locationService';

export type { UserLocation } from './locationService';

// Re-export legacy functions
export const getStoredLocation =
  LocationService.getStoredLocation.bind(LocationService);
export const storeLocation =
  LocationService.storeLocation.bind(LocationService);
export const shouldRefreshLocation =
  LocationService.shouldRefreshLocation.bind(LocationService);
export const getCurrentLocationOrIP =
  LocationService.getCurrentLocationOrIP.bind(LocationService);
