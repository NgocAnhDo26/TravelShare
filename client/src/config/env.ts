/**
 * Frontend Configuration
 * Centralized configuration file for environment variables
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  TIMEOUT: import.meta.env.VITE_API_TIMEOUT
    ? parseInt(import.meta.env.VITE_API_TIMEOUT)
    : 10000,
  ENV: import.meta.env.VITE_ENV || 'local',
  DEV_URL: import.meta.env.VITE_API_URL_DEV || '',
  PROD_URL: import.meta.env.VITE_API_URL_PROD || '',
} as const;

// TomTom Configuration
export const TOMTOM_CONFIG = {
  API_KEY: import.meta.env.VITE_TOMTOM_API_KEY || '',
} as const;

// Google OAuth Configuration
export const GOOGLE_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'TravelShare',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  ENVIRONMENT:
    import.meta.env.VITE_NODE_ENV || import.meta.env.NODE_ENV || 'development',
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
} as const;

// Location Service Configuration
export const LOCATION_CONFIG = {
  CACHE_TTL_HOURS: import.meta.env.VITE_LOCATION_CACHE_TTL
    ? parseInt(import.meta.env.VITE_LOCATION_CACHE_TTL)
    : 6,
  AUTO_REFRESH_HOURS: import.meta.env.VITE_LOCATION_AUTO_REFRESH
    ? parseInt(import.meta.env.VITE_LOCATION_AUTO_REFRESH)
    : 12,
  GPS_TIMEOUT: import.meta.env.VITE_GPS_TIMEOUT
    ? parseInt(import.meta.env.VITE_GPS_TIMEOUT)
    : 10000,
  HIGH_ACCURACY: import.meta.env.VITE_GPS_HIGH_ACCURACY !== 'false',
} as const;

// Storage Configuration
export const STORAGE_CONFIG = {
  LOCATION_KEY: 'user_gps_location',
  PERMISSION_KEY: 'gps_permission_status',
  FIRST_LOGIN_PROMPT_KEY: 'first_login_gps_prompted',
} as const;

// Default values and validation
const requiredEnvVars = {
  TOMTOM_API_KEY: TOMTOM_CONFIG.API_KEY,
  GOOGLE_CLIENT_ID: GOOGLE_CONFIG.CLIENT_ID,
} as const;

// Environment validation
export const validateConfig = () => {
  const missingVars: string[] = [];

  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value || value.trim() === '') {
      missingVars.push(`VITE_${key}`);
    }
  });

  if (missingVars.length > 0 && APP_CONFIG.ENVIRONMENT === 'production') {
    console.error('Missing required environment variables:', missingVars);
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`,
    );
  }

  if (missingVars.length > 0 && APP_CONFIG.ENVIRONMENT === 'development') {
    console.warn(
      'Missing environment variables (development mode):',
      missingVars,
    );
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
};

// Utility functions
export const isProduction = () => APP_CONFIG.ENVIRONMENT === 'production';
export const isDevelopment = () => APP_CONFIG.ENVIRONMENT === 'development';
export const isDebugMode = () => APP_CONFIG.DEBUG;

// Configuration export (default export)
const config = {
  API: API_CONFIG,
  TOMTOM: TOMTOM_CONFIG,
  GOOGLE: GOOGLE_CONFIG,
  APP: APP_CONFIG,
  LOCATION: LOCATION_CONFIG,
  STORAGE: STORAGE_CONFIG,
  validate: validateConfig,
  isProduction,
  isDevelopment,
  isDebugMode,
} as const;

export default config;
