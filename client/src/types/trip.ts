// Location data interface from Google Maps
export interface ILocation {
  placeId: string;
  name: string;
  address: string;
  coordinates?: { lat: number; lng: number };
}

// Defines the structure for a single event or activity in a daily schedule.
export interface IPlanItem {
  _id: string;
  type: 'activity' | 'food' | 'accommodation' | 'transportation' | 'shopping' | 'other';
  title: string;
  description?: string;
  startTime?: string; // ISO date string
  endTime?: string; // ISO date string
  location?: ILocation;
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
  destination: ILocation;
  coverImageUrl?: string;
  author: string; // User ID
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
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
