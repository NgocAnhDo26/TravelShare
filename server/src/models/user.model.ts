import { Schema, model, Model } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  registrationDate: Date;
  lastLoginDate?: Date;
}

const userSchema: Schema<IUser> = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false }, // select: false to not return by default
    displayName: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
    bio: { type: String, trim: true },
    lastLoginDate: { type: Date },
  },
  {
    timestamps: { createdAt: 'registrationDate', updatedAt: true }, // Map createdAt to registrationDate
  },
);

const User: Model<IUser> = model<IUser>('user', userSchema);
export default User;
