import e, { Request, Response } from 'express';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../models/user.model';
import Token from '../models/token.model';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
const saltRounds = 12;
dotenv.config();

let emailTransporter: nodemailer.Transporter | null = null; // singleton
interface IAuthenticationService {
  register(req: Request, res: Response): Promise<void>;
  login(req: Request, res: Response): Promise<void>;
  forgotPassword(req: Request, res: Response): Promise<void>;
  resetPassword(req: Request, res: Response): Promise<void>;
  verifyToken(req: Request, res: Response): Promise<void>;
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
// Use ethereal first because I cannot find a free SMTP server that allows sending emails without verification
// ethereal is a fake SMTP server that allows you to test sending emails without actually sending them

export async function createMailingService() { // need export for testing purposes
  if (emailTransporter) {
    return emailTransporter;
  }
  try {
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    ) {
      const etherealCredentials = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: etherealCredentials.smtp.host,
        port: etherealCredentials.smtp.port,
        secure: etherealCredentials.smtp.secure,
        auth: {
          user: etherealCredentials.user,
          pass: etherealCredentials.pass,
        },
        // Performance optimizations
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        connectionTimeout: 30000, // 30 seconds
        greetingTimeout: 30000,
        socketTimeout: 60000, // 60 seconds
      });
      emailTransporter = transporter;
      console.log('Using Ethereal SMTP server for testing emails.');
    } else {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        // Performance optimizations
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        connectionTimeout: 30000, // 30 seconds
        greetingTimeout: 30000,
        socketTimeout: 60000, // 60 seconds
      });
      emailTransporter = transporter;
      console.log('Using configured SMTP server for sending emails.');
    }
    await emailTransporter.verify();
    console.log('Mailing service is ready to send emails.');
    return emailTransporter;
  } catch (error) {
    console.error('Error creating mailing service:', error);
    throw new Error('Failed to create mailing service');
  }
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

      const accessToken = createToken(user._id.toString(), 'access');
      const refreshToken = createToken(user._id.toString(), 'refresh');

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: 'strict',
      });

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3 * 60 * 60 * 1000, // 3 hours
        sameSite: 'strict',
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
        res
          .status(200)
          .json({ valid: true, userId: userId, username: user.username, avatarUrl: user.avatarUrl });
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
        res.cookie('accessToken', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 3 * 60 * 60 * 1000, // 3 hours
          sameSite: 'strict',
        });
        res.status(200).json({ valid: true, userId: userId, username: user.username, avatarUrl: user.avatarUrl });
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


};

export default AuthService;
