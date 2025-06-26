import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IItineraryItem extends Document {
  plan_id: Types.ObjectId;
  dayNumber: number;
  timeOfDay?: string;
  activityName: string;
  notes?: string;
  locationCoordinates?: { lat: number; lng: number };
  estimatedCost?: string;
  order: number;
  created_date: Date;
}

const ItineraryItemSchema: Schema = new Schema({
  plan_id: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
  dayNumber: { type: Number, required: true },
  timeOfDay: { type: String, trim: true },
  activityName: { type: String, required: true, trim: true },
  notes: { type: String, trim: true },
  locationCoordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
  estimatedCost: { type: String, trim: true },
  order: { type: Number, required: true },
  created_date: { type: Date, default: Date.now },
});

export default mongoose.model<IItineraryItem>('ItineraryItem', ItineraryItemSchema);