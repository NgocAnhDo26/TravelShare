import express, { Request, Response, NextFunction } from 'express';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import { configDotenv } from 'dotenv';
import User from '../models/user.model';
import { createToken } from '../services/auth.service';

configDotenv();

// Export a named function `authenticate` as expected by your router.
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const accessToken = req.cookies['accessToken'];
    const refreshToken = req.cookies['refreshToken'];

    if (!accessToken && !refreshToken) {
      res.status(401).json({ message: 'Authentication failed. No token provided.' });
      return; // FIX: Use return to stop execution
    }

    // --- Step 1: Try to verify the Access Token ---
    if (accessToken) {
      try {
        const secret: Secret = process.env.JWT_SECRET || '';
        const decoded = jwt.verify(accessToken, secret) as JwtPayload;
        req.user = decoded.userId;
        next(); // Token is valid, proceed to the controller
        return; // FIX: Use return to stop execution
      } catch (error) {
        // Access token is invalid/expired, fall through to check refresh token
      }
    }

    // --- Step 2: If Access Token fails, try to use the Refresh Token ---
    if (refreshToken) {
      try {
        const refreshSecret: Secret = process.env.JWT_REFRESH_SECRET || '';
        const decoded = jwt.verify(refreshToken, refreshSecret) as JwtPayload;
        
        const user = await User.findById(decoded.userId);
        if (!user) {
          res.status(401).json({ message: 'Authentication failed. User not found.' });
          return; // FIX: Use return to stop execution
        }

        const newAccessToken = createToken(user._id.toString(), 'access');
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3 * 60 * 60 * 1000,
            sameSite: 'strict',
        });

        req.user = user._id.toString();
        next(); // Proceed to the controller
        return; // FIX: Use return to stop execution

      } catch (error) {
        res.status(401).json({ message: 'Session expired. Please log in again.' });
        return; // FIX: Use return to stop execution
      }
    }

    // Fallback if only an invalid access token was provided and no refresh token
    res.status(401).json({ message: 'Authentication failed. Invalid token.' });
    
  } catch (error) {
    next(error);
  }
};