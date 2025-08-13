import { Router } from 'express';
import {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
} from '../controllers/notification.controller';
import AuthJwtMiddleware from '../middlewares/authJwt';

/**
 * Creates and returns the notification router, injecting the Socket.IO server instance.
 * @param io The Socket.IO server instance.
 * @returns The configured Express router.
 */
export const createNotificationRouter = (): Router => {
  const router = Router();

  // Create a new notification
  router.post(
    '/notifications',
    AuthJwtMiddleware.verifyToken,
    (req, res, next) => createNotification(req, res, next)
  );

  // GET all notifications for the logged-in user
  router.get(
    '/notifications',
    AuthJwtMiddleware.verifyToken,
    getUserNotifications
  );

  // GET unread notification count
  router.get(
    '/notifications/unread-count',
    AuthJwtMiddleware.verifyToken,
    getUnreadCount
  );

  // POST to mark a specific notification as read
  router.post(
    '/notifications/:notificationId/mark-as-read',
    AuthJwtMiddleware.verifyToken,
    markAsRead
  );

  // POST to mark all notifications as read
  router.post(
    '/notifications/mark-all-as-read',
    AuthJwtMiddleware.verifyToken,
    markAllAsRead
  );

  // DELETE a specific notification
  router.delete(
    '/notifications/:notificationId',
    AuthJwtMiddleware.verifyToken,
    deleteNotification
  );

  return router;
};
