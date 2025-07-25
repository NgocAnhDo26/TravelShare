export interface Destination {
  id: string;
  type: string; // "Geography"
  entityType: string; // "Municipality", "Country", ...
  address: {
    municipality?: string;
    countrySecondarySubdivision?: string;
    countrySubdivision?: string;
    countrySubdivisionName?: string;
    countrySubdivisionCode?: string;
    countryCode: string;
    country: string;
    countryCodeISO3: string;
    freeformAddress: string;
  };
  position: {
    lat: number;
    lon: number;
  };
  viewport?: {
    topLeftPoint: { lat: number; lon: number };
    btmRightPoint: { lat: number; lon: number };
  };
  boundingBox?: {
    topLeftPoint: { lat: number; lon: number };
    btmRightPoint: { lat: number; lon: number };
  };
  dataSources?: Record<string, unknown>;
}
