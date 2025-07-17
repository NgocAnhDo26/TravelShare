import React, { useState } from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  Card,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Pencil,
  Trash,
  MapPin,
  Clock,
  Ellipsis,
  MapPinPlus,
  DollarSign,
  Plus,
  X,
  Loader2,
} from 'lucide-react';
import type { IDailySchedule, IPlanItem } from '@/types/trip';
import API from '@/utils/axiosInstance';
import toast from 'react-hot-toast';

interface ItinerarySectionProps {
  itinerary: IDailySchedule[];
  editMode?: boolean;
  tripId: string;
  onItemAdded?: (dayNumber: number, item: IPlanItem) => void;
  onItemUpdated?: (dayNumber: number, itemId: string, item: IPlanItem) => void;
  onItemDeleted?: (dayNumber: number, itemId: string) => void;
}

interface ItemFormData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  category: string;
  cost: string;
  notes: string;
}

const initialFormData: ItemFormData = {
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  location: '',
  category: 'activity',
  cost: '',
  notes: '',
};

/**
 * Form component for adding/editing itinerary items
 */
const ItemForm: React.FC<{
  formData: ItemFormData;
  onFormDataChange: (data: ItemFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing?: boolean;
  dayDate: string; // Added to show which day this item belongs to
}> = ({
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
  isSubmitting,
  isEditing = false,
  dayDate,
}) => {
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    onFormDataChange({
      ...formData,
      [name]: value,
    });
  };

  return (
    <form onSubmit={onSubmit} className='space-y-4'>
      {/* Day Info Display */}
      <div className='bg-gray-50 p-3 rounded-md'>
        <p className='text-sm text-gray-600'>
          <span className='font-medium'>{isEditing ? "Day:" : "Adding to:"}</span>{' '}
          {new Date(dayDate).toLocaleDateString()}
        </p>
      </div>

      {/* Title */}
      <div className='grid gap-2'>
        <Label htmlFor='title'>Activity Title *</Label>
        <Input
          id='title'
          name='title'
          value={formData.title}
          onChange={handleInputChange}
          placeholder='Enter activity title'
          required
        />
      </div>

      {/* Description */}
      <div className='grid gap-2'>
        <Label htmlFor='description'>Description</Label>
        <Textarea
          id='description'
          name='description'
          value={formData.description}
          onChange={handleInputChange}
          placeholder='Describe your activity'
          rows={3}
        />
      </div>

      {/* Time */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='grid gap-2'>
          <Label htmlFor='startTime'>Start Time</Label>
          <Input
            type='time'
            id='startTime'
            name='startTime'
            value={formData.startTime}
            onChange={handleInputChange}
          />
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='endTime'>End Time</Label>
          <Input
            type='time'
            id='endTime'
            name='endTime'
            value={formData.endTime}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {/* Location */}
      <div className='grid gap-2'>
        <Label htmlFor='location'>Location *</Label>
        <Input
          id='location'
          name='location'
          value={formData.location}
          onChange={handleInputChange}
          placeholder='Enter location or address'
          required
        />
      </div>

      {/* Category */}
      <div className='grid gap-2'>
        <Label htmlFor='category'>Category</Label>
        <select
          id='category'
          name='category'
          value={formData.category}
          onChange={handleInputChange}
          className='text-sm w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black'
        >
          <option value='activity'>Activity</option>
          <option value='food'>Food & Drinks</option>
          <option value='accommodation'>Accommodation</option>
          <option value='transportation'>Transportation</option>
          <option value='shopping'>Shopping</option>
          <option value='other'>Other</option>
        </select>
      </div>

      {/* Budget */}
      <div className='grid gap-2'>
        <Label htmlFor='cost'>Budget</Label>
        <Input
          type='text'
          id='cost'
          name='cost'
          value={formData.cost}
          onChange={handleInputChange}
          placeholder='e.g., $50, 1.000.000 VND, $10/person'
        />
      </div>

      {/* Notes */}
      <div className='grid gap-2'>
        <Label htmlFor='notes'>Additional Notes</Label>
        <Textarea
          id='notes'
          name='notes'
          value={formData.notes}
          onChange={handleInputChange}
          placeholder='Any additional information or special instructions'
          rows={2}
        />
      </div>

      {/* Action Buttons */}
      <DialogFooter>
        <Button
          type='button'
          variant='outline'
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X className='h-4 w-4' />
          Cancel
        </Button>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Plus className='h-4 w-4' />
          )}
          {isEditing ? 'Update Item' : 'Add to Itinerary'}
        </Button>
      </DialogFooter>
    </form>
  );
};

