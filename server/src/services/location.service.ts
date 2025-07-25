import { Request, Response } from 'express';
import fetch from 'node-fetch';

interface IpApiResponse {
  lat: number;
  lon: number;
  countryCode: string;
  city: string;
  regionName: string;
}

interface ILocationService {
  getLocationByIP(req: Request, res: Response): Promise<void>;
}

const LocationService: ILocationService = {
  getLocationByIP: async (req: Request, res: Response) => {
    try {
      // Dùng ip-api.com/json hoặc ipinfo.io/json
      const ipApiUrl = 'http://ip-api.com/json';
      const response = await fetch(ipApiUrl);
      // Then cast the response:
      const data = (await response.json()) as IpApiResponse;
      res.json({
        lat: data.lat,
        lon: data.lon,
        countryCode: data.countryCode,
        city: data.city,
        region: data.regionName,
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to get location by IP' });
    }
  },
};

export default LocationService;
