import API from '@/utils/axiosInstance';
import { LOCATION_CONFIG, STORAGE_CONFIG } from '@/config/env';

const LOCATION_KEY = STORAGE_CONFIG.LOCATION_KEY;
const LOCATION_PERMISSION_KEY = STORAGE_CONFIG.PERMISSION_KEY;
const FIRST_LOGIN_PROMPT_KEY = STORAGE_CONFIG.FIRST_LOGIN_PROMPT_KEY;
const LOCATION_TTL_MS = LOCATION_CONFIG.CACHE_TTL_HOURS * 60 * 60 * 1000;
const LOCATION_REFRESH_THRESHOLD =
  LOCATION_CONFIG.AUTO_REFRESH_HOURS * 60 * 60 * 1000;

export interface UserLocation {
  lat: number;
  lon: number;
  countryCode?: string;
  city?: string;
  region?: string;
  timestamp: number;
  source: 'gps' | 'ip' | 'fallback';
}

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown';

export interface LocationPermissionInfo {
  status: PermissionStatus;
  timestamp: number;
  hasBeenPrompted: boolean;
}

// Event system for location updates
class LocationEventEmitter {
  private listeners: Set<() => void> = new Set();

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  emit() {
    this.listeners.forEach((callback) => callback());
  }
}

const locationEventEmitter = new LocationEventEmitter();

export class LocationService {
  // Event system for location updates
  static subscribeToLocationUpdates(callback: () => void) {
    return locationEventEmitter.subscribe(callback);
  }

  private static emitLocationUpdate() {
    locationEventEmitter.emit();
  }

  // First login prompt management
  static hasBeenPromptedOnFirstLogin(): boolean {
    return localStorage.getItem(FIRST_LOGIN_PROMPT_KEY) === 'true';
  }

  static markAsPromptedOnFirstLogin(): void {
    localStorage.setItem(FIRST_LOGIN_PROMPT_KEY, 'true');
  }

  static shouldPromptOnFirstLogin(): boolean {
    return !this.hasBeenPromptedOnFirstLogin();
  }

  // Permission management
  static getPermissionInfo(): LocationPermissionInfo {
    const raw = localStorage.getItem(LOCATION_PERMISSION_KEY);
    if (!raw) {
      return {
        status: 'unknown',
        timestamp: 0,
        hasBeenPrompted: false,
      };
    }
    try {
      return JSON.parse(raw);
    } catch {
      return {
        status: 'unknown',
        timestamp: 0,
        hasBeenPrompted: false,
      };
    }
  }

  static setPermissionInfo(info: LocationPermissionInfo): void {
    localStorage.setItem(LOCATION_PERMISSION_KEY, JSON.stringify(info));
    // Emit event to notify components about permission change
    this.emitLocationUpdate();
  }

  static hasBeenPromptedBefore(): boolean {
    return this.getPermissionInfo().hasBeenPrompted;
  }

  // Reset permission status - useful if user wants to re-grant permission
  static resetPermissionStatus(): void {
    this.setPermissionInfo({
      status: 'unknown',
      timestamp: Date.now(),
      hasBeenPrompted: false,
    });
  }

  // Location storage and retrieval
  static getStoredLocation(): UserLocation | null {
    const raw = localStorage.getItem(LOCATION_KEY);
    if (!raw) return null;
    try {
      const loc = JSON.parse(raw);
      if (
        typeof loc.lat === 'number' &&
        typeof loc.lon === 'number' &&
        typeof loc.timestamp === 'number'
      ) {
        return loc;
      }
      return null;
    } catch {
      return null;
    }
  }

  static storeLocation(
    loc: Omit<UserLocation, 'timestamp'> & { timestamp?: number },
  ): void {
    const toStore = { ...loc, timestamp: loc.timestamp || Date.now() };
    localStorage.setItem(LOCATION_KEY, JSON.stringify(toStore));
    // Emit event to notify components about location update
    this.emitLocationUpdate();
  }

  // Check if location needs refresh
  static shouldRefreshLocation(): boolean {
    const loc = this.getStoredLocation();
    if (!loc) return true;
    return Date.now() - loc.timestamp > LOCATION_TTL_MS;
  }

  static shouldAutoRefreshLocation(): boolean {
    const loc = this.getStoredLocation();
    if (!loc) return true;
    return Date.now() - loc.timestamp > LOCATION_REFRESH_THRESHOLD;
  }

