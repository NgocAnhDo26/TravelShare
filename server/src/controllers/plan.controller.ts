import { Request, Response } from 'express';
import { PlanService } from '../services/plan.service';

interface IPlanController {
    addItineraryItem(req: Request, res: Response): Promise<void>;
    getItineraryItemById(req: Request, res: Response): Promise<void>; 
    updateItineraryItem(req: Request, res: Response): Promise<void>;
    deleteItineraryItem(req: Request, res: Response): Promise<void>;
}

const PlanController: IPlanController = {
    
    addItineraryItem: async (req: Request, res: Response): Promise<void> => {
       
        await PlanService.addItineraryItem(req, res);
    },

   getItineraryItemById: async (req: Request, res: Response): Promise<void> => {
        await PlanService.getItineraryItemById(req, res);
    },
    
    updateItineraryItem: async (req: Request, res: Response): Promise<void> => {
        await PlanService.updateItineraryItem(req, res);
    },
     deleteItineraryItem: async (req: Request, res: Response): Promise<void> => {
        await PlanService.deleteItineraryItem(req, res);
    },
};

export default PlanController;