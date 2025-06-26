import React, { useState } from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { Pencil, Trash, MapPin, Clock, Ellipsis, MapPinPlus, DollarSign } from 'lucide-react';
import type { ItineraryDay, ItineraryItem } from "@/types/trip";

/**
 * Renders the Dropdown Menu for item actions (Edit, Delete).
 */
const ItemActionsMenu: React.FC = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="secondary" size="icon" className="ml-auto size-8 flex-shrink-0">
        <Ellipsis />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-56" align="start">
      <DropdownMenuGroup>
        <DropdownMenuItem>
          <Pencil className="mr-2 h-4 w-4" />
          <span>Edit item</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-600">
          <Trash className="mr-2 h-4 w-4 text-red-600" />
          <span>Delete item</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
);

/**
 * Renders a single itinerary item card.
 */
const ItineraryItemCard: React.FC<{ item: ItineraryItem, editMode?: boolean }> = ({ item, editMode = false }) => {
  const badgeColors = {
    'Activity': "bg-blue-100 text-blue-800",
    'Eats & Drinks': "bg-yellow-100 text-yellow-800",
    'Note': "bg-gray-100 text-gray-800",
  };

  return (
    <Card className="mt-4 p-4 rounded-sm text-left gap-2">
      <CardTitle className="text-lg font-semibold flex items-center justify-between">
        <div className="flex items-center">
          <Badge className={`${badgeColors[item.type]} mr-2`}>{item.type}</Badge>
          {item.title}
        </div>
        {editMode && <ItemActionsMenu />}
      </CardTitle>

      {item.location && (
        <div className="flex items-center gap-1 text-gray-600 mt-2">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="font-bold">Location:</span> {item.location}
        </div>
      )}
      {item.time && (
        <div className="flex items-center gap-1 text-gray-600">
          <Clock className="w-4 h-4 mr-1" />
          <span className="font-bold">Time:</span> {item.time}
        </div>
      )}
      {item.budget && (
        <div className="flex items-center gap-1 text-gray-600">
          <DollarSign className="w-4 h-4 mr-1" />
          <span className="font-bold">Budget:</span> {item.budget}
        </div>
      )}

      <CardDescription className="mt-2">{item.description}</CardDescription>
    </Card>
  );
};

/**
 * Renders an accordion item for a single day's itinerary.
 */
const DayItinerary: React.FC<{ day: ItineraryDay, editMode?: boolean }> = ({ day, editMode = false }) => (
  <AccordionItem value={day.id}>
    <AccordionTrigger className="text-xl">{day.title}</AccordionTrigger>
    <AccordionContent>
      <h3 className="text-md font-medium text-left text-gray-500">{day.subtitle}</h3>
      
      {day.items.length > 0 ? (
        day.items.map(item => <ItineraryItemCard key={item.id} item={item} editMode={editMode} />)
      ) : (
        <div className="p-4 bg-white rounded-lg mt-2 border shadow-sm">
          <p className="text-muted-foreground">No activities planned for this day yet.</p>
        </div>
      )}

      {editMode && (
        <Button variant="secondary" className="mt-4 w-full">
          <MapPinPlus className="mr-2 h-4 w-4" /> New Item
        </Button>
      )}
    </AccordionContent>
  </AccordionItem>
);

/**
 * Renders the main itinerary section with the accordion.
 */
const ItinerarySection: React.FC<{ itinerary: ItineraryDay[], editMode?: boolean }> = ({ itinerary, editMode = false }) => {
    // By default, open the first day or any day that has items.
    const defaultOpenItems = itinerary.filter((day, index) => index === 0 || day.items.length > 0).map(day => day.id);
    const [openSections, setOpenSections] = useState<string[]>(defaultOpenItems);

    return (
        <section className="lg:mx-14 mx-8 mt-6">
            <h1 className="text-2xl font-bold text-left mb-4">Itinerary</h1>
            <Accordion type="multiple" value={openSections} onValueChange={setOpenSections}>
                {itinerary.map(day => <DayItinerary key={day.id} day={day} editMode={editMode} />)}
            </Accordion>
        </section>
    );
}

export default ItinerarySection;