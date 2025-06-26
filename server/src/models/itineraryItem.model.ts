import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IItineraryItem extends Document {
  plan_id: Types.ObjectId;
  title: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;  
  location?: string;
  category: string;
  budget?: number;
  notes?: string;
  order: number;
  created_date: Date;
}

const ItineraryItemSchema: Schema = new Schema({
  plan_id: { type: Schema.Types.ObjectId, ref: 'Plan', required: true, index: true },
  title: { type: String, required: [true, 'Activity title is required.'], trim: true },
  description: { type: String, trim: true },
  startTime: { type: Date },
  endTime: { type: Date },  
  location: { type: String, trim: true },
  category: { type: String, required: true, default: 'attraction' },
  budget: { type: Number, default: 0 },
  notes: { type: String, trim: true },
  order: { type: Number, required: true },
  created_date: { type: Date, default: Date.now },
});

export default mongoose.model<IItineraryItem>('ItineraryItem', ItineraryItemSchema);