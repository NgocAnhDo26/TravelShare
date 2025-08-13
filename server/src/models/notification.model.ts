import { model, Model, Schema, Types } from 'mongoose';

export interface INotification extends Document {
  /** User receiving the notification */
  recipient: Types.ObjectId;
  /** User who triggered the notification */
  actor: Types.ObjectId;
  /** Type of notification */
  type:
    | 'follow'
    | 'like_plan'
    | 'comment_plan'
    | 'like_post'
    | 'comment_post'
    | 'remix_plan'
    | 'reply_comment'
    | 'like_comment'
    | 'mention_in_comment';
  /** Whether the notification has been read */
  read: boolean;
  /** Target content that triggered the notification */
  target?: {
    /** Related travel plan */
    plan?: Types.ObjectId;
    /** Related post */
    post?: Types.ObjectId;
    comment?: Types.ObjectId; // <-- Thêm trường mới
  };
}

/**
 * Notification schema for managing user notifications about platform activities
 */
const notificationSchema: Schema<INotification> = new Schema(
  {
    /** User receiving the notification, indexed for fast queries */
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    /** User who triggered the notification */
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    /** Type of notification */
    type: {
      type: String,
      required: true,
      enum: [
        'follow',
        'like_plan',
        'comment_plan',
        'like_post',
        'comment_post',
        'remix_plan',
        'reply_comment',
        'like_comment',
        'mention_in_comment', // <-- Thêm các type mới
      ],
    },
    /** Whether the notification has been read */
    read: { type: Boolean, default: false },
    /** Target content that triggered the notification */
    target: {
      /** Related travel plan */
      plan: { type: Schema.Types.ObjectId, ref: 'TravelPlan' },
      /** Related post */
      post: { type: Schema.Types.ObjectId, ref: 'posts' },
      comment: { type: Schema.Types.ObjectId, ref: 'Comment' }, // <-- Thêm trường mới
    },
  },
  { timestamps: true },
);

export const Notification: Model<INotification> = model<INotification>(
  'Notification',
  notificationSchema,
);