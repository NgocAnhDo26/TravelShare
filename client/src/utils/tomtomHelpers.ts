import type { Destination } from '@/types/destination';
import type { POI } from '@/types/poi';
import type { ITomTomLocationBase, IPOILocation } from '@/types/trip';

/**
 * Convert TomTom Destination API response to ITomTomLocationBase format
 */
export function destinationToTomTomLocation(
  destination: Destination,
): ITomTomLocationBase {
  return {
    placeId: destination.id,
    name: destination.address.freeformAddress,
    address: destination.address.freeformAddress,
    coordinates: {
      lat: destination.position.lat,
      lng: destination.position.lon,
    },
    entityType: destination.entityType,
    countryCode: destination.address.countryCode,
    country: destination.address.country,
    countryCodeISO3: destination.address.countryCodeISO3,
    boundingBox: destination.boundingBox,
    viewport: destination.viewport,
    dataSources: destination.dataSources,
  };
}

/**
 * Convert TomTom POI API response to IPOILocation format
 */
export function poiToTomTomLocation(poi: POI): IPOILocation {
  return {
    placeId: poi.id,
    name: poi.poi.name,
    address: poi.address.freeformAddress,
    coordinates: {
      lat: poi.position.lat,
      lng: poi.position.lon,
    },
    entityType: poi.type,
    countryCode: poi.address.countryCode,
    country: poi.address.country,
    countryCodeISO3: poi.address.countryCodeISO3,
    viewport: poi.viewport,
    phone: poi.poi.phone,
    categories: poi.poi.categories,
    classifications: poi.poi.classifications,
  };
}

/**
 * Create a basic ITomTomLocationBase from simple location data (fallback)
 */
export function createBasicTomTomLocation(
  name: string,
  address: string,
): ITomTomLocationBase {
  return {
    placeId: '',
    name: name.trim(),
    address: address.trim(),
  };
}
