import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MapPin, Shield } from 'lucide-react';
import { LocationService, type UserLocation } from '@/utils/locationService';

interface LocationPermissionDialogProps {
  isOpen: boolean;
  onComplete: (location: UserLocation) => void;
  onSkip: () => void;
}

export const LocationPermissionDialog: React.FC<
  LocationPermissionDialogProps
> = ({ isOpen, onComplete, onSkip }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAllowLocation = async () => {
    setIsLoading(true);
    try {
      const location = await LocationService.promptForLocationPermission();
      onComplete(location);
    } catch (error) {
      console.error('Location permission error:', error);
      // Even if GPS fails, we still get IP location as fallback
      try {
        const ipLocation = await LocationService.getIPLocation();
        LocationService.storeLocation(ipLocation);
        onComplete(ipLocation);
      } catch (ipError) {
        console.error('IP location fallback failed:', ipError);
        onSkip();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Mark that user has been prompted but denied
    LocationService.setPermissionInfo({
      status: 'denied',
      timestamp: Date.now(),
      hasBeenPrompted: true,
    });
    onSkip();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <div className='flex items-center gap-2 mb-2'>
            <MapPin className='h-6 w-6 text-blue-600' />
            <DialogTitle>Enable Location Services</DialogTitle>
          </div>
          <DialogDescription className='text-left space-y-3'>
            <p>
              To provide you with the best travel planning experience,
              TravelShare would like to access your location.
            </p>
            <div className='bg-blue-50 p-3 rounded-lg'>
              <div className='flex items-start gap-2'>
                <Shield className='h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0' />
                <div className='text-sm'>
                  <p className='font-medium text-blue-900 mb-1'>
                    Why we need this:
                  </p>
                  <ul className='text-blue-800 space-y-1 text-xs'>
                    <li>• More accurate destination and POI search results</li>
                    <li>• Better travel recommendations for your area</li>
                    <li>• Improved route planning and local suggestions</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className='text-xs text-gray-600'>
              If you choose to skip, we'll use your IP address to provide
              location-based features with less accuracy.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='flex gap-2 sm:gap-2'>
          <Button
            variant='outline'
            onClick={handleSkip}
            disabled={isLoading}
            className='flex-1'
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleAllowLocation}
            disabled={isLoading}
            className='flex-1'
          >
            {isLoading ? 'Getting Location...' : 'Allow Location'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
