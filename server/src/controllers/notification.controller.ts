import { Request, Response, NextFunction } from 'express';
import { Server } from 'socket.io';
import { NotificationService } from '../services/notification.service';

export const registerSocketUser = async (userId: string, socketId: string) => {
  await NotificationService.registerSocketUser(userId, socketId);
};

export const unregisterSocketUser = async (socketId: string) => {
  await NotificationService.unregisterSocketUser(socketId);
};

/**
 * Creates a notification, saves it to the DB, and emits a real-time event.
 * This function is called by other parts of your app (e.g., when a user likes a post).
 */
export const createNotification = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { recipient, actor, type, target } = req.body;

    if (!recipient || !actor || !type) {
      return res
        .status(400)
        .json({ message: 'Recipient, actor, and type are required.' });
    }

    const io = req.io;

    const notification = await NotificationService.createNotification(
      { recipient, actor, type, target },
      io
    );

    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
};

/**
 * Fetches all notifications for the authenticated user.
 */
export const getUserNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user as string;
    const { page = '1', limit = '20' } = req.query;

    // Validate and parse pagination parameters
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page must be a positive number',
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 50',
      });
    }

    const result = await NotificationService.getUserNotifications(userId, pageNum, limitNum);
    res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: {
        currentPage: pageNum,
        totalPages: result.totalPages,
        totalResults: result.totalResults,
        hasNextPage: pageNum < result.totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Marks a specific notification as read.
 */
export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user as string;

    const notification = await NotificationService.markAsRead(notificationId, userId);
    res.status(200).json(notification);
  } catch (error) {
    next(error);
  }
};

/**
 * Marks all notifications for the authenticated user as read.
 */
export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user as string;
    await NotificationService.markAllAsRead(userId);
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets the unread notification count for the authenticated user.
 */
export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user as string;
    const count = await NotificationService.getUnreadCount(userId);
    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a specific notification.
 */
export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user as string;

    await NotificationService.deleteNotification(notificationId, userId);
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    next(error);
  }
};
