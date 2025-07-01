import { Document, Model, model, Schema, Types } from 'mongoose';

const locationSchema: Schema = new Schema(
  {
    /** Unique place ID from Google, used for detailed information queries later */
    placeId: { type: String, required: true },
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
    type: { type: String, enum: ['activity', 'food'], required: true },
    title: { type: String, required: true, trim: true },
    startTime: String,
    cost: { type: Number, default: 0 },
    notes: String,
    location: locationSchema,
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
 * Interface for a Location object
 */
export interface ILocation {
  placeId: string;
  name: string;
  address: string;
  coordinates?: { lat: number; lng: number };
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
  schedule: {
    dayNumber: number;
    date: Date;
    title?: string;
    items: {
      _id: Types.ObjectId;
      type: 'activity' | 'food';
      title: string;
      startTime?: string;
      cost?: number;
      notes?: string;
      location?: ILocation;
    }[];
  }[];
  likesCount: number;
  commentsCount: number;
  remixCount: number;
  trendingScore: number;
  originalPlan?: Types.ObjectId;
}

/**
 * Main schema for Travel Plan
 */
const travelPlanSchema: Schema<ITravelPlan> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    /** Replace String field with locationSchema sub-schema */
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
  { timestamps: true },
);

export const TravelPlan: Model<ITravelPlan> = model<ITravelPlan>(
  'TravelPlan',
  travelPlanSchema,
);