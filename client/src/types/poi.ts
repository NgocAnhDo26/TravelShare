export interface POI {
  id: string;
  type: string; // "POI"
  poi: {
    name: string;
    categorySet?: { id: number }[];
    categories?: string[];
    classifications?: {
      code: string;
      names: { nameLocale: string; name: string }[];
    }[];
    phone?: string;
  };
  address: {
    streetNumber?: string;
    streetName?: string;
    municipalitySubdivision?: string;
    municipality?: string;
    municipalitySecondarySubdivision?: string;
    countrySecondarySubdivision?: string;
    countrySubdivision?: string;
    countrySubdivisionName?: string;
    countrySubdivisionCode?: string;
    postalCode?: string;
    countryCode: string;
    country: string;
    countryCodeISO3: string;
    freeformAddress: string;
    localName?: string;
  };
  position: {
    lat: number;
    lon: number;
  };
  viewport?: {
    topLeftPoint: { lat: number; lon: number };
    btmRightPoint: { lat: number; lon: number };
  };
  entryPoints?: {
    type: string;
    position: { lat: number; lon: number };
  }[];
}
