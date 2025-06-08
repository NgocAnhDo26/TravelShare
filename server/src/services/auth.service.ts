import { Request, Response } from 'express';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import uploadUseCases from '../middlewares/upload';
import User from '../models/user.model';
const saltRounds = 15;
dotenv.config();

interface IAuthenticationService {
  register(req: Request, res: Response): Promise<void>;
  login(req: Request, res: Response): Promise<void>;
  verifyToken(req: Request, res: Response): Promise<void>;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  fileUrl?: string; // Optional URL for the uploaded file
  profilePhoto?: Express.Multer.File;
}

function createToken(userId: string, type: string): string {
  let token: string;
  if (type === 'access') {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    token = jwt.sign({ userId }, secret, {
      expiresIn: '3h',
    });
  } else if (type === 'refresh') {
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
    }
    token = jwt.sign({ userId }, refreshSecret, {
      expiresIn: '30d',
    });
  } else {
    throw new Error('Invalid token type');
  }
  return token;
}

const AuthService: IAuthenticationService = {
  register: async (
    req: Request<object, object, RegisterData>,
    res: Response,
  ) => {
    // Add validation for req.body
    if (!req.body) {
      res.status(400).json({ error: 'Request body is missing.' });
      return;
    }

    const { email, username, password, fileUrl}: RegisterData = req.body;
    const avatar = req.file;

    // Validate required fields
    if (!email || !username || !password) {
      res.status(400).json({ error: 'Email, username, and password are required.' });
      return;
    }

    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: email.trim().toLowerCase() },
          { username: username.trim().toLowerCase() }
        ]
      });

      if (existingUser) {
        if (existingUser.email === email.trim().toLowerCase()) {
          res.status(409).json({ error: 'Email already exists.' });
        } else {
          res.status(409).json({ error: 'Username already exists.' });
        }
        return;
      }

      const passwordHash = await bcrypt.hash(password, saltRounds);
      const newUser = new User({
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        passwordHash,
        avatarUrl: fileUrl || (avatar ? avatar.path : undefined),
        registrationDate: new Date(),
      });
      
      await newUser.save();
      
      const accessToken = createToken(newUser._id.toString(), 'access');
      const refreshToken = createToken(newUser._id.toString(), 'refresh');
      
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: 'strict' as const
      });
      
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3 * 60 * 60 * 1000, // 3 hours
        sameSite: 'strict' as const
      });
      
      res.status(201).json({ 
        message: 'User registered successfully.',
        userId: newUser._id,
        username: newUser.username
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      res.status(500).json({ error: 'Internal server error.' });
    }
  },

  login: async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    try {
      const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const accessToken = createToken(user._id.toString(), 'access');
      const refreshToken = createToken(user._id.toString(), 'refresh');

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: 'strict'
      });
      
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3 * 60 * 60 * 1000, // 3 hours
        sameSite: 'strict'
      });

      res.status(200).json({ 
        message: 'Login successful.',
        userId: user._id,
        username: user.username
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  },

  verifyToken: async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'No token provided.' });
      return;
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as Secret,
      ) as JwtPayload;
      const userId = decoded.userId;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(401).json({ error: 'Invalid token.' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      res.status(200).json({ userId: user._id, username: user.username });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ error: 'Invalid or expired token.' });
    }
  },
};

export default AuthService;
