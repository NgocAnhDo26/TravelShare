import { Document, Model, model, Schema, Types } from 'mongoose';



/**
 * Location data schema from Google Maps
 */
const locationSchema: Schema = new Schema(
  {
    /** Unique place ID from Google, used for detailed information queries later */
    placeId: { type: String, required: false },
    /** Name of the place */
    name: { type: String, required: true },
    /** Formatted address */
    address: { type: String, required: true },
    /** Geographic coordinates */
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { _id: false },
);

/**
 * Schema for an item in the daily schedule
 */
const planItemSchema: Schema = new Schema(
  {
    type: { 
      type: String, 
      enum: ['activity', 'food', 'accommodation', 'transportation', 'shopping', 'other'], 
      required: true 
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startTime: { type: Date },
    endTime: { type: Date },
    cost: { type: String, default: '' }, // Changed from Number to String
    notes: { type: String, trim: true },
    location: locationSchema,
    order: { type: Number, required: true },
  },
  { _id: true, timestamps: true },
);

/**
 * Schema for a day in the schedule
 */
const dailyScheduleSchema: Schema = new Schema(
  {
    dayNumber: { type: Number, required: true },
    date: { type: Date, required: true },
    title: String,
    items: [planItemSchema],
  },
  { _id: false },
);
/**
 * Interface for a Location object from Google Maps
 */
export interface ILocation {
  placeId?: string;
  name: string;
  address: string;
  coordinates?: { lat: number; lng: number };
}

/**
 * Interface for an item in the daily schedule
 */
export interface IPlanItem {
  _id: Types.ObjectId;
  type: 'activity' | 'food' | 'accommodation' | 'transportation' | 'shopping' | 'other';
  title: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  location?: ILocation;
  cost?: string; // Changed from number to string
  notes?: string;
  order: number;
}

/**
 * Interface for a day in the schedule
 */
export interface IDailySchedule {
  dayNumber: number;
  date: Date;
  title?: string;
  items: IPlanItem[];
}

/**
 * Interface for TravelPlan Document
 */
export interface ITravelPlan extends Document {
  title: string;
  destination: ILocation;
  coverImageUrl?: string;
  author: Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
  privacy: 'public' | 'private';
  schedule: IDailySchedule[];
  likesCount: number;
  commentsCount: number;
  remixCount: number;
  trendingScore: number;
  originalPlan?: Types.ObjectId;
}

const travelPlanSchema: Schema<ITravelPlan> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    destination: {
      type: locationSchema,
      required: true,
    },
    coverImageUrl: {
      type: String,
      default: 'https://placehold.co/1200x400/CCCCCC/FFFFFF?text=TravelShare',
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    startDate: Date,
    endDate: Date,
    privacy: {
      type: String,
      enum: ['public', 'private'],
      default: 'private',
    },
    schedule: [dailyScheduleSchema],
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    remixCount: { type: Number, default: 0 },
    trendingScore: { type: Number, default: 0, index: true },
    originalPlan: { type: Schema.Types.ObjectId, ref: 'TravelPlan' },
  },
  { timestamps: true }, // Replaces lastModifiedDate and created_date
);

const TravelPlan: Model<ITravelPlan> = model<ITravelPlan>('TravelPlan', travelPlanSchema);
export default TravelPlan;