import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Plan from '../models/plan.model';
import ItineraryItem from '../models/itineraryItem.model';

interface IPlanService {
  addItineraryItem(req: Request, res: Response): Promise<void>;
  getItineraryItemById(req: Request, res: Response): Promise<void>;
  updateItineraryItem(req: Request, res: Response): Promise<void>;
  deleteItineraryItem(req: Request, res: Response): Promise<void>;
}

const PlanService: IPlanService = {
  addItineraryItem: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: planId } = req.params;
      const userId = req.user as string;
      const { title, location, category, startTime } = req.body;

      if (!title || !location || !category || !startTime) {
        res.status(400).json({ error: 'Title, location, category, and startTime are required.' });
        return;
      }

      const plan = await Plan.findById(planId);
      if (!plan || plan.creator.toString() !== userId) {
        res.status(403).json({ error: 'You are not authorized to modify this plan.' });
        return;
      }
      
      const itemDate = new Date(startTime);
      const startOfDay = new Date(itemDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(itemDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      
      const lastItemOfTheDay = await ItineraryItem.findOne({
          plan_id: planId,
          startTime: { $gte: startOfDay, $lt: endOfDay }
      }).sort({ order: -1 });
      
      const newOrder = lastItemOfTheDay ? lastItemOfTheDay.order + 1 : 1;

      const newItem = new ItineraryItem({
        ...req.body,
        plan_id: planId,
        order: newOrder,
      });

      await newItem.save();
      plan.lastModifiedDate = new Date();
      await plan.save();
      
      res.status(201).json({ message: 'Item added successfully!', data: newItem });
    } catch (error) { 
        console.error('Add Itinerary Item Error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
  },

  getItineraryItemById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: planId, itemId } = req.params; 
      const userId = req.user as string;

      if (!mongoose.Types.ObjectId.isValid(planId) || !mongoose.Types.ObjectId.isValid(itemId)) {
        res.status(400).json({ error: 'Invalid ID format.' });
        return;
      }

      const plan = await Plan.findById(planId);
      if (!plan || plan.creator.toString() !== userId) {
        res.status(403).json({ error: 'Unauthorized to view items for this plan.' });
        return;
      }
      
      const item = await ItineraryItem.findOne({ _id: itemId, plan_id: planId });
      if (!item) {
        res.status(404).json({ error: 'Itinerary item not found in this plan.' });
        return;
      }

      res.status(200).json(item);
    } catch (error) {
      console.error('Get Itinerary Item Error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  },
  
  updateItineraryItem: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: planId, itemId } = req.params;
      const userId = req.user as string;

      if (!mongoose.Types.ObjectId.isValid(planId) || !mongoose.Types.ObjectId.isValid(itemId)) {
        res.status(400).json({ error: 'Invalid ID format.' });
        return;
      }

      const plan = await Plan.findById(planId);
      if (!plan || plan.creator.toString() !== userId) {
        res.status(403).json({ error: 'You are not authorized to modify this plan.' });
        return;
      }

      const updatedItem = await ItineraryItem.findOneAndUpdate(
        { _id: itemId, plan_id: planId },
        { $set: req.body },
        { new: true }
      );

      if (!updatedItem) {
        res.status(404).json({ error: 'Itinerary item not found in this plan.' });
        return;
      }
      
      plan.lastModifiedDate = new Date();
      await plan.save();
      
      res.status(200).json({ message: 'Item updated successfully!', data: updatedItem });
    } catch (error) { 
        console.error('Update Itinerary Item Error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
  },
  
  deleteItineraryItem: async (req: Request, res: Response): Promise<void> => {
    try {
        const { id: planId, itemId } = req.params;
        const userId = req.user as string;

        if (!mongoose.Types.ObjectId.isValid(planId) || !mongoose.Types.ObjectId.isValid(itemId)) {
          res.status(400).json({ error: 'Invalid ID format.' });
          return;
        }

        const plan = await Plan.findById(planId);
        if (!plan || plan.creator.toString() !== userId) {
            res.status(403).json({ error: 'You are not authorized to delete items from this plan.' });
            return;
        }
        
        const result = await ItineraryItem.findOneAndDelete({ _id: itemId, plan_id: planId });

        if (!result) {
            res.status(404).json({ error: 'Itinerary item not found in this plan.' });
            return;
        }

        res.status(200).json({ message: 'Item deleted successfully!' });
    } catch (error) {
        console.error('Delete Itinerary Item Error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
  },
};

export { PlanService };
