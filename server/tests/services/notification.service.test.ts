import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NotificationService } from '../../src/services/notification.service';
import { Notification } from '../../src/models/notification.model';
import User from '../../src/models/user.model';
import { Types } from 'mongoose';

describe('NotificationService', () => {
  let testUser1: any;
  let testUser2: any;

  beforeEach(async () => {
    // Create test users
    testUser1 = await User.create({
      email: 'test1@example.com',
      username: 'testuser1',
      passwordHash: 'hash1',
    });

    testUser2 = await User.create({
      email: 'test2@example.com',
      username: 'testuser2',
      passwordHash: 'hash2',
    });
  });

  afterEach(async () => {
    // Clean up
    await Notification.deleteMany({});
    await User.deleteMany({});
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const notificationData = {
        recipient: testUser1._id,
        actor: testUser2._id,
        type: 'like_plan' as const,
        target: {
          plan: new Types.ObjectId(),
        },
      };

      const notification =
        await NotificationService.createNotification(notificationData);

      expect(notification).toBeDefined();
      expect(notification.recipient.toString()).toBe(testUser1._id.toString());
      // The actor field is populated, so we need to check the _id property
      expect(
        (notification.actor as any)._id?.toString() ||
          notification.actor.toString(),
      ).toBe(testUser2._id.toString());
      expect(notification.type).toBe('like_plan');
      expect(notification.read).toBe(false);
    });

    it('should throw error for invalid notification data', async () => {
      const invalidData = {
        recipient: testUser1._id,
        // Missing actor and type
      };

      await expect(
        NotificationService.createNotification(invalidData as any),
      ).rejects.toThrow();
    });
  });

  describe('getUserNotifications', () => {
    it('should return notifications for a user', async () => {
      // Create test notifications
      await Notification.create([
        {
          recipient: testUser1._id,
          actor: testUser2._id,
          type: 'like_plan',
          read: false,
        },
        {
          recipient: testUser1._id,
          actor: testUser2._id,
          type: 'comment_plan',
          read: true,
        },
      ]);

      const result = await NotificationService.getUserNotifications(
        testUser1._id,
      );

      expect(result.notifications).toHaveLength(2);
      expect(result.totalResults).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(result.notifications[0].recipient.toString()).toBe(
        testUser1._id.toString(),
      );
    });

    it('should return empty array for user with no notifications', async () => {
      const result = await NotificationService.getUserNotifications(
        testUser1._id,
      );
      expect(result.notifications).toHaveLength(0);
      expect(result.totalResults).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      // Create 25 test notifications
      const notifications = Array.from({ length: 25 }, (_, i) => ({
        recipient: testUser1._id,
        actor: testUser2._id,
        type: 'like_plan' as const,
        read: false,
      }));
      await Notification.create(notifications);

      // Test first page with limit 10
      const result1 = await NotificationService.getUserNotifications(
        testUser1._id,
        1,
        10,
      );
      expect(result1.notifications).toHaveLength(10);
      expect(result1.totalResults).toBe(25);
      expect(result1.totalPages).toBe(3);

      // Test second page
      const result2 = await NotificationService.getUserNotifications(
        testUser1._id,
        2,
        10,
      );
      expect(result2.notifications).toHaveLength(10);
      expect(result2.totalResults).toBe(25);
      expect(result2.totalPages).toBe(3);

      // Test third page
      const result3 = await NotificationService.getUserNotifications(
        testUser1._id,
        3,
        10,
      );
      expect(result3.notifications).toHaveLength(5);
      expect(result3.totalResults).toBe(25);
      expect(result3.totalPages).toBe(3);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const notification = await Notification.create({
        recipient: testUser1._id,
        actor: testUser2._id,
        type: 'like_plan',
        read: false,
      });

      const updatedNotification = await NotificationService.markAsRead(
        notification._id.toString(),
        testUser1._id,
      );

      expect(updatedNotification.read).toBe(true);
    });

    it('should throw error for invalid notification ID', async () => {
      await expect(
        NotificationService.markAsRead('invalid-id', testUser1._id),
      ).rejects.toThrow('Invalid notification ID');
    });

    it('should throw error for non-existent notification', async () => {
      await expect(
        NotificationService.markAsRead(
          new Types.ObjectId().toString(),
          testUser1._id,
        ),
      ).rejects.toThrow('Notification not found');
    });

    it('should throw error when user does not own the notification', async () => {
      const notification = await Notification.create({
        recipient: testUser1._id,
        actor: testUser2._id,
        type: 'like_plan',
        read: false,
      });

      await expect(
        NotificationService.markAsRead(
          notification._id.toString(),
          testUser2._id,
        ),
      ).rejects.toThrow('Forbidden: You cannot read this notification');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      // Create test notifications
      await Notification.create([
        {
          recipient: testUser1._id,
          actor: testUser2._id,
          type: 'like_plan',
          read: false,
        },
        {
          recipient: testUser1._id,
          actor: testUser2._id,
          type: 'comment_plan',
          read: false,
        },
      ]);

      await NotificationService.markAllAsRead(testUser1._id);

      const notifications = await Notification.find({
        recipient: testUser1._id,
      });
      expect(notifications.every((n) => n.read)).toBe(true);
    });
  });

  describe('getUnreadCount', () => {
    it('should return correct unread count', async () => {
      // Create test notifications
      await Notification.create([
        {
          recipient: testUser1._id,
          actor: testUser2._id,
          type: 'like_plan',
          read: false,
        },
        {
          recipient: testUser1._id,
          actor: testUser2._id,
          type: 'comment_plan',
          read: true,
        },
        {
          recipient: testUser1._id,
          actor: testUser2._id,
          type: 'follow',
          read: false,
        },
      ]);

      const count = await NotificationService.getUnreadCount(testUser1._id);
      expect(count).toBe(2);
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      const notification = await Notification.create({
        recipient: testUser1._id,
        actor: testUser2._id,
        type: 'like_plan',
        read: false,
      });

      await NotificationService.deleteNotification(
        notification._id.toString(),
        testUser1._id,
      );

      const deletedNotification = await Notification.findById(notification._id);
      expect(deletedNotification).toBeNull();
    });

    it('should throw error when user does not own the notification', async () => {
      const notification = await Notification.create({
        recipient: testUser1._id,
        actor: testUser2._id,
        type: 'like_plan',
        read: false,
      });

      await expect(
        NotificationService.deleteNotification(
          notification._id.toString(),
          testUser2._id,
        ),
      ).rejects.toThrow('Forbidden: You cannot delete this notification');
    });
  });
});
