import { Card } from "@/components/ui/card";
import React from "react";
import type { Trip } from "@/types/trip";
import ItinerarySection from "@/components/ItinerarySection";
import TripHeader from "@/components/TripHeader";
import SocialSection from "@/components/SocialSection";

// --- 2. MOCK DATA (This will be replaced by your API call) ---
const mockTripData: Trip = {
  id: "trip123",
  title: "Trip to Paris",
  description: "My fiancé and I visited Paris for 4 days in May/June 2025 (all the prices will be based on 2 people). We definitely packed in as much as we could. I’d recommend a longer holiday if you have more you want to see but if you just there for a long weekend, this guide is for you.",
  coverImage: "https://placehold.co/1200x400",
  startDate: "01/01/2025",
  endDate: "02/01/2025",
  collaborators: [
    { id: "user1", name: "Tina", avatarUrl: undefined, initials: "T" },
    { id: "user2", name: "Alex", avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop", initials: "A" },
  ],
  itinerary: [
    {
      id: "day1",
      date: "01/01/2025",
      title: "Day 1 (01/01/2025)",
      subtitle: "Arriving and exploring the city",
      items: [
        {
          id: "item1",
          type: 'Activity',
          title: "Arrive in Paris",
          location: "Charles de Gaulle Airport",
          time: "10:00 AM - 11:00 PM",
          budget: "Free",
          description: "Arrive at Charles de Gaulle Airport, check into hotel, explore Montmartre and Sacré-Cœur.",
        },
        {
          id: "item2",
          type: 'Eats & Drinks',
          title: "Having lunch at Pizzeria César",
          location: "Pizzeria César",
          time: "11:30 AM - 12:30 PM",
          budget: "$100",
          description: "We had dinner here after the palace or versaille and would recommend the pizzas. You can sit outside and mull over what you’ve just seen before getting the train back into Paris just a 3 minute walk away.",
        },
      ],
    },
    {
      id: "day2",
      date: "02/01/2025",
      title: "Day 2 (02/01/2025)",
      subtitle: "Museums and Landmarks",
      items: [], // No items for day 2 in this example
    },
  ],
};

// --- 4. MAIN PAGE COMPONENT ---
const PlanEditorPage: React.FC<{ editMode?: boolean }> = ({ editMode = false }) => {
  // In the future, you would fetch this data from an API.
  // For now, we are using the mock data.
  const tripData = mockTripData;

  // You can add loading and error states here for a real API call
  // if (!tripData) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-full justify-center lg:mx-60 mx-24 my-10">
      <Card className="w-full overflow-hidden pt-0">
        <TripHeader trip={tripData} editMode={editMode} />
        <ItinerarySection itinerary={tripData.itinerary} editMode={editMode} />
      </Card>

      {!editMode && <SocialSection />}
    </div>
  );
}

export default PlanEditorPage;