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
      const { dayNumber, activityName, timeOfDay, estimatedCost, address, notes } = req.body;

  
      if (!mongoose.Types.ObjectId.isValid(planId)) {
        res.status(400).json({ error: 'Invalid Plan ID format.' });
        return;
      }
      if (!activityName) {
        res.status(400).json({ error: 'Activity name is required.' });
        return;
      }
      if (!dayNumber || dayNumber < 1) {
        res.status(400).json({ error: 'A valid day number is required.' });
        return;
      }


      const plan = await Plan.findById(planId);
      if (!plan) {
        res.status(404).json({ error: 'Plan not found.' });
        return;
      }

      if (plan.creator.toString() !== userId) {
        res.status(403).json({ error: 'You are not authorized to modify this plan.' });
        return;
      }


      const lastItem = await ItineraryItem.findOne({
        plan_id: planId,
        dayNumber: dayNumber,
      }).sort({ order: -1 });

      const newOrder = lastItem ? lastItem.order + 1 : 1;

  
      let combinedNotes = notes || '';
      if (address) {
        const addressNote = `Địa chỉ: ${address}`;
        combinedNotes = notes ? `${addressNote}\n\n${notes}` : addressNote;
      }

  
      const newItem = new ItineraryItem({
        plan_id: planId,
        dayNumber,
        activityName,
        timeOfDay,
        estimatedCost,
        notes: combinedNotes, 
        order: newOrder,
      });

      plan.lastModifiedDate = new Date();
      await Promise.all([newItem.save(), plan.save()]);

      res.status(201).json({
        message: 'Item added successfully!',
        data: newItem,
      });

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

      const item = await ItineraryItem.findById(itemId);
      if (!item || item.plan_id.toString() !== planId) {
        res.status(404).json({ error: 'Itinerary item not found in this plan.' });
        return;
      }

      const plan = await Plan.findById(planId);
      if (!plan || plan.creator.toString() !== userId) {
        res.status(403).json({ error: 'You are not authorized to view this item.' });
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
      const updateData = req.body;

      
      if (!mongoose.Types.ObjectId.isValid(planId) || !mongoose.Types.ObjectId.isValid(itemId)) {
        res.status(400).json({ error: 'Invalid ID format.' });
        return;
      }

     
      const plan = await Plan.findById(planId);
      if (!plan) {
        res.status(404).json({ error: 'Plan not found.' });
        return;
      }
      if (plan.creator.toString() !== userId) {
        res.status(403).json({ error: 'You are not authorized to modify this plan.' });
        return;
      }

      
      const itemToUpdate = await ItineraryItem.findOne({ _id: itemId, plan_id: planId });
      if (!itemToUpdate) {
        res.status(404).json({ error: 'Itinerary item not found in this plan.' });
        return;
      }

      
      Object.assign(itemToUpdate, updateData);

      const updatedItem = await itemToUpdate.save();

     
      plan.lastModifiedDate = new Date();
      await plan.save();

     
      res.status(200).json({
        message: 'Item updated successfully!',
        data: updatedItem,
      });

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
      if (!plan) {
        res.status(404).json({ error: 'Plan not found.' });
        return;
      }
      if (plan.creator.toString() !== userId) {
        res.status(403).json({ error: 'You are not authorized to modify this plan.' });
        return;
      }

     
      const result = await ItineraryItem.findOneAndDelete({
        _id: itemId,
        plan_id: planId,
      });

      
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