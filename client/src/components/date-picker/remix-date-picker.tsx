import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import { type DateRange } from 'react-day-picker';

interface InitialDateRangePickerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
  onDateChange?: (date: DateRange | undefined) => void;
  initialDateRange?: DateRange;
}

export default function InitialDateRangePicker({
  className,
  id,
  onDateChange,
  initialDateRange,
}: InitialDateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(
    initialDateRange,
  );
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setDate(initialDateRange);
  }, [initialDateRange]);

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    onDateChange?.(newDate);
  };

  return (
    <div className={cn('relative grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant='outline'
            className={cn(
              'w-full justify-start text-left font-normal h-auto py-2',
              !date && 'text-muted-foreground',
            )}
          >
            <span className='flex items-center text-lg'>
              <CalendarIcon className='mr-2 h-4 w-4' />
              {date?.from ? (
                <span className='text-sm'>
                  {format(date.from, 'LLL dd, y')}
                </span>
              ) : (
                <span className='text-gray-400 text-sm'>Start date</span>
              )}
            </span>
            <span className='mx-2 text-gray-300 text-md'>|</span>
            <span className='flex items-center text-lg'>
              <CalendarIcon className='mr-2 h-4 w-4' />
              {date?.to ? (
                <span className='text-sm'>{format(date.to, 'LLL dd, y')}</span>
              ) : (
                <span className='text-gray-400 text-sm'>End date</span>
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            autoFocus
            mode='range'
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateChange}
            numberOfMonths={2}
            disabled={{ before: new Date() }}
            showOutsideDays={false}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}