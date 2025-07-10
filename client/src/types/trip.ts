// Defines the structure for a single event or activity in an itinerary.
export interface ItineraryItem {
  id: string;
  type: 'Activity' | 'Eats & Drinks' | 'Note';
  title: string;
  location?: string;
  time?: string;
  budget?: string; // e.g., "$100", "Free"
  description: string;
}

// Defines the structure for a single day in the trip.
export interface ItineraryDay {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  items: ItineraryItem[];
}

// Defines the structure for the entire trip.
export interface Trip {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  collaborators: { id: string; name: string; avatarUrl?: string; initials: string }[];
  itinerary: ItineraryDay[];
  likes?: number;
  comments?: number;
}
