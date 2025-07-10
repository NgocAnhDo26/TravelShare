import { Schema, model, Model, Document, Types } from 'mongoose';

/**
 * Token document interface for managing authentication tokens
 */
export interface IToken extends Document {
  /** User ID associated with the token */
  userId: Types.ObjectId;
  /** The token string */
  token: string;
  /** Purpose of the token */
  purpose: 'password-reset' | 'email-verification' | 'otp';
  /** When the token expires */
  expiresAt: Date;
  /** Whether the token has been used */
  isUsed: boolean;
}

/**
 * Token schema for managing authentication tokens
 */
const tokenSchema: Schema<IToken> = new Schema(
  {
    /** User ID associated with the token */
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    /** The token string */
    token: {
      type: String,
      required: true,
      index: true,
    },
    /** Purpose of the token */
    purpose: {
      type: String,
      required: true,
      enum: ['password-reset', 'email-verification', 'otp'],
      index: true,
    },
    /** When the token expires */
    expiresAt: {
      type: Date,
      required: true,
    },
    /** Whether the token has been used */
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'tokens',
  },
);

/** Create TTL index for automatic token cleanup */
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Token: Model<IToken> = model<IToken>('Token', tokenSchema);
export default Token;
