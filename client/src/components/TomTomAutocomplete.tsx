import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import type { Destination } from '@/types/destination';
import type { POI } from '@/types/poi';
import { LocationService, type UserLocation } from '@/utils/locationService';

interface TomTomAutocompleteProps {
  apiKey: string;
  apiType: 'destination' | 'poi';
  geobias?: string; // rectangle:lat1,lon1,lat2,lon2
  placeholder?: string;
  onSelect: (result: Destination | POI) => void;
  className?: string;
  destination?: Destination; // Thêm prop này để truyền destination đã chọn
}

const TomTomAutocomplete: React.FC<TomTomAutocompleteProps> = ({
  apiKey,
  apiType,
  geobias,
  placeholder = 'Search location...',
  onSelect,
  className,
  destination,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<(Destination | POI)[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Only get location when needed for search, and respect GPS permissions
  useEffect(() => {
    const loadUserLocation = () => {
      // Check permission status first
      const permissionInfo = LocationService.getPermissionInfo();

      // Only use location if GPS is granted or if it's IP-based location
      if (permissionInfo.status === 'granted') {
        const storedLocation = LocationService.getLocationForUI();
        if (storedLocation) {
          setUserLocation(storedLocation);
        }
      } else {
        // For non-GPS permitted users, only use IP-based location if available
        const storedLocation = LocationService.getLocationForUI();
        if (storedLocation && storedLocation.source === 'ip') {
          setUserLocation(storedLocation);
        } else {
          // Clear user location if permission is denied and no IP location
          setUserLocation(null);
        }
      }
    };

    // Load location initially
    loadUserLocation();

    // Subscribe to location updates
    const unsubscribe = LocationService.subscribeToLocationUpdates(() => {
      loadUserLocation();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (value.trim().length === 0) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    timeoutRef.current = setTimeout(() => {
      fetchResults(value);
    }, 400);
  };

  const fetchResults = async (q: string) => {
    setLoading(true);
    let url = '';
    if (apiType === 'destination') {
      url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json?key=${apiKey}&entityTypeSet=Country,Municipality,CountrySubdivision`;

      // Only add user location to the search if we have permission to use it
      const permissionInfo = LocationService.getPermissionInfo();
      if (
        userLocation &&
        (permissionInfo.status === 'granted' || userLocation.source === 'ip')
      ) {
        url += `&lat=${userLocation.lat}&lon=${userLocation.lon}`;
      }
    } else {
      url = `https://api.tomtom.com/search/2/poiSearch/${encodeURIComponent(q)}.json?key=${apiKey}`;
      let geo = geobias;
      let countrySet = '';
      // Ưu tiên dùng boundingBox, countryCode từ destination nếu có
      if (
        destination &&
        destination.boundingBox &&
        destination.address.countryCode
      ) {
        const box = destination.boundingBox;
        geo = `rectangle:${box.topLeftPoint.lat},${box.topLeftPoint.lon},${box.btmRightPoint.lat},${box.btmRightPoint.lon}`;
        countrySet = destination.address.countryCode;
      } else if (userLocation) {
        // Only use user location for geobias if we have permission
        const permissionInfo = LocationService.getPermissionInfo();
        if (
          permissionInfo.status === 'granted' ||
          userLocation.source === 'ip'
        ) {
          // fallback: boundingBox: 0.5 degree around user
          const d = 0.5;
          const top = userLocation.lat + d;
          const left = userLocation.lon - d;
          const bottom = userLocation.lat - d;
          const right = userLocation.lon + d;
          geo = `rectangle:${top},${left},${bottom},${right}`;
          if (userLocation.countryCode) countrySet = userLocation.countryCode;
        }
      }
      if (geo) url += `&geobias=${geo}`;
      if (countrySet) url += `&countrySet=${countrySet}`;
    }
    try {
      const res = await fetch(url);
      const data = await res.json();
      setResults(data.results || []);
      setShowDropdown(true);
    } catch {
      setResults([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: Destination | POI) => {
    setQuery(
      apiType === 'destination'
        ? (item as Destination).address.freeformAddress
        : (item as POI).poi.name,
    );
    setShowDropdown(false);
    onSelect(item);
  };

  return (
    <div className={`relative ${className || ''}`.trim()}>
      <Input
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        autoComplete='off'
        onFocus={() => {
          if (results.length > 0) setShowDropdown(true);
        }}
      />
      {showDropdown && results.length > 0 && (
        <Card className='absolute z-10 w-full mt-1 max-h-64 overflow-y-auto bg-white border shadow-lg'>
          {results.map((item, idx) => (
            <div
              key={`${(item as Destination).id || (item as POI).id || idx}`}
              className='px-3 py-2 hover:bg-gray-100 cursor-pointer text-left'
              onClick={() => handleSelect(item)}
            >
              {apiType === 'destination' ? (
                <React.Fragment>
                  <div className='font-medium'>
                    {(item as Destination).address.freeformAddress}
                  </div>
                  <div className='text-xs text-gray-500'>
                    {(item as Destination).entityType}
                  </div>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <div className='font-medium'>{(item as POI).poi.name}</div>
                  <div className='text-xs text-gray-500'>
                    {(item as POI).address.freeformAddress}
                  </div>
                </React.Fragment>
              )}
            </div>
          ))}
        </Card>
      )}
      {loading && (
        <div className='absolute right-2 top-2 text-xs text-gray-400'>
          Loading...
        </div>
      )}
    </div>
  );
};

export default TomTomAutocomplete;
