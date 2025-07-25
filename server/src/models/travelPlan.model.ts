import { Document, Model, model, Schema, Types } from 'mongoose';

/**
 * Base schema for TomTom location data (shared fields)
 */
const tomtomLocationBaseSchema: Record<string, any> = {
  placeId: { type: String, required: false },
  name: { type: String, required: true },
  address: { type: String, required: true },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
  entityType: { type: String },
  countryCode: { type: String },
  country: { type: String },
  countryCodeISO3: { type: String },
  boundingBox: {
    topLeftPoint: {
      lat: { type: Number },
      lon: { type: Number },
    },
    btmRightPoint: {
      lat: { type: Number },
      lon: { type: Number },
    },
  },
  viewport: {
    topLeftPoint: {
      lat: { type: Number },
      lon: { type: Number },
    },
    btmRightPoint: {
      lat: { type: Number },
      lon: { type: Number },
    },
  },
  dataSources: { type: Object },
};

/**
 * Simple destination schema for basic location data
 * Used when detailed TomTom data is not available
 */
const simpleDestinationSchema: Schema = new Schema(
  {
    placeId: { type: String, default: '' },
    name: { type: String, required: true },
    address: { type: String, required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { _id: false },
);

/**
 * Schema for a destination (Geography) from TomTom API
 * Used for the main destination of a travel plan
 */
const destinationSchema: Schema = new Schema(
  {
    ...tomtomLocationBaseSchema,
    // No extra fields for destination
  },
  { _id: false },
);

/**
 * Schema for a POI location from TomTom API
 * Used for each item in the plan (e.g., restaurant, attraction)
 */
const poiLocationSchema: Schema = new Schema(
  {
    ...tomtomLocationBaseSchema,
    phone: { type: String },
    categories: [{ type: String }],
    classifications: [
      {
        code: { type: String },
        names: [{ nameLocale: String, name: String }],
      },
    ],
  },
  { _id: false },
);

/**
 * Simple interface for basic location data (from frontend)
 */
export interface ISimpleLocation {
  placeId?: string;
  name: string;
  address: string;
  coordinates?: { lat: number; lng: number };
}

/**
 * Base interface for TomTom location data (shared fields)
 */
export interface ITomTomLocationBase {
  placeId?: string;
  name: string;
  address: string;
  coordinates?: { lat: number; lng: number };
  entityType?: string;
  countryCode?: string;
  country?: string;
  countryCodeISO3?: string;
  boundingBox?: {
    topLeftPoint: { lat: number; lon: number };
    btmRightPoint: { lat: number; lon: number };
  };
  viewport?: {
    topLeftPoint: { lat: number; lon: number };
    btmRightPoint: { lat: number; lon: number };
  };
  dataSources?: any;
}

/**
 * Interface for a POI location from TomTom API (extends ITomTomLocationBase)
 */
export interface IPOILocation extends ITomTomLocationBase {
  phone?: string;
  categories?: string[];
  classifications?: {
    code: string;
    names: { nameLocale: string; name: string }[];
  }[];
}

/**
 * Schema for an item in the daily schedule
 */
const planItemSchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: [
        'activity',
        'food',
        'accommodation',
        'transportation',
        'shopping',
        'other',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startTime: { type: Date },
    endTime: { type: Date },
    cost: { type: String, default: '' },
    notes: { type: String, trim: true },
    location: poiLocationSchema,
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
 * Interface for an item in the daily schedule
 */
export interface IPlanItem {
  _id: Types.ObjectId;
  type:
    | 'activity'
    | 'food'
    | 'accommodation'
    | 'transportation'
    | 'shopping'
    | 'other';
  title: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  location?: IPOILocation;
  cost?: string;
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
 * - destination: ITomTomLocationBase (Complete TomTom location data)
 */
export interface ITravelPlan extends Document {
  title: string;
  destination: ITomTomLocationBase;
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
  createdAt?: Date;
  updatedAt?: Date;
}

const travelPlanSchema: Schema<ITravelPlan> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    destination: {
      type: destinationSchema,
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

const TravelPlan: Model<ITravelPlan> = model<ITravelPlan>(
  'TravelPlan',
  travelPlanSchema,
);
export default TravelPlan;
