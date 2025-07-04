import express, { NextFunction, Request, Response } from 'express';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import { configDotenv } from 'dotenv';
import User from '../models/user.model';
import { createToken } from '../services/auth.service';
import TravelPlan from '../models/travelPlan.model';

configDotenv();
interface IAuthJwtMiddleware {
  verifyToken(req: Request, res: Response, next: NextFunction): void;
  isAuthor(req: Request, res: Response, next: NextFunction): void;
  isAuthorOrPublic(req: Request, res: Response, next: NextFunction): void;
}

const AuthJwtMiddleware: IAuthJwtMiddleware = {
  verifyToken: (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.cookies['accessToken'];
    const refreshToken = req.cookies['refreshToken'];
    const secret: Secret = process.env.JWT_SECRET || '';
    const refreshSecret: Secret = process.env.JWT_REFRESH_SECRET || '';
    if (!accessToken && !refreshToken) {
      return res.status(401).json({ error: 'No token provided.' });
    }

    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, secret) as JwtPayload;
        req.user = decoded.userId;
        return next();
      } catch (error) {
        // Access token might be expired, proceed to check refresh token
        if (error instanceof jwt.TokenExpiredError) {
          console.warn('Access token expired, checking refresh token...');
        } else {
          return res.status(401).json({ error: 'Invalid access token.' });
        }
      }
    }

    if (refreshToken) {
      try {
        const decodedRefresh = jwt.verify(
          refreshToken,
          refreshSecret,
        ) as JwtPayload;
        User.findById(decodedRefresh.userId)
          .then((user) => {
            if (!user) {
              return res.status(401).json({ error: 'User not found.' });
            }
            const newAccessToken = createToken(user._id as string, 'access');
            res.cookie('accessToken', newAccessToken, { httpOnly: true });
            req.user = user._id as string;
            next();
          })
          .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error.' });
          });
      } catch (error) {
        return res.status(401).json({ error: 'Invalid refresh token.' });
      }
    } else {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
  },

  isAuthor: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user as string;
      const planId = req.params.id;

      const plan = await TravelPlan.findById(planId);

      if (!plan) {
        return res.status(404).json({ error: 'Travel plan not found.' });
      }

      if (plan.author.toString() !== userId) {
        return res.status(403).json({ error: 'Forbidden: Not the author.' });
      }

      next();
    } catch (error) {
      console.error('Authorization error in isAuthor middleware:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  },

  isAuthorOrPublic: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user as string;
      const planId = req.params.id;

      const plan = await TravelPlan.findById(planId);

      if (!plan) {
        return res.status(404).json({ error: 'Travel plan not found.' });
      }

      if (plan.author.toString() === userId || plan.privacy === 'public') {
        return next();
      }

      return res.status(403).json({ error: 'Forbidden: Not the author or public.' });
    } catch (error) {
      console.error('Authorization error in isAuthorOrPublic middleware:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  },
};

export default AuthJwtMiddleware;
