import { Schema, model, Model, Document } from 'mongoose';

/**
 * User document interface representing a registered user in the system
 */
export interface IUser extends Document {
  /** Unique username for URLs */
  username: string;
  /** Login email, must be unique and indexed for fast search */
  email: string;
  /** Encrypted password (using bcrypt) */
  passwordHash: string;
  /** Display name of the user, can be duplicate */
  displayName?: string;
  /** URL to avatar image, stored on service like Supabase Storage */
  avatarUrl?: string;
  /** Short bio about the user */
  bio?: string;
  /** User registration date */
  registrationDate: Date;
  /** Last login date */
  lastLoginDate?: Date;
  /** Number of followers */
  followerCount: number;
  /** Number of users this user is following */
  followingCount: number;
}

/**
 * User schema for storing user account information
 */
const userSchema: Schema<IUser> = new Schema(
  {
    /** Unique username for URLs */
    username: {
      type: String,
      required: [true, 'Username is required.'],
      unique: true,
      trim: true,
      index: true,
    },
    /** Login email, must be unique and indexed for fast search */
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    /** Encrypted password (using bcrypt), excluded from default find() queries */
    passwordHash: {
      type: String,
      required: false,
      select: false,
    },
    /** Display name of the user, can be duplicate */
    displayName: {
      type: String,
      trim: true,
    },
    /** URL to avatar image, stored on service like Supabase Storage */
    avatarUrl: {
      type: String,
      default: 'https://placehold.co/100x100/EFEFEF/333333?text=User',
    },
    /** Short bio about the user */
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    /** Last login date */
    lastLoginDate: { type: Date },
    /** Number of followers */
    followerCount: {
      type: Number,
      default: 0,
    },
    /** Number of users this user is following */
    followingCount: {
      type: Number,
      default: 0,
    },
  },
  {
    /** Automatically add createdAt (mapped to registrationDate) and updatedAt fields */
    timestamps: { createdAt: 'registrationDate', updatedAt: true },
    collection: 'users',
  },
);

const User: Model<IUser> = model<IUser>('User', userSchema);
export default User;
