import { Request, Response } from 'express';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../models/user.model';
import Token from '../models/token.model';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import fs from 'fs';
import axios from 'axios';
import path from 'path';

const saltRounds = 10;
dotenv.config();
const emailTransporter: nodemailer.Transporter | null = null; // singleton
interface IAuthenticationService {
  register(req: Request, res: Response): Promise<void>;
  login(req: Request, res: Response): Promise<void>;
  googleLogin(req: Request, res: Response): Promise<void>;
  googleRegister(req: Request, res: Response): Promise<void>;
  forgotPassword(req: Request, res: Response): Promise<void>;
  resetPassword(req: Request, res: Response): Promise<void>;
  verifyToken(req: Request, res: Response): Promise<void>;
  logout(req: Request, res: Response): Promise<void>;
}

interface forgotPasswordData {
  email: string;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  fileUrl?: string; // Optional URL for the uploaded file
  profilePhoto?: Express.Multer.File;
}

interface EmailJob {
  to: string;
  subject: string;
  text: string;
  html?: string; // Optional HTML content
  retries?: number; // Number of retries if sending fails
}

interface resetPasswordData {
  token: string;
  newPassword: string;
}

export async function createMailingService() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

const emailQueue: EmailJob[] = [];

export function addEmailToQueue(emailJob: EmailJob) {
  emailQueue.push(emailJob);
  processEmailQueue();
}

async function processEmailQueue() {
  if (emailQueue.length === 0 || !emailTransporter) return;
  const emailJob = emailQueue.shift();
  if (!emailJob) return;
}

