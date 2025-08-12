import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InitialDateRangePicker from '@/components/date-picker/remix-date-picker';
import type { DateRange } from 'react-day-picker';
import type { Trip } from '@/types/trip';
import { useNavigate } from 'react-router-dom';
import API from '@/utils/axiosInstance';
import toast from 'react-hot-toast';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RemixPlanFormProps {
  trip: Trip;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const PrivacySelector = ({
  value,
  onValueChange,
}: {
  value: 'public' | 'private';
  onValueChange: (value: 'public' | 'private') => void;
}) => {
  // Updated: Using the same SVG icons as the trip planning page.
  const options = [
    {
      value: 'public',
      label: 'Public',
      icon: (
        <svg
          className='inline'
          width='20'
          height='20'
          fill='none'
          viewBox='0 0 24 24'
        >
          <circle
            cx='12'
            cy='12'
            r='10'
            stroke='currentColor'
            strokeWidth='2'
          />
          <path
            d='M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z'
            stroke='currentColor'
            strokeWidth='2'
          />
        </svg>
      ),
    },
    {
      value: 'private',
      label: 'Private',
      icon: (
        <svg
          className='inline'
          width='20'
          height='20'
          fill='none'
          viewBox='0 0 24 24'
        >
          <rect
            x='3'
            y='11'
            width='18'
            height='11'
            rx='2'
            stroke='currentColor'
            strokeWidth='2'
          />
          <path
            d='M7 11V7a5 5 0 0 1 10 0v4'
            stroke='currentColor'
            strokeWidth='2'
          />
        </svg>
      ),
    },
  ];

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' className='w-40 justify-between'>
          <div className='flex items-center'>
            {selectedOption?.icon}
            <span className='ml-2'>{selectedOption?.label}</span>
          </div>
          <ChevronDown className='w-4 h-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='start'
        className='w-[--radix-dropdown-menu-trigger-width]'
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onValueChange(option.value as 'public' | 'private')}
          >
            {option.icon}
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const RemixPlanForm: React.FC<RemixPlanFormProps> = ({
  trip,
  isOpen,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState(`Copy of ${trip.title}`);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [privacy, setPrivacy] = useState<'public' | 'private'>('private');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (trip.startDate && trip.endDate) {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      const duration = end.getTime() - start.getTime();

      const newStartDate = new Date();
      newStartDate.setDate(newStartDate.getDate() + 1); // Tomorrow

      const newEndDate = new Date(newStartDate.getTime() + duration);

      setDateRange({ from: newStartDate, to: newEndDate });
    }
    setTitle(`Copy of ${trip.title}`);
    setPrivacy('private');
  }, [trip, isOpen]);

  const handleRemix = async () => {
    if (!title) {
      setError('Title is required.');
      return;
    }
    if (!dateRange?.from || !dateRange?.to) {
      setError('Start and end dates are required.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await API.post(`/plans/${trip._id}/remix`, {
        title,
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        privacy,
      });

      toast.success('Plan remixed successfully!');
      onOpenChange(false);
      navigate(`/plans/${response.data._id}/edit`);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || 'Failed to remix plan. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remix "{trip.title}"</DialogTitle>
          <DialogDescription>
            Create a new trip based on this one. You can change the details
            below.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          {error && (
            <div
              className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative'
              role='alert'
            >
              <span className='block sm:inline'>{error}</span>
            </div>
          )}
          <div className='space-y-2'>
            <Label htmlFor='remix-title'>Title</Label>
            <Input
              id='remix-title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter the new trip's title"
            />
          </div>
          <div className='space-y-2'>
            <Label>Dates</Label>
            <InitialDateRangePicker
              onDateChange={setDateRange}
              initialDateRange={dateRange}
            />
          </div>
          <div className='space-y-2'>
            <Label>Privacy</Label>
            <PrivacySelector value={privacy} onValueChange={setPrivacy} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleRemix} disabled={isLoading}>
            {isLoading ? 'Remixing...' : 'Remix'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RemixPlanForm;
