import { Request, Response } from 'express';
import LocationService from '../services/location.service';

interface ILocationController {
  getLocationByIP(req: Request, res: Response): Promise<void>;
}

const LocationController: ILocationController = {
  getLocationByIP: async (req: Request, res: Response) => {
    await LocationService.getLocationByIP(req, res);
  },
};

export default LocationController;
