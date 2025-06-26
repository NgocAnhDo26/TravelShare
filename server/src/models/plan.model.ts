import mongoose, { Document, Schema, Types } from 'mongoose';


export enum PrivacyStatus {
  PUBLIC = 'Public',
  PRIVATE = 'Private',
}

export interface IPlan extends Document {
  creator: Types.ObjectId;
  title: string;
  description?: string;
  destination?: string;
  startDate?: Date;
  endDate?: Date;
  coverImageUrl?: string;
  privacyStatus: PrivacyStatus;
  creationDate: Date;
  lastModifiedDate: Date;

}

const PlanSchema: Schema = new Schema({
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Plan title is required.'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  destination: {
    type: String,
    trim: true,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  coverImageUrl: {
    type: String,
  },
  privacyStatus: {
    type: String,
    enum: Object.values(PrivacyStatus),
    default: PrivacyStatus.PUBLIC,
  },
  creationDate: {
    type: Date,
    default: Date.now,
  },
  lastModifiedDate: {
    type: Date,
    default: Date.now,
  },
});

const Plan = mongoose.model<IPlan>('Plan', PlanSchema);

export default Plan;