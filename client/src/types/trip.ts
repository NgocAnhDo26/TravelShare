// Base interface for TomTom location data (shared fields)
export interface ITomTomLocationBase {
  placeId?: string;
  name: string;
  address: string;
  coordinates?: { lat: number; lng: number };
  entityType?: string;
  countryCode?: string;
  country?: string;
  countryCodeISO3?: string;
  boundingBox?: {
    topLeftPoint: { lat: number; lon: number };
    btmRightPoint: { lat: number; lon: number };
  };
  viewport?: {
    topLeftPoint: { lat: number; lon: number };
    btmRightPoint: { lat: number; lon: number };
  };
  dataSources?: Record<string, unknown>;
}

// Interface for a POI location from TomTom API (extends ITomTomLocationBase)
export interface IPOILocation extends ITomTomLocationBase {
  phone?: string;
  categories?: string[];
  classifications?: {
    code: string;
    names: { nameLocale: string; name: string }[];
  }[];
}

// Legacy interface for backward compatibility
export interface ILocation {
  placeId: string;
  name: string;
  address: string;
  coordinates?: { lat: number; lng: number };
}

// Defines the structure for a single event or activity in a daily schedule.
export interface IPlanItem {
  _id: string;
  type:
    | 'activity'
    | 'food'
    | 'accommodation'
    | 'transportation'
    | 'shopping'
    | 'other';
  title: string;
  description?: string;
  startTime?: string; // non-ISO date string, e.g., '10:00 AM'
  endTime?: string; // non-ISO date string, e.g., '10:00 AM'
  location?: IPOILocation; // Updated to use TomTom POI location
  cost?: string; // Changed from number to string
  notes?: string;
  order: number;
}

// Defines the structure for a single day in the trip schedule.
export interface IDailySchedule {
  dayNumber: number;
  date: string; // ISO date string
  title?: string;
  items: IPlanItem[];
}

// Defines the structure for the entire trip.
export interface Trip {
  _id: string;
  title: string;
  destination: ITomTomLocationBase; // Updated to use TomTom location data
  coverImageUrl?: string;
  author: string; // User ID
  startDate?: string; // not ISO, but hh:mm AM/PM format
  endDate?: string; // not ISO, but hh:mm AM/PM format
  privacy: 'public' | 'private';
  schedule: IDailySchedule[];
  likesCount: number;
  commentsCount: number;
  remixCount: number;
  trendingScore: number;
  originalPlan?: string; // Reference to original plan ID
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  isLiked: boolean;
}

// Legacy interfaces for backward compatibility (deprecated)
export interface ItineraryItem {
  id: string;
  type: 'Activity' | 'Eats & Drinks' | 'Note';
  title: string;
  location?: string;
  time?: string;
  budget?: string;
  description: string;
}

export interface ItineraryDay {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  items: ItineraryItem[];
}

export interface IPlan {
  _id: string;
  title: string;
  destination: { name: string };
  coverImageUrl?: string;
  author: {
    _id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  likesCount: number;
  commentsCount: number;
  createdAt: string; // The API sends timestamps as ISO strings
  source_type?: 'followed' | 'trending'; // Optional field to identify post source
  isLiked?: boolean;
  isBookmarked?: boolean;
}
