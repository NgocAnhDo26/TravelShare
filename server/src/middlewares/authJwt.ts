import express, { Request, Response } from 'express';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import { configDotenv } from 'dotenv';
import User from '../models/user.model';

configDotenv();

interface IAuthJwtMiddleware {
  verifyToken(req: Request, res: Response, next: express.NextFunction): void;
}

const AuthJwtMiddleware: IAuthJwtMiddleware = {
  verifyToken: (req: Request, res: Response, next: express.NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided.' });
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET as Secret,
      async (err, decoded) => {
        if (err) {
          return res
            .status(403)
            .json({ error: 'Failed to authenticate token.' });
        }

        try {
          const userId = (decoded as JwtPayload).id;
          const user = await User.findById(userId).select('-passwordHash');
          if (!user) {
            return res.status(404).json({ error: 'User not found.' });
          }
          next();
        } catch (error) {
          return res.status(500).json({ error: 'Internal server error.' });
        }
      },
    );
  },
};