  // GPS location retrieval
  static async getGPSLocation(): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: UserLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            timestamp: Date.now(),
            source: 'gps',
          };
          resolve(location);
        },
        (error) => {
          let status: PermissionStatus = 'denied';
          if (error.code === error.PERMISSION_DENIED) {
            status = 'denied';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            status = 'unknown';
          } else if (error.code === error.TIMEOUT) {
            status = 'unknown';
          }

          this.setPermissionInfo({
            status,
            timestamp: Date.now(),
            hasBeenPrompted: true,
          });

          reject(error);
        },
        {
          enableHighAccuracy: LOCATION_CONFIG.HIGH_ACCURACY,
          timeout: LOCATION_CONFIG.GPS_TIMEOUT,
          maximumAge: 300000, // 5 minutes cache for GPS
        },
      );
    });
  }

  // IP-based location fallback
  static async getIPLocation(): Promise<UserLocation> {
    try {
      const response = await API.get('/location/ip');
      const data = response.data;
      return {
        lat: data.lat,
        lon: data.lon,
        countryCode: data.countryCode,
        city: data.city,
        region: data.region,
        timestamp: Date.now(),
        source: 'ip',
      };
    } catch {
      throw new Error('Failed to get IP location');
    }
  }

  // Main location retrieval method
  static async getCurrentLocationOrIP(): Promise<UserLocation> {
    try {
      // Check permission status first
      const permissionInfo = this.getPermissionInfo();

      // Only try GPS if we haven't been explicitly denied
      if (permissionInfo.status !== 'denied') {
        try {
          const gpsLocation = await this.getGPSLocation();
          // Mark as granted and store
          this.setPermissionInfo({
            status: 'granted',
            timestamp: Date.now(),
            hasBeenPrompted: true,
          });
          this.storeLocation(gpsLocation);
          return gpsLocation;
        } catch (gpsError) {
          console.warn('GPS location failed, falling back to IP:', gpsError);
          // If GPS fails, update permission status based on the error
          if (
            gpsError instanceof GeolocationPositionError &&
            gpsError.code === gpsError.PERMISSION_DENIED
          ) {
            this.setPermissionInfo({
              status: 'denied',
              timestamp: Date.now(),
              hasBeenPrompted: true,
            });
          }
        }
      }

      // Fallback to IP location
      const ipLocation = await this.getIPLocation();
      this.storeLocation(ipLocation);
      return ipLocation;
    } catch (error) {
      console.error('All location methods failed:', error);
      // Ultimate fallback
      const fallbackLocation = {
        lat: 0,
        lon: 0,
        timestamp: Date.now(),
        source: 'fallback' as const,
      };
      this.storeLocation(fallbackLocation);
      return fallbackLocation;
    }
  }

  // Prompt user for GPS permission (for first login)
  static async promptForLocationPermission(): Promise<UserLocation> {
    try {
      const location = await this.getGPSLocation();
      this.setPermissionInfo({
        status: 'granted',
        timestamp: Date.now(),
        hasBeenPrompted: true,
      });
      this.markAsPromptedOnFirstLogin();
      this.storeLocation(location);
      return location;
    } catch {
      this.setPermissionInfo({
        status: 'denied',
        timestamp: Date.now(),
        hasBeenPrompted: true,
      });
      this.markAsPromptedOnFirstLogin();

      // Fallback to IP
      const ipLocation = await this.getIPLocation();
      this.storeLocation(ipLocation);
      return ipLocation;
    }
  }

  // Get location with smart caching and refresh logic
  static async getLocationSmart(): Promise<UserLocation> {
    const storedLocation = this.getStoredLocation();
    const permissionInfo = this.getPermissionInfo();

    // If no stored location, get fresh location
    if (!storedLocation) {
      const location = await this.getCurrentLocationOrIP();
      this.storeLocation(location);
      return location;
    }

    // If location is fresh enough, return it
    if (!this.shouldRefreshLocation()) {
      return storedLocation;
    }

    // If we should auto-refresh and have GPS permission, try to refresh silently
    if (
      this.shouldAutoRefreshLocation() &&
      permissionInfo.status === 'granted'
    ) {
      try {
        const freshLocation = await this.getGPSLocation();
        this.storeLocation(freshLocation);
        return freshLocation;
      } catch (refreshError) {
        console.warn(
          'Auto-refresh failed, using stored location:',
          refreshError,
        );
        return storedLocation;
      }
    }

    // If GPS is denied, refresh with IP
    if (permissionInfo.status === 'denied') {
      try {
        const ipLocation = await this.getIPLocation();
        this.storeLocation(ipLocation);
        return ipLocation;
      } catch (ipError) {
        console.warn('IP refresh failed, using stored location:', ipError);
        return storedLocation;
      }
    }

    // Default: return stored location
    return storedLocation;
  }

  // Session initialization
  static async initializeLocationForSession(): Promise<UserLocation> {
    const storedLocation = this.getStoredLocation();

    // If we have a location and it's fresh, use it
    if (storedLocation && !this.shouldAutoRefreshLocation()) {
      return storedLocation;
    }

    // Try to refresh location
    try {
      const location = await this.getLocationSmart();
      return location;
    } catch (error) {
      console.error('Session location initialization failed:', error);

      // Return stored location as fallback, or default coordinates
      return (
        storedLocation || {
          lat: 0,
          lon: 0,
          timestamp: Date.now(),
          source: 'fallback',
        }
      );
    }
  }

  // Get location without triggering fresh fetches - for UI components
  static getLocationForUI(): UserLocation | null {
    return this.getStoredLocation();
  }

  // Check if we should show location-based features
  static hasValidLocationForUI(): boolean {
    const location = this.getStoredLocation();
    return location !== null && location.source !== 'fallback';
  }
}

// Legacy function exports for backward compatibility
export const getStoredLocation =
  LocationService.getStoredLocation.bind(LocationService);
export const storeLocation =
  LocationService.storeLocation.bind(LocationService);
export const shouldRefreshLocation =
  LocationService.shouldRefreshLocation.bind(LocationService);
export const getCurrentLocationOrIP =
  LocationService.getCurrentLocationOrIP.bind(LocationService);

// New function for checking if user should be prompted on first login
export const hasBeenPromptedBefore =
  LocationService.hasBeenPromptedOnFirstLogin.bind(LocationService);