export function createToken(userId: string, type: string): string {
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
      throw new Error(
        'JWT_REFRESH_SECRET is not defined in environment variables',
      );
    }
    token = jwt.sign({ userId }, refreshSecret, {
      expiresIn: '30d',
    });
  } else if (type === 'password-reset') {
    const passwordResetSecret = process.env.JWT_PASSWORD_RESET_SECRET;
    if (!passwordResetSecret) {
      throw new Error(
        'JWT_PASSWORD_RESET_SECRET is not defined in environment variables',
      );
    }
    token = jwt.sign({ userId }, passwordResetSecret, {
      expiresIn: '15m',
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

    const { email, username, password, fileUrl }: RegisterData = req.body;
    const avatar = req.file;

    // Validate required fields
    if (!email || !username || !password) {
      res
        .status(400)
        .json({ error: 'Email, username, and password are required.' });
      return;
    }

    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: email.trim().toLowerCase() },
          { username: username.trim().toLowerCase() },
        ],
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
        displayName: username.trim(),
        username: username.trim().toLowerCase(),
        passwordHash,
        avatarUrl: fileUrl || (avatar ? avatar.path : undefined),
        registrationDate: new Date(),
      });

      await newUser.save();

      res.status(201).json({
        message: 'User registered successfully.',
        userId: newUser._id,
        username: newUser.username,
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
      // +passwordHash to override the default select behavior of mongoose and include the passwordHash field in the query result
      // This is necessary to compare the password with the hashed password stored in the database
      const user = await User.findOne({
        email: email.trim().toLowerCase(),
      }).select('+passwordHash');
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const accessToken = createToken(user._id as string, 'access');
      const refreshToken = createToken(user._id as string, 'refresh');

      const isLocalDev =
        process.env.NODE_ENV === 'development' &&
        !process.env.CORS_ORIGIN?.includes('https');

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: !isLocalDev,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: isLocalDev ? 'lax' : 'none',
      });

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: !isLocalDev,
        maxAge: 3 * 60 * 60 * 1000, // 3 hours
        sameSite: isLocalDev ? 'lax' : 'none',
      });

      res.status(200).json({
        message: 'Login successful.',
        userId: user._id,
        username: user.username,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  },

  googleLogin: async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Google Access Token is required.' });
      return;
    }

    try {
      const googleResponse = await axios.get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${token}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const { email } = googleResponse.data;
      if (!email) {
        res
          .status(401)
          .json({ error: 'Invalid Google token or email not found.' });
        return;
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        res
          .status(404)
          .json({ error: 'User not found. Please register first.' });
        return;
      }

      const accessToken = createToken(user._id as string, 'access');
      const refreshToken = createToken(user._id as string, 'refresh');
      const isLocalDev =
        process.env.NODE_ENV === 'development' &&
        !process.env.CORS_ORIGIN?.includes('https');

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: !isLocalDev,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: isLocalDev ? 'lax' : 'none',
      });
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: !isLocalDev,
        maxAge: 3 * 60 * 60 * 1000,
        sameSite: isLocalDev ? 'lax' : 'none',
      });

      res.status(200).json({
        message: 'Google login successful.',
        userId: user._id,
        username: user.username,
        avatarUrl: user.avatarUrl,
      });
    } catch (error) {
      console.error('Google login error:', error);
      res
        .status(500)
        .json({ error: 'Internal server error or invalid token.' });
    }
  },

  googleRegister: async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Google Access Token is required.' });
      return;
    }

    try {
      const googleResponse = await axios.get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${token}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const { email, name, picture } = googleResponse.data;
      if (!email) {
        res
          .status(401)
          .json({ error: 'Invalid Google token or email not found.' });
        return;
      }

      const lowerCaseEmail = email.toLowerCase();
      let user = await User.findOne({ email: lowerCaseEmail });
      if (user) {
        res.status(409).json({ error: 'User already exists. Please login.' });
        return;
      }

      user = new User({
        email: lowerCaseEmail,
        displayName: name || lowerCaseEmail.split('@')[0],
        username: lowerCaseEmail,
        avatarUrl: picture,
        registrationDate: new Date(),
      });
      await user.save();

      const accessToken = createToken(user._id as string, 'access');
      const refreshToken = createToken(user._id as string, 'refresh');
      const isLocalDev =
        process.env.NODE_ENV === 'development' &&
        !process.env.CORS_ORIGIN?.includes('https');

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: !isLocalDev,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: isLocalDev ? 'lax' : 'none',
      });
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: !isLocalDev,
        maxAge: 3 * 60 * 60 * 1000,
        sameSite: isLocalDev ? 'lax' : 'none',
      });

      res.status(201).json({
        message: 'Google registration successful.',
        userId: user._id,
        username: user.username,
        avatarUrl: user.avatarUrl,
      });
    } catch (error) {
      console.error('Google register error:', error);
      res
        .status(500)
        .json({ error: 'Internal server error or invalid token.' });
    }
  },

  verifyToken: async (req: Request, res: Response) => {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;
    try {
      if (!accessToken && !refreshToken) {
        res.status(401).json({ error: 'No token provided.' });
        return;
      }
      let decoded: JwtPayload | string;
      if (accessToken) {
        decoded = jwt.verify(accessToken, process.env.JWT_SECRET as Secret);
        const userId = (decoded as JwtPayload).userId;

        const user = await User.findById(userId);
        if (!user) {
          res.status(401).json({ valid: false, error: 'User not found.' });
          return;
        }
        res.status(200).json({
          valid: true,
          userId: userId,
          username: user.username,
          avatarUrl: user.avatarUrl,
        });
        return;
      }
      if (refreshToken) {
        decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET as Secret,
        );
        const userId = (decoded as JwtPayload).userId;
        const user = await User.findById(userId);
        if (!user) {
          res.status(401).json({ valid: false, error: 'User not found.' });
          return;
        }
        const newAccessToken = createToken(userId, 'access');
        const isLocalDev =
          process.env.NODE_ENV === 'development' &&
          !process.env.CORS_ORIGIN?.includes('https');

        res.cookie('accessToken', newAccessToken, {
          httpOnly: true,
          secure: !isLocalDev,
          maxAge: 3 * 60 * 60 * 1000, // 3 hours
          sameSite: isLocalDev ? 'lax' : 'none',
        });
        res.status(200).json({
          valid: true,
          userId: userId,
          username: user.username,
          avatarUrl: user.avatarUrl,
        });
        return;
      }
      res.status(401).json({ valid: false, error: 'Invalid token.' });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ valid: false, error: 'Invalid token.' });
    }
  },
  forgotPassword: async (req: Request, res: Response) => {
    const { email }: forgotPasswordData = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }
    try {
      const user = await User.findOne({ email: email.trim().toLowerCase() });
      if (!user) {
        // To prevent user enumeration, we send a success response even if the user doesn't exist.
        console.log(`Password reset requested for non-existent user: ${email}`);
        res.status(200).json({
          message:
            'If an account with that email exists, a password reset link has been sent.',
        });
        return;
      }

      const OTP_token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

      // Upsert the token: update if exists, insert if not.
      await Token.findOneAndUpdate(
        { userId: user._id, purpose: 'password-reset' },
        { token: OTP_token, expiresAt, isUsed: false },
        { upsert: true, new: true },
      );

      const resetLink = `${process.env.CORS_ORIGIN}/reset-password?token=${OTP_token}`;
      const templatePath = path.join(
        __dirname,
        '../public/reset-password-mail.html',
      );
      let HTMLcontent = fs.readFileSync(templatePath, 'utf8');
      HTMLcontent = HTMLcontent.replace(/{{resetLink}}/g, resetLink);

      const mailOptions = {
        from: 'Travel Share <noreply@travelshare.com>',
        to: user.email,
        subject: 'No Reply - Travel Share Password Reset',
        html: HTMLcontent,
        importance: 'high',
      };

      try {
        const mailingService = await createMailingService();
        const info = await mailingService.sendMail(mailOptions); // MAYBE: change to fire-and-forget behavior to avoid blocking the system when await sending
        console.log('Email sent successfully:', info.response);

        res.status(200).json({
          message: 'Password reset link sent to your email.',
        });
      } catch (mailError) {
        console.error('Failed to send reset email:', mailError);
        res.status(500).json({ error: 'Failed to send reset email.' });
      }
    } catch (dbError) {
      console.error('Forgot password database error:', dbError);
      res.status(500).json({ error: 'Internal server error.' });
    }
  },
  resetPassword: async (req: Request, res: Response) => {
    const { token, newPassword }: resetPasswordData = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required.' });
      return;
    }

    try {
      const existingToken = await Token.findOne({
        token,
        purpose: 'password-reset',
      });
      if (!existingToken || existingToken.isUsed) {
        res.status(400).json({ error: 'Invalid or expired token.' });
        return;
      }

      const user = await User.findById(existingToken.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      const passwordHash = await bcrypt.hash(newPassword, saltRounds);
      user.passwordHash = passwordHash;
      await user.save();

      existingToken.isUsed = true;
      await existingToken.save();

      res.status(200).json({ message: 'Password reset successfully.' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  },

  // logout only need to delete the refresh token and access token cookies
  logout: async (req: Request, res: Response) => {
    try {
      const isLocalDev =
        process.env.NODE_ENV === 'development' &&
        !process.env.CORS_ORIGIN?.includes('https');

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: !isLocalDev,
        sameSite: isLocalDev ? 'lax' : 'none',
      });
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: !isLocalDev,
        sameSite: isLocalDev ? 'lax' : 'none',
      });
      res.status(200).json({ message: 'Logged out successfully.' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  },
};

export default AuthService;
