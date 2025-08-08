import { Notification, INotification } from '../models/notification.model';
import { Types } from 'mongoose';
import redisClient from '../config/redis.config';
import { Server } from 'socket.io';
import { getIO } from '../config/socket.config';
// Ensure referenced models are registered with Mongoose in all environments (including tests)
import '../models/travelPlan.model';
import '../models/post.model';
import '../models/comment.model';

export interface CreateNotificationData {
  recipient: Types.ObjectId | string;
  actor: Types.ObjectId | string;
  type: INotification['type'];
  target?: {
    plan?: Types.ObjectId | string;
    post?: Types.ObjectId | string;
    comment?: Types.ObjectId | string;
  };
}

export class NotificationService {
  /**
   * Register a user's socket connection in Redis
   */
  static async registerSocketUser(userId: string, socketId: string): Promise<void> {
    try {
      await redisClient.set(userId, socketId);
      console.log(`[Redis] User ${userId} registered with socket ${socketId}`);
    } catch (err) {
      console.error('[Redis] Error registering user:', err);
      throw err;
    }
  }

  /**
   * Unregister a user's socket connection from Redis
   */
  static async unregisterSocketUser(socketId: string): Promise<void> {
    try {
      for await (const key of redisClient.scanIterator()) {
        const keyString = String(key);
        if ((await redisClient.get(keyString)) === socketId) {
          await redisClient.del(keyString);
          console.log(`[Redis] Removed user ${keyString} from session store.`);
          break;
        }
      }
    } catch (err) {
      console.error('[Redis] Error during unregister cleanup:', err);
      throw err;
    }
  }

  /**
   * Create a notification and optionally emit real-time event
   */
  static async createNotification(
    data: CreateNotificationData,
    io?: Server
  ): Promise<INotification> {
    const { recipient, actor, type, target } = data;

    // Create and save the notification document
    const newNotification = new Notification({
      recipient,
      actor,
      type,
      target,
      read: false,
    });
    await newNotification.save();

    // Populate actor and relevant targets for richer realtime payload
    const populatedNotification = await Notification.findById(
      newNotification._id
    )
      .populate('actor', 'displayName username avatarUrl')
      .populate({
        path: 'target.plan',
        select: 'title',
        model: 'TravelPlan',
      })
      .populate({
        path: 'target.post',
        select: 'title',
        model: 'posts',
      })
      .populate({
        path: 'target.comment',
        select: 'content',
        model: 'Comment',
      });

    if (!populatedNotification) {
      throw new Error('Failed to create notification');
    }

    console.log("Trying to send socket...");
    // Resolve io instance (prefer provided, else fallback to global)
    let ioInstance: Server | undefined = io;
    if (!ioInstance) {
      try {
        ioInstance = getIO();
      } catch {
        ioInstance = undefined;
      }
    }

    // Emit real-time event if socket server is available
    if (ioInstance) {
      await this.emitNotificationToUser(
        recipient.toString(),
        populatedNotification,
        ioInstance,
      );
    }

    return populatedNotification;
  }

  /**
   * Emit notification to a specific user via socket
   */
  static async emitNotificationToUser(
    userId: string,
    notification: INotification,
    io: Server,
  ): Promise<void> {
    try {
      const targetSocketId = await redisClient.get(userId);
      
      if (targetSocketId) {
        // Build a minimal client-friendly payload including deep-populated fields if available
        const payload: any = {
          _id: (notification as any)._id,
          type: notification.type,
          actor: (notification as any).actor || undefined,
          target: (notification as any).target || undefined,
          read: notification.read,
          createdAt: (notification as any).createdAt,
        };
        // Include convenient url to navigate on click
        if ((notification as any).target?.plan?._id) {
          payload.url = `/plans/${(notification as any).target.plan._id}`;
        } else if ((notification as any).target?.post?._id) {
          payload.url = `/posts/${(notification as any).target.post._id}`;
        } else if (notification.type === 'follow' && (notification as any).actor?._id) {
          payload.url = `/profile/${(notification as any).actor._id}`;
        }

        io.to(targetSocketId).emit('new-notification', payload);
        console.log(`[Notification] Real-time event sent to user ${userId}`);
      } else {
        console.log(`[Notification] User ${userId} not connected. Notification saved to DB.`);
      }
    } catch (error) {
      console.error('[Notification] Error emitting notification:', error);
      // Don't throw here as the notification was already saved
    }
  }

  /**
   * Get all notifications for a user with pagination
   */
  static async getUserNotifications(
    userId: string | Types.ObjectId, 
    page: number = 1, 
    limit: number = 20
  ): Promise<{
    notifications: INotification[];
    totalResults: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    
    const [notifications, totalResults] = await Promise.all([
      Notification.find({ recipient: userId })
        .populate('actor', 'displayName username avatarUrl')
        .populate({
          path: 'target.plan',
          select: 'title',
          model: 'TravelPlan'
        })
        .populate({
          path: 'target.post',
          select: 'title',
          model: 'posts'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ recipient: userId })
    ]);

    const totalPages = Math.ceil(totalResults / limit);

    return {
      notifications,
      totalResults,
      totalPages,
    };
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(
    notificationId: string,
    userId: string | Types.ObjectId
  ): Promise<INotification> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new Error('Invalid notification ID');
    }

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      throw new Error('Notification not found');
    }

    // Security check: Ensure the user owns this notification
    if (notification.recipient.toString() !== userId.toString()) {
      throw new Error('Forbidden: You cannot read this notification');
    }

    notification.read = true;
    await notification.save();

    return notification;
  }

  /**
   * Mark all notifications for a user as read
   */
  static async markAllAsRead(userId: string | Types.ObjectId): Promise<void> {
    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string | Types.ObjectId): Promise<number> {
    return await Notification.countDocuments({ recipient: userId, read: false });
  }

  /**
   * Delete a notification (only by the recipient)
   */
  static async deleteNotification(
    notificationId: string,
    userId: string | Types.ObjectId
  ): Promise<void> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new Error('Invalid notification ID');
    }

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      throw new Error('Notification not found');
    }

    // Security check: Ensure the user owns this notification
    if (notification.recipient.toString() !== userId.toString()) {
      throw new Error('Forbidden: You cannot delete this notification');
    }

    await Notification.findByIdAndDelete(notificationId);
  }
} 