/**
 * Renders the Dropdown Menu for item actions (Edit, Delete).
 */
const ItemActionsMenu: React.FC<{
  onEdit: () => void;
  onDelete: () => void;
}> = ({ onEdit, onDelete }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant='secondary'
        size='icon'
        className='ml-auto size-8 flex-shrink-0'
      >
        <Ellipsis />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className='w-56' align='start'>
      <DropdownMenuGroup>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className='mr-2 h-4 w-4' />
          <span>Edit item</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onDelete}
          className='text-red-600 focus:bg-red-50 focus:text-red-600'
        >
          <Trash className='mr-2 h-4 w-4 text-red-600' />
          <span>Delete item</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
);

/**
 * Renders a single itinerary item card.
 */
const ItineraryItemCard: React.FC<{
  item: IPlanItem;
  editMode?: boolean;
  onEdit: (item: IPlanItem) => void;
  onDelete: (item: IPlanItem) => void;
}> = ({ item, editMode = false, onEdit, onDelete }) => {
  const badgeColors = {
    activity: 'bg-blue-100 text-blue-800',
    food: 'bg-yellow-100 text-yellow-800',
    accommodation: 'bg-green-100 text-green-800',
    transportation: 'bg-purple-100 text-purple-800',
    shopping: 'bg-pink-100 text-pink-800',
    other: 'bg-gray-100 text-gray-800',
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      activity: 'Activity',
      food: 'Food & Drinks',
      accommodation: 'Accommodation',
      transportation: 'Transportation',
      shopping: 'Shopping',
      other: 'Other',
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getLocaleTimeString = (date: Date): string => {
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'UTC',
    });
  };

  const handleEdit = () => onEdit(item);
  const handleDelete = () => onDelete(item);

  return (
    <Card className='mt-4 p-4 rounded-sm text-left gap-2'>
      <CardTitle className='text-lg font-semibold flex items-center justify-between'>
        <div className='flex items-center'>
          <Badge className={`${badgeColors[item.type]} mr-2`}>
            {getCategoryLabel(item.type)}
          </Badge>
          {item.title}
        </div>
        {editMode && (
          <ItemActionsMenu onEdit={handleEdit} onDelete={handleDelete} />
        )}
      </CardTitle>

      {item.location && (
        <div className='flex items-center gap-1 text-gray-600 mt-2'>
          <MapPin className='w-4 h-4 mr-1' />
          <span className='font-bold'>Location:</span> {item.location.address}
        </div>
      )}
      {(item.startTime || item.endTime) && (
        <div className='flex items-center gap-1 text-gray-600'>
          <Clock className='w-4 h-4 mr-1' />
          <span className='font-bold'>Time:</span>{' '}
          {item.startTime && item.endTime
            ? `${getLocaleTimeString(new Date(item.startTime))} - ${getLocaleTimeString(new Date(item.endTime))}`
            : item.startTime
              ? getLocaleTimeString(new Date(item.startTime))
              : item.endTime
                ? getLocaleTimeString(new Date(item.endTime))
                : ''}
        </div>
      )}

      <div className='flex items-center gap-1 text-gray-600'>
        <DollarSign className='w-4 h-4 mr-1' />
        <span className='font-bold'>Budget:</span>{' '}
        {item.cost && item.cost.trim() !== '' ? item.cost : 'Not specified'}
      </div>

      <CardDescription className='mt-2'>{item.description}</CardDescription>

      {item.notes && (
        <div className='mt-2 p-3 bg-gray-50 rounded-md border'>
          <p className='text-sm text-gray-700'>
            <span className='font-medium'>Notes:</span> {item.notes}
          </p>
        </div>
      )}
    </Card>
  );
};

