import express, { Request, Response } from 'express';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import { configDotenv } from 'dotenv';
import User from '../models/user.model';
import { createToken } from '../services/auth.service';

configDotenv();
interface IAuthJwtMiddleware {
  verifyToken(req: Request, res: Response, next: express.NextFunction): void;
}

const AuthJwtMiddleware: IAuthJwtMiddleware = {
  verifyToken: (req: Request, res: Response, next: express.NextFunction) => {
    const accessToken = req.cookies['accessToken'];
    const refreshToken = req.cookies['refreshToken'];
    const secret: Secret = process.env.JWT_SECRET || '';
    const refreshSecret: Secret = process.env.JWT_REFRESH_SECRET || '';
    if (!accessToken && !refreshToken) {
      return res.status(401).json({ error: 'No token provided.' });
    }
    else if (accessToken) {
      const verify = jwt.verify(accessToken, secret)
      if (verify) {
        const decoded = verify as JwtPayload;
        req.user = decoded.userId;
        next();
      } else if (refreshToken) {
        const refreshVerify = jwt.verify(refreshToken, refreshSecret);
        if (refreshVerify) {
          const decoded = refreshVerify as JwtPayload;
          User.findById(decoded.userId)
            .then(user => {
              if (!user) {
                return res.status(401).json({ error: 'User not found.' });
              }
              const newAccessToken = createToken(user._id.toString(), secret);
              res.cookie('accessToken', newAccessToken, { httpOnly: true });
              req.user = user._id.toString();
              next();
            })
            .catch(err => {
              console.error(err);
              return res.status(500).json({ error: 'Internal server error.' });
            });
        } else {
          return res.status(401).json({ error: 'Invalid refresh token.' });
        }
      }
    }
  },
};
