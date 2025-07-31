import request from 'supertest';
import app from '../../src/app';
import User from '../../src/models/user.model';
import Token from '../../src/models/token.model';
import bcrypt from 'bcrypt';
import * as AuthService from '../../src/services/auth.service';
import jwt from 'jsonwebtoken';
import { describe, it, expect, beforeEach } from 'vitest';
import { suppressConsoleErrorAsync } from '../setup';

describe('Auth Service', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty(
        'message',
        'User registered successfully.',
      );
      expect(res.body).toHaveProperty('userId');
      expect(res.body).toHaveProperty('username', 'testuser');

      const userInDb = await User.findOne({ email: 'test@example.com' });
      expect(userInDb).not.toBeNull();
      expect(userInDb?.username).toBe('testuser');
    });

    it('should register a new user with an avatar', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .field('email', 'test-avatar@example.com')
        .field('username', 'testavataruser')
        .field('password', 'Password123!')
        .attach('avatar', Buffer.from('fake image data'), 'avatar.jpg');

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty(
        'message',
        'User registered successfully.',
      );

      const userInDb = await User.findOne({ email: 'test-avatar@example.com' });
      expect(userInDb).not.toBeNull();
      expect(userInDb?.avatarUrl).toBe(
        'https://mock-supabase.com/public/mock-path',
      );
    });

    it('should return 409 if email already exists', async () => {
      await User.create({
        email: 'test@example.com',
        username: 'anotheruser',
        passwordHash: 'somehash',
      });

      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
      });

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty('error', 'Email already exists.');
    });

    it('should return 409 if username already exists', async () => {
      await User.create({
        email: 'another@example.com',
        username: 'testuser',
        passwordHash: 'somehash',
      });

      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
      });

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty('error', 'Username already exists.');
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        username: 'testuser',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty(
        'error',
        'Email, username, and password are required.',
      );
    });
  });

  describe('POST /api/auth/login', () => {
    let user: any;
    beforeEach(async () => {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: passwordHash,
      });
    });

    it('should login successfully and return cookies', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Login successful.');
      expect(res.body.userId).toBe(user._id.toString());
      expect(res.body.username).toBe(user.username);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('refreshToken');
      expect(res.headers['set-cookie'][1]).toContain('accessToken');
    });

    it('should return 401 for incorrect password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'WrongPassword!',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid email or password.');
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'wrong@example.com',
        password: 'Password123!',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid email or password.');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      await User.create({
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'somehash',
      });
    });

    it('should send a password reset link for an existing user', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty(
        'message',
        'Password reset link sent to your email.',
      );
      const tokenInDb = await Token.findOne({ purpose: 'password-reset' });
      expect(tokenInDb).not.toBeNull();
      // Note: sendMailMock is now imported from setup.ts
    });

    it('should return a success message even for a non-existent user', async () => {
      await suppressConsoleErrorAsync(async () => {
        const res = await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: 'nonexistent@example.com' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty(
          'message',
          'If an account with that email exists, a password reset link has been sent.',
        );
      });
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let user: any;
    let resetToken: string;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: await bcrypt.hash('OldPassword!', 10),
      });

      const tokenDoc = await Token.create({
        userId: user._id,
        token: 'valid-reset-token',
        purpose: 'password-reset',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });
      resetToken = tokenDoc.token;
    });

    it('should reset password successfully with a valid token', async () => {
      const res = await request(app).post('/api/auth/reset-password').send({
        token: resetToken,
        newPassword: 'NewPassword123!',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty(
        'message',
        'Password reset successfully.',
      );

      const updatedUser = await User.findById(user._id).select('+passwordHash');
      const isNewPasswordValid = await bcrypt.compare(
        'NewPassword123!',
        updatedUser!.passwordHash,
      );
      expect(isNewPasswordValid).toBe(true);

      const usedToken = await Token.findOne({ token: resetToken });
      expect(usedToken?.isUsed).toBe(true);
    });

    it('should return 400 for an invalid or used token', async () => {
      const invalidRes = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'AnotherNewPassword!',
        });
      expect(invalidRes.statusCode).toBe(400);
      expect(invalidRes.body).toHaveProperty(
        'error',
        'Invalid or expired token.',
      );

      await request(app).post('/api/auth/reset-password').send({
        token: resetToken,
        newPassword: 'NewPassword123!',
      });

      const usedRes = await request(app).post('/api/auth/reset-password').send({
        token: resetToken,
        newPassword: 'AnotherNewPassword!',
      });
      expect(usedRes.statusCode).toBe(400);
      expect(usedRes.body).toHaveProperty('error', 'Invalid or expired token.');
    });
  });

  describe('POST /api/auth/verify-token', () => {
    let user: any;
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      user = await User.create({
        email: 'verify@example.com',
        username: 'verifyuser',
        passwordHash: 'somehash',
      });
      accessToken = AuthService.createToken(user._id.toString(), 'access');
      refreshToken = AuthService.createToken(user._id.toString(), 'refresh');
    });

    it('should verify a valid access token', async () => {
      const res = await request(app)
        .post('/api/auth/verify-token')
        .set('Cookie', `accessToken=${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        valid: true,
        userId: user._id.toString(),
        username: user.username,
        avatarUrl: user.avatarUrl,
      });
    });

    it('should use refresh token to issue a new access token if only refresh token is provided', async () => {
      const res = await request(app)
        .post('/api/auth/verify-token')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        valid: true,
        userId: user._id.toString(),
        username: user.username,
        avatarUrl: user.avatarUrl,
      });
      expect(res.headers['set-cookie'][0]).toContain('accessToken');
    });

    it('should return 401 if access token is invalid/expired (due to current implementation)', async () => {
      await suppressConsoleErrorAsync(async () => {
        const expiredAccessToken = jwt.sign(
          { userId: user._id.toString() },
          process.env.JWT_SECRET!,
          { expiresIn: '0s' },
        );
        await new Promise((resolve) => setTimeout(resolve, 10));

        const res = await request(app)
          .post('/api/auth/verify-token')
          .set(
            'Cookie',
            `accessToken=${expiredAccessToken}; refreshToken=${refreshToken}`,
          );

        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({ valid: false, error: 'Invalid token.' });
      });
    });

    it('should return 401 if no tokens are provided', async () => {
      const res = await request(app).post('/api/auth/verify-token');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'No token provided.');
    });

    it('should return 401 if only an invalid access token is provided', async () => {
      await suppressConsoleErrorAsync(async () => {
        const res = await request(app)
          .post('/api/auth/verify-token')
          .set('Cookie', `accessToken=invalid`);

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('error', 'Invalid token.');
      });
    });
  });
});
