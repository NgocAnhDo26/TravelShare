import DateRangePicker from '@/components/date-picker/date-range-picker';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
// import Header from '@/components/header';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '@/utils/axiosInstance';
import type { ITomTomLocationBase } from '@/types/trip';
import type { DateRange } from 'react-day-picker';
import TomTomAutocomplete from '@/components/TomTomAutocomplete';
import { TOMTOM_CONFIG } from '@/config/env';
import type { Destination } from '@/types/destination';
import { destinationToTomTomLocation } from '@/utils/tomtomHelpers';
import { LocationPermissionDialog } from '@/components/LocationPermissionDialog';
import { LocationService } from '@/utils/locationService';

function TripPlanningContent() {
  const navigate = useNavigate();
  const [publicState, setPublicState] = useState<
    'friends' | 'public' | 'private'
  >('public');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [inviteFocused, setInviteFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form state
  const [destination, setDestination] = useState<ITomTomLocationBase | null>(
    null,
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Location permission state
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  // Check GPS permission status when component loads
  useEffect(() => {
    const checkLocationPermission = async () => {
      const permissionInfo = LocationService.getPermissionInfo();

      // If permission status is not granted, show dialog
      if (permissionInfo.status !== 'granted') {
        setShowLocationDialog(true);
      } else {
        // Location is already stored in LocationService, no need to do anything
      }
    };

    checkLocationPermission();
  }, []);

  const handleLocationPermissionComplete = () => {
    // Location is already stored by LocationService
    setShowLocationDialog(false);

    // If user was trying to submit the form, continue with submission
    if (destination && dateRange?.from && dateRange?.to) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          form.requestSubmit();
        }
      }, 100);
    }
  };

  const handleLocationPermissionSkip = async () => {
    // Get IP-based location as fallback
    try {
      const ipLocation = await LocationService.getIPLocation();
      LocationService.storeLocation(ipLocation);
      // Location is now stored in LocationService
    } catch (error) {
      console.error('Failed to get IP location:', error);
    }
    setShowLocationDialog(false);

    // If user was trying to submit the form, continue with submission
    if (destination && dateRange?.from && dateRange?.to) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          form.requestSubmit();
        }
      }, 100);
    }
  };

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Check GPS permission status before creating plan
      const permissionInfo = LocationService.getPermissionInfo();

      // If permission is not granted, show location dialog again
      if (permissionInfo.status !== 'granted') {
        setShowLocationDialog(true);
        setIsLoading(false);
        return;
      }

      // Validation
      if (!destination) {
        throw new Error('Destination is required');
      }

      if (!dateRange?.from || !dateRange?.to) {
        throw new Error('Please select travel dates');
      }

      if (dateRange.from > dateRange.to) {
        throw new Error('Start date cannot be after end date');
      }

      // Prepare request data with complete TomTom destination data
      const planData = {
        title: destination.name, // Use the location name as title
        destination: destination, // Send complete TomTom location data
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        privacy: publicState,
      };

      // Make API call
      const response = await API.post('/plans', planData);

      // Navigate to the created plan
      navigate(`/plans/${response.data._id}/edit`);
    } catch (err: unknown) {
      console.error('Error creating travel plan:', err);
      const error = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      setError(
        error.response?.data?.error ||
          error.message ||
          'Failed to create travel plan',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const publicOptions = [
    {
      value: 'public',
      label: 'Public',
      icon: (
        <svg
          className='inline mr-2'
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
    // {
    //   value: 'friends',
    //   label: 'Friends',
    //   icon: (
    //     <svg
    //       className='inline mr-2'
    //       width='20'
    //       height='20'
    //       fill='none'
    //       viewBox='0 0 24 24'
    //     >
    //       <path
    //         d='M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2'
    //         stroke='currentColor'
    //         strokeWidth='2'
    //         strokeLinecap='round'
    //         strokeLinejoin='round'
    //       />
    //       <circle
    //         cx='9'
    //         cy='7'
    //         r='4'
    //         stroke='currentColor'
    //         strokeWidth='2'
    //         strokeLinecap='round'
    //         strokeLinejoin='round'
    //       />
    //       <path
    //         d='M23 21v-2a4 4 0 0 0-3-3.87'
    //         stroke='currentColor'
    //         strokeWidth='2'
    //         strokeLinecap='round'
    //         strokeLinejoin='round'
    //       />
    //       <path
    //         d='M16 3.13a4 4 0 0 1 0 7.75'
    //         stroke='currentColor'
    //         strokeWidth='2'
    //         strokeLinecap='round'
    //         strokeLinejoin='round'
    //       />
    //     </svg>
    //   ),
    // },
    {
      value: 'private',
      label: 'Private',
      icon: (
        <svg
          className='inline mr-2'
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

  return (
    <div className='flex flex-col items-center justify-center min-h-[80vh]'>
      <h1 className='text-4xl font-bold mb-8 mt-8 text-center'>
        Plan a new trip
      </h1>
      <form
        onSubmit={handleSubmit}
        className='w-full max-w-xl flex flex-col items-center gap-4'
      >
        {error && (
          <div className='w-full p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm'>
            {error}
          </div>
        )}
        <div className='w-full relative'>
          <TomTomAutocomplete
            apiKey={TOMTOM_CONFIG.API_KEY}
            apiType='destination'
            placeholder='Where to?'
            onSelect={(result) => {
              if ('address' in result) {
                // Convert TomTom Destination to ITomTomLocationBase
                const tomtomLocation = destinationToTomTomLocation(
                  result as Destination,
                );
                setDestination(tomtomLocation);
              }
            }}
            className='w-full h-14'
          />
        </div>
        <div className='w-full'>
          <DateRangePicker
            id='dateRange'
            className='w-full'
            onDateChange={setDateRange}
          />
        </div>
        <div className='flex w-full justify-between items-center mt-2 mb-2'>
          {!inviteOpen ? (
            <>
              <div
                className='flex items-center gap-1 text-gray-600 cursor-pointer'
                onClick={() => setInviteOpen(true)}
              >
                {/* <span className='text-xl font-bold'>+</span>
                <span className='font-medium'>Invite tripmates</span> */}
              </div>
              {/* Dropdown for publicState */}
              <div className='relative' ref={dropdownRef}>
                <button
                  type='button'
                  className='flex items-center gap-1 text-gray-600 px-3 py-1 rounded-md font-medium hover:bg-gray-200 focus:bg-gray-200 transition'
                  onClick={() => setDropdownOpen((open) => !open)}
                >
                  {publicOptions.find((opt) => opt.value === publicState)?.icon}
                  <span>
                    {
                      publicOptions.find((opt) => opt.value === publicState)
                        ?.label
                    }
                  </span>
                  <svg
                    width='16'
                    height='16'
                    fill='none'
                    viewBox='0 0 24 24'
                    className='ml-1'
                  >
                    <path
                      d='M6 9l6 6 6-6'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className='absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border z-10'>
                    {publicOptions.map((option) => (
                      <button
                        type='button'
                        key={option.value}
                        className={`flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 rounded-md ${
                          publicState === option.value ? 'bg-gray-100' : ''
                        }`}
                        onClick={() => {
                          setPublicState(
                            option.value as 'friends' | 'public' | 'private',
                          );
                          setDropdownOpen(false);
                        }}
                      >
                        {option.icon}
                        <span className='font-medium'>{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className='w-full'>
              <div className='relative w-full'>
                <input
                  id='invite'
                  type='email'
                  className='peer w-full h-14 px-4 pt-5 pb-1 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black-400 text-base placeholder-gray-400' // 2. Update className
                  placeholder={inviteFocused ? 'Enter an email address' : ' '}
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                  onFocus={() => setInviteFocused(true)}
                  onBlur={() => setInviteFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inviteInput.trim()) {
                      setEmails([...emails, inviteInput.trim()]);
                      setInviteInput('');
                      e.preventDefault();
                    }
                  }}
                />
                <Label
                  htmlFor='invite'
                  className='absolute left-4 top-2 text-gray-500 text-base transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-1 peer-focus:text-sm peer-focus:text-black-600'
                >
                  Invite tripmates
                </Label>
              </div>
              {emails.length > 0 && (
                <div className='flex flex-wrap gap-2 mt-2'>
                  {emails.map((email, idx) => (
                    <div
                      key={idx}
                      className='flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-800 text-base max-w-full'
                    >
                      <span className='truncate'>{email}</span>
                      <button
                        type='button'
                        className='text-gray-400 hover:text-gray-700 transition p-1 rounded-full'
                        onClick={() =>
                          setEmails(emails.filter((_, i) => i !== idx))
                        }
                        aria-label='Remove email'
                      >
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-5 w-5'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M6 18L18 6M6 6l12 12'
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Right-aligned dropdown below */}
              <div className='flex justify-end mt-4'>
                <div className='relative' ref={dropdownRef}>
                  <button
                    type='button'
                    className='flex items-center gap-1 text-gray-600 px-3 py-1 rounded-md font-medium hover:bg-gray-200 focus:bg-gray-200 transition'
                    onClick={() => setDropdownOpen((open) => !open)}
                  >
                    {
                      publicOptions.find((opt) => opt.value === publicState)
                        ?.icon
                    }
                    <span>
                      {
                        publicOptions.find((opt) => opt.value === publicState)
                          ?.label
                      }
                    </span>
                    <svg
                      width='16'
                      height='16'
                      fill='none'
                      viewBox='0 0 24 24'
                      className='ml-1'
                    >
                      <path
                        d='M6 9l6 6 6-6'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                  </button>
                  {dropdownOpen && (
                    <div className='absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border z-10'>
                      {publicOptions.map((option) => (
                        <button
                          type='button'
                          key={option.value}
                          className={`flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 ${
                            publicState === option.value ? 'bg-gray-100' : ''
                          }`}
                          onClick={() => {
                            setPublicState(
                              option.value as 'friends' | 'public' | 'private',
                            );
                            setDropdownOpen(false);
                          }}
                        >
                          {option.icon}
                          <span className='font-medium'>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <Button
          type='submit'
          disabled={isLoading}
          className='w-full h-14 text-lg font-semibold mt-4 mb-2 text-white disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isLoading ? 'Creating plan...' : 'Start planning'}
        </Button>
      </form>

      {/* Location Permission Dialog */}
      <LocationPermissionDialog
        isOpen={showLocationDialog}
        onComplete={handleLocationPermissionComplete}
        onSkip={handleLocationPermissionSkip}
      />
    </div>
  );
}

export default function TripPlanningPage() {
  return (
    <div className='flex flex-col h-screen'>
      <div className='flex-1 overflow-y-auto'>
        <TripPlanningContent />
      </div>
    </div>
  );
}