/**
 * Renders an accordion item for a single day's itinerary.
 */
const DayItinerary: React.FC<{
  day: IDailySchedule;
  editMode?: boolean;
  onAddItem: (dayNumber: number) => void;
  onEditItem: (item: IPlanItem) => void;
  onDeleteItem: (item: IPlanItem) => void;
}> = ({ day, editMode = false, onAddItem, onEditItem, onDeleteItem }) => {
  const handleAddItem = () => onAddItem(day.dayNumber);

  return (
    <AccordionItem value={day.dayNumber.toString()}>
      <AccordionTrigger className='text-xl'>
        {`Day ${day.dayNumber} (${new Date(day.date).toLocaleDateString()})`}
      </AccordionTrigger>
      <AccordionContent>
        {day.items.length > 0 ? (
          day.items.map((item) => (
            <ItineraryItemCard
              key={item._id}
              item={item}
              editMode={editMode}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
            />
          ))
        ) : (
          <div className='p-4 bg-white rounded-lg mt-2 border shadow-sm'>
            <p className='text-muted-foreground'>
              No activities planned for this day yet.
            </p>
          </div>
        )}

        {editMode && (
          <Button
            variant='secondary'
            className='mt-4 w-full'
            onClick={handleAddItem}
          >
            <MapPinPlus className='mr-2 h-4 w-4' /> New Item
          </Button>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};

/**
 * Renders the main itinerary section with the accordion.
 */
const ItinerarySection: React.FC<ItinerarySectionProps> = ({
  itinerary,
  editMode = false,
  tripId,
  onItemAdded,
  onItemUpdated,
  onItemDeleted,
}) => {
  // By default, open the first day or any day that has items.
  const defaultOpenItems = itinerary
    .filter((day, index) => index === 0 || day.items.length > 0)
    .map((day) => day.dayNumber.toString());
  const [openSections, setOpenSections] = useState<string[]>(defaultOpenItems);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentDayNumber, setCurrentDayNumber] = useState<number>(1);
  const [currentEditItem, setCurrentEditItem] = useState<IPlanItem | null>(
    null,
  );
  const [currentDeleteItem, setCurrentDeleteItem] = useState<IPlanItem | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form data state
  const [formData, setFormData] = useState<ItemFormData>(initialFormData);

  // Convert form data to API format
  const convertFormDataToApiFormat = (
    data: ItemFormData,
  ): Partial<IPlanItem> => {
    const apiData: Partial<IPlanItem> = {
      title: data.title,
      description: data.description,
      type: data.category as IPlanItem['type'],
      cost: data.cost || '', // Keep as string
      notes: data.notes,
    };

    // Add location if provided
    if (data.location) {
      apiData.location = {
        placeId: '',
        name: data.location,
        address: data.location,
      };
    }

    // Add times if provided - we'll use the day's date from the itinerary
    const dayData = itinerary.find((day) => day.dayNumber === currentDayNumber);
    const dayDate = dayData
      ? dayData.date
      : new Date().toISOString().split('T')[0];

    if (data.startTime) {
      const startDateTime = new Date(
        `${dayDate.split('T')[0]}T${data.startTime}`,
      );
      apiData.startTime = startDateTime.toISOString();
    }
    if (data.endTime) {
      const endDateTime = new Date(`${dayDate.split('T')[0]}T${data.endTime}`);
      apiData.endTime = endDateTime.toISOString();
    }

    return apiData;
  };

  // Convert API format to form data
  const convertApiFormatToFormData = (item: IPlanItem): ItemFormData => {
    const getTimeFromISO = (isoString?: string): string => {
      if (!isoString) return '';
      const date = new Date(isoString);
      return date.toTimeString().slice(0, 5); // HH:MM format
    };

    return {
      title: item.title,
      description: item.description || '',
      startTime: getTimeFromISO(item.startTime),
      endTime: getTimeFromISO(item.endTime),
      location: item.location?.address || '',
      category: item.type,
      cost: item.cost || '',
      notes: item.notes || '',
    };
  };

  // Handle add item
  const handleAddItem = (dayNumber: number) => {
    setCurrentDayNumber(dayNumber);
    setFormData(initialFormData);
    setIsAddModalOpen(true);
  };

  // Handle edit item
  const handleEditItem = (item: IPlanItem) => {
    setCurrentEditItem(item);
    setFormData(convertApiFormatToFormData(item));
    setIsEditModalOpen(true);
  };

  // Handle delete item
  const handleDeleteItem = async (item: IPlanItem) => {
    setCurrentDeleteItem(item);
    setIsDeleteModalOpen(true);
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!currentDeleteItem) return;

    setIsDeleting(true);

    try {
      await API.delete(`/plans/${tripId}/items/${currentDeleteItem._id}`);

      // Find the day number for this item
      const dayNumber = itinerary.find((day) =>
        day.items.some((dayItem) => dayItem._id === currentDeleteItem._id),
      )?.dayNumber;

      if (dayNumber && onItemDeleted) {
        onItemDeleted(dayNumber, currentDeleteItem._id);
      }

      setIsDeleteModalOpen(false);
      setCurrentDeleteItem(null);
      toast.success('Item deleted successfully!');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle delete cancellation
  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setCurrentDeleteItem(null);
  };

  // Handle add form submission
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const apiData = convertFormDataToApiFormat(formData);
      const response = await API.post(
        `/plans/${tripId}/days/${currentDayNumber}/items`,
        apiData,
      );

      if (onItemAdded) {
        onItemAdded(currentDayNumber, response.data.data);
      }

      setIsAddModalOpen(false);
      setFormData(initialFormData);
      toast.success('Item added successfully!');
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEditItem) return;

    setIsSubmitting(true);

    try {
      const apiData = convertFormDataToApiFormat(formData);
      const response = await API.put(
        `/plans/${tripId}/items/${currentEditItem._id}`,
        apiData,
      );

      // Find the day number for this item
      const dayNumber = itinerary.find((day) =>
        day.items.some((dayItem) => dayItem._id === currentEditItem._id),
      )?.dayNumber;

      if (dayNumber && onItemUpdated) {
        onItemUpdated(dayNumber, currentEditItem._id, response.data.data);
      }

      setIsEditModalOpen(false);
      setCurrentEditItem(null);
      setFormData(initialFormData);
      toast.success('Item updated successfully!');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setCurrentEditItem(null);
    setFormData(initialFormData);
  };

  return (
    <section className='lg:mx-14 mx-8 mt-6'>
      <h1 className='text-2xl font-bold text-left mb-4'>Itinerary</h1>
      <Accordion
        type='multiple'
        value={openSections}
        onValueChange={setOpenSections}
      >
        {itinerary.map((day) => (
          <DayItinerary
            key={day.dayNumber}
            day={day}
            editMode={editMode}
            onAddItem={handleAddItem}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
          />
        ))}
      </Accordion>

      {/* Add Item Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          <ItemForm
            formData={formData}
            onFormDataChange={setFormData}
            onSubmit={handleAddSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            isEditing={false}
            dayDate={
              itinerary.find((day) => day.dayNumber === currentDayNumber)
                ?.date || new Date().toISOString()
            }
          />
        </DialogContent>
      </Dialog>

      {/* Edit Item Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <ItemForm
            formData={formData}
            onFormDataChange={setFormData}
            onSubmit={handleEditSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            isEditing={true}
            dayDate={
              currentEditItem
                ? itinerary.find((day) =>
                    day.items.some((item) => item._id === currentEditItem._id),
                  )?.date || new Date().toISOString()
                : new Date().toISOString()
            }
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
          </DialogHeader>
          <div>
            <p className='text-sm text-gray-600'>
              Are you sure you want to delete "{currentDeleteItem?.title}"? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type='button'
              variant='destructive'
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Trash className='h-4 w-4' />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ItinerarySection;
