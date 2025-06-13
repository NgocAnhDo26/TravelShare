import { Schema, model, Model, Document, Types } from 'mongoose';

export interface IToken extends Document {
  userId: Types.ObjectId;
  token: string;
  purpose: string;
  expiresAt: Date;
  isUsed: boolean;
}

const tokenSchema: Schema<IToken> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      index: true
    },
    token: {
      type: String,
      required: true,
      index: true
    },
    purpose: {
      type: String,
      required: true,
      enum: ['password-reset', 'email-verification', 'otp'],
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Create index for token expiration for automatic cleanup
// Apparently, MongoDB will automatically remove documents from this collection when the expiresAt field is reached. Native feature of MongoDB
// AI generated this code so need further review
// TODO: Test this feature
// Uses a TTL Index, as you've seen. You create a special index on a date field and tell MongoDB to delete documents 0 seconds after that date.
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Token: Model<IToken> = model<IToken>('token', tokenSchema);

export default Token;