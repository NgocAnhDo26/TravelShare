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
  GripVertical,
} from 'lucide-react';
import type { IDailySchedule, IPlanItem } from '@/types/trip';
import API from '@/utils/axiosInstance';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import type { Dispatch, SetStateAction } from 'react';

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
  dayDate: string;
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
      <div className='bg-gray-50 p-3 rounded-md'>
        <p className='text-sm text-gray-600'>
          <span className='font-medium'>{isEditing ? "Day:" : "Adding to:"}</span>{' '}
          {new Date(dayDate).toLocaleDateString()}
        </p>
      </div>
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
 * Auto-expands the Accordion section when drag is over the menu.
 */
const ItemActionsMenu: React.FC<{
  onEdit: () => void;
  onDelete: () => void;
  dayNumber?: number;
  setOpenSections?: (v: string[]) => void;
  openSections?: string[];
  sortableId?: string;
}> = ({ onEdit, onDelete, dayNumber, setOpenSections, openSections, sortableId }) => {
  // Only useSortable if sortableId is provided
  const { setNodeRef, isOver } = sortableId ? useSortable({ id: sortableId }) : { setNodeRef: undefined, isOver: false };

  React.useEffect(() => {
    if (isOver && setOpenSections && openSections && dayNumber && !openSections.includes(dayNumber.toString())) {
      setOpenSections([...openSections, dayNumber.toString()]);
    }
  }, [isOver, dayNumber, openSections, setOpenSections]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={setNodeRef}
          variant='secondary'
          size='icon'
          className='ml-auto size-8 flex-shrink-0'
          onPointerDown={e => e.stopPropagation()}
          onPointerUp={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()} // Also prevent click bubbling
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
};

/**
 * Renders a single itinerary item card.
 */
const ItineraryItemCard: React.FC<{
  item: IPlanItem;
  editMode?: boolean;
  onEdit: (item: IPlanItem) => void;
  onDelete: (item: IPlanItem) => void;
  dayNumber?: number;
  setOpenSections?: (v: string[]) => void;
  openSections?: string[];
  dragHandleProps?: any; // <-- add this
}> = ({
  item, editMode = false, onEdit, onDelete, dayNumber, setOpenSections, openSections, dragHandleProps
}) => {
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
          {/* Only show drag handle in edit mode */}
          {editMode && dragHandleProps && (
            <span
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing mr-2"
              tabIndex={-1}
              aria-label="Drag to reorder"
              onClick={e => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4 text-gray-400" />
            </span>
          )}
          <Badge className={`${badgeColors[item.type]} mr-2`}>
            {getCategoryLabel(item.type)}
          </Badge>
          {item.title}
        </div>
        {editMode && (
          <ItemActionsMenu
            onEdit={handleEdit}
            onDelete={handleDelete}
            dayNumber={dayNumber}
            setOpenSections={setOpenSections}
            openSections={openSections}
            sortableId={item._id}
          />
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

const SortableItem: React.FC<{ id: string; children: React.ReactElement<any> }> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  // Pass dragHandleProps to children
  return (
    <div ref={setNodeRef} style={style}>
      {React.cloneElement(children, { dragHandleProps: { ...attributes, ...listeners } })}
    </div>
  );
};

// Drop target for empty days
const DropTarget: React.FC<{
  dayNumber: number;
  setOpenSections?: Dispatch<SetStateAction<string[]>>;
  openSections?: string[];
}> = ({ dayNumber, setOpenSections, openSections }) => {
  const { setNodeRef, isOver } = useSortable({ id: `empty-day-${dayNumber}` });

  React.useEffect(() => {
    if (
      isOver &&
      setOpenSections &&
      openSections &&
      !openSections.includes(dayNumber.toString())
    ) {
      setOpenSections([...openSections, dayNumber.toString()]);
    }
  }, [isOver, dayNumber, openSections, setOpenSections]);

  return (
    <div
      ref={setNodeRef}
      className={`p-4 bg-white rounded-lg mt-2 border shadow-sm flex items-center justify-center cursor-pointer transition ${
        isOver ? 'bg-blue-50 border-blue-400' : ''
      }`}
      style={{ minHeight: 60 }}
    >
      <p className='text-muted-foreground'>
        Drop here to move item to this day
      </p>
    </div>
  );
};

const AccordionTriggerDropTarget: React.FC<{
  dayNumber: number;
  setOpenSections?: Dispatch<SetStateAction<string[]>>;
  openSections?: string[];
  children: React.ReactNode;
}> = ({ dayNumber, setOpenSections, openSections, children }) => {
  const { setNodeRef, isOver } = useSortable({ id: `trigger-day-${dayNumber}` });

  React.useEffect(() => {
    if (
      isOver &&
      setOpenSections &&
      openSections &&
      !openSections.includes(dayNumber.toString())
    ) {
      setOpenSections([...openSections, dayNumber.toString()]);
    }
  }, [isOver, dayNumber, openSections, setOpenSections]);

  return (
    <div ref={setNodeRef}>
      {children}
    </div>
  );
};

/**
 * Renders the main itinerary section with the accordion and drag-and-drop.
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
  const [currentEditItem, setCurrentEditItem] = useState<IPlanItem | null>(null);
  const [currentDeleteItem, setCurrentDeleteItem] = useState<IPlanItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [draggedItem, setDraggedItem] = useState<IPlanItem | null>(null);
  const [localItinerary, setLocalItinerary] = useState<IDailySchedule[]>(itinerary);
  const [formData, setFormData] = useState<ItemFormData>(initialFormData);

  // Sensors for dnd-kit
  const sensors = useSensors(useSensor(PointerSensor));

  // Helper: Find day by item id
  const findDayByItemId = (id: string) =>
    localItinerary.find((day) => day.items.some((item) => item._id === id));

  // Helper: Find item by id
  const findItemById = (id: string) => {
    for (const day of localItinerary) {
      const found = day.items.find((item) => item._id === id);
      if (found) return found;
    }
    return null;
  };

  // Drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = findItemById(active.id as string);
    setDraggedItem(item);
  };

  // Drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setDraggedItem(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on empty day
    if (overId.startsWith('empty-day-')) {
      const targetDayNumber = Number(overId.replace('empty-day-', ''));
      const sourceDay = findDayByItemId(activeId);
      const targetDay = localItinerary.find((day) => day.dayNumber === targetDayNumber);

      if (!sourceDay || !targetDay) {
        setDraggedItem(null);
        return;
      }

      // Remove from source
      const movingItem = sourceDay.items.find((item) => item._id === activeId);
      if (!movingItem) {
        setDraggedItem(null);
        return;
      }
      const newSourceItems = sourceDay.items.filter((item) => item._id !== activeId);

      // Add to target (empty day)
      const newTargetItems = [{ ...movingItem, order: 0, dayNumber: targetDay.dayNumber }];

      // Update state
      setLocalItinerary((prev) =>
        prev.map((day) => {
          if (day.dayNumber === sourceDay.dayNumber) {
            return { ...day, items: newSourceItems.map((item, idx) => ({ ...item, order: idx })) };
          }
          if (day.dayNumber === targetDay.dayNumber) {
            return { ...day, items: newTargetItems };
          }
          return day;
        })
      );

      // Send payload to backend here
      try {
        await API.post(`/plans/${tripId}/items/move`, {
          sourceDayNumber: sourceDay.dayNumber,
          targetDayNumber: targetDay.dayNumber,
          itemId: movingItem._id,
          targetIndex: 0, // Always index 0 for empty day
        });
        toast.success('Item moved to another day!');
      } catch (error) {
        console.error('Error moving item:', error);
        toast.error('Failed to move item. Please try again.');
      }

      setDraggedItem(null);
      return;
    }

    const sourceDay = findDayByItemId(activeId);
    const targetDay = findDayByItemId(overId);

    if (!sourceDay || !targetDay) {
      setDraggedItem(null);
      return;
    }

    // If same day, reorder
    if (sourceDay.dayNumber === targetDay.dayNumber) {
      const oldIndex = sourceDay.items.findIndex((item) => item._id === activeId);
      const newIndex = targetDay.items.findIndex((item) => item._id === overId);

      const newItems = arrayMove(sourceDay.items, oldIndex, newIndex);
      const updatedDay: IDailySchedule = {
        ...sourceDay,
        items: newItems.map((item, idx) => ({ ...item, order: idx })),
      };

      setLocalItinerary((prev) =>
        prev.map((day) =>
          day.dayNumber === sourceDay.dayNumber ? updatedDay : day
        )
      );

      // TODO: Send payload to backend here
      const reorderedItems = newItems.map((item, idx) => ({
        _id: item._id,
        order: idx + 1,
      }));

      const payload = {
        dayNumber: sourceDay.dayNumber,
        items: reorderedItems,
      };
      console.log('Reordering payload:', payload);
      // API call:
      await API.post(`/plans/${tripId}/items/reorder`, payload)
        .then(() => {
          toast.success('Items reordered!');
        })
        .catch((error) => {
          console.error('Error reordering items:', error);
          toast.error('Failed to reorder items. Please try again.');
        });

    } else {
      // Move to another day
      const movingItem = sourceDay.items.find((item) => item._id === activeId);
      if (!movingItem) {
        setDraggedItem(null);
        return;
      }

      // Remove from source
      const newSourceItems = sourceDay.items.filter((item) => item._id !== activeId);
      // Insert into target at overId position
      const overIndex = targetDay.items.findIndex((item) => item._id === overId);
      const newTargetItems = [
        ...targetDay.items.slice(0, overIndex),
        { ...movingItem, order: overIndex, dayNumber: targetDay.dayNumber },
        ...targetDay.items.slice(overIndex),
      ].map((item, idx) => ({ ...item, order: idx }));

      // Update state
      setLocalItinerary((prev) =>
        prev.map((day) => {
          if (day.dayNumber === sourceDay.dayNumber) {
            return { ...day, items: newSourceItems.map((item, idx) => ({ ...item, order: idx })) };
          }
          if (day.dayNumber === targetDay.dayNumber) {
            return { ...day, items: newTargetItems };
          }
          return day;
        })
      );

      // API call:
      try {
        await API.post(`/plans/${tripId}/items/move`, {
          sourceDayNumber: sourceDay.dayNumber,
          targetDayNumber: targetDay.dayNumber,
          itemId: movingItem._id,
          targetIndex: overIndex,
        });
        toast.success('Item moved to another day!');
      } catch (error) {
        console.error('Error moving item:', error);
        toast.error('Failed to move item. Please try again.');
      }
    }

    setDraggedItem(null);
  };

  // Convert form data to API format
  const convertFormDataToApiFormat = (
    data: ItemFormData,
  ): Partial<IPlanItem> => {
    const apiData: Partial<IPlanItem> = {
      title: data.title,
      description: data.description,
      type: data.category as IPlanItem['type'],
      cost: data.cost || '',
      notes: data.notes,
    };

    if (data.location) {
      apiData.location = {
        placeId: '',
        name: data.location,
        address: data.location,
      };
    }

    const dayData = itinerary.find((day) => day.dayNumber === currentDayNumber);
    const dayDate = dayData
      ? dayData.date
      : new Date().toISOString().split('T')[0];

    if(data.startTime && data.endTime) {
      const [startHour, startMinute] = data.startTime.split(':').map(Number);
      const [endHour, endMinute] = data.endTime.split(':').map(Number);
      const startTotal = startHour * 60 + startMinute;
      const endTotal = endHour * 60 + endMinute;
      if (startTotal > endTotal) {
        throw new Error('Start time cannot be after end time');
      }
    }

    if (data.startTime) {
      const timeRegex = /^\d{2}:\d{2}$/;
      if (timeRegex.test(data.startTime)) {
        const startDateTime = new Date(`${dayDate.split('T')[0]}T${data.startTime}:00.000Z`);
        apiData.startTime = startDateTime.toISOString();
      }
    }

    if (data.endTime) {
      const timeRegex = /^\d{2}:\d{2}$/;
      if (timeRegex.test(data.endTime)) {
        const endDateTime = new Date(`${dayDate.split('T')[0]}T${data.endTime}:00.000Z`);
        apiData.endTime = endDateTime.toISOString();
      }
    }

    return apiData;
  };

  // Convert API format to form data
  const convertApiFormatToFormData = (item: IPlanItem): ItemFormData => {
    const getTimeFromISO = (isoString?: string): string => {
      if (!isoString) return '';
      const date = new Date(isoString);
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
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

      // Update localItinerary to remove the deleted item
      setLocalItinerary(prev =>
        prev.map(day =>
          day.items.some(item => item._id === currentDeleteItem._id)
            ? { ...day, items: day.items.filter(item => item._id !== currentDeleteItem._id) }
            : day
        )
      );

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
      const newItem = response.data.data;

      // Update localItinerary to add the new item to the correct day
      setLocalItinerary(prev =>
        prev.map(day =>
          day.dayNumber === currentDayNumber
            ? { ...day, items: [...day.items, newItem] }
            : day
        )
      );

      if (onItemAdded) {
        onItemAdded(currentDayNumber, newItem);
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
      const updatedItem = response.data.data;

      // Update localItinerary to reflect the updated item
      setLocalItinerary(prev =>
        prev.map(day => ({
          ...day,
          items: day.items.map(item =>
            item._id === currentEditItem._id ? updatedItem : item
          ),
        }))
      );

      const dayNumber = itinerary.find((day) =>
        day.items.some((dayItem) => dayItem._id === currentEditItem._id),
      )?.dayNumber;

      if (dayNumber && onItemUpdated) {
        onItemUpdated(dayNumber, currentEditItem._id, updatedItem);
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
      {editMode ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Accordion
            type="multiple"
            value={openSections}
            onValueChange={setOpenSections}
            className="w-full"
          >
            {localItinerary.map((day) => (
              <AccordionItem key={day.dayNumber} value={day.dayNumber.toString()}>
                <AccordionTriggerDropTarget
                  dayNumber={day.dayNumber}
                  setOpenSections={setOpenSections}
                  openSections={openSections}
                >
                  <AccordionTrigger className='text-xl'>
                    {`Day ${day.dayNumber} (${new Date(day.date).toLocaleDateString()})`}
                  </AccordionTrigger>
                </AccordionTriggerDropTarget>
                <AccordionContent>
                  <SortableContext
                    items={
                      day.items.length > 0
                        ? day.items.map((item) => item._id)
                        : [`empty-day-${day.dayNumber}`]
                    }
                    strategy={verticalListSortingStrategy}
                  >
                    {day.items.length > 0 ? (
                      day.items.map((item) => (
                        <SortableItem key={item._id} id={item._id}>
                          <ItineraryItemCard
                            item={item}
                            editMode={editMode}
                            onEdit={handleEditItem}
                            onDelete={handleDeleteItem}
                            dayNumber={day.dayNumber}
                            setOpenSections={setOpenSections}
                            openSections={openSections}
                            // dragHandleProps will be injected by SortableItem
                          />
                        </SortableItem>
                      ))
                    ) : (
                      <DropTarget dayNumber={day.dayNumber} setOpenSections={setOpenSections} openSections={openSections} />
                    )}
                  </SortableContext>
                  <Button
                    variant='secondary'
                    className='mt-4 w-full'
                    onClick={() => handleAddItem(day.dayNumber)}
                  >
                    <MapPinPlus className='mr-2 h-4 w-4' /> New Item
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <DragOverlay>
            {draggedItem ? (
              <ItineraryItemCard
                item={draggedItem}
                editMode={false}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="w-full"
        >
          {localItinerary.map((day) => (
            <AccordionItem key={day.dayNumber} value={day.dayNumber.toString()}>
              <AccordionTrigger className='text-xl'>
                {`Day ${day.dayNumber} (${new Date(day.date).toLocaleDateString()})`}
              </AccordionTrigger>
              <AccordionContent>
                {day.items.map((item) => (
                  <ItineraryItemCard
                    key={item._id}
                    item={item}
                    editMode={false}
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
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
