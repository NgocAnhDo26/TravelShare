/**
 * @fileoverview Integration tests for Authentication and Follow features.
 * @description This file uses mongodb-memory-server to create an isolated, in-memory
 * database for each test run, ensuring tests are independent and reliable.
 */

import request from 'supertest';
import mongoose, { Document } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/app';
import User from '../../src/models/user.model';
import Follow from '../../src/models/follow.model'; 

let mongoServer: MongoMemoryServer;

// --- Database Setup and Teardown ---

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// --- Follow Test Suite ---

describe('Follow API Endpoints', () => {
  let userA: Document, userB: Document;
  // This will now store the cookie string from the login response.
  // FIX: Changed type from string[] to 'any' to handle cases where the header is a single string.
  let authCookies: any;

  /**
   * @description Runs before EACH test in this suite.
   * 1. Creates two users, 'userA' and 'userB'.
   * 2. Logs in as 'userA' to capture the authentication cookies.
   */
  beforeEach(async () => {
    // 1. Create users directly in the database
    [userA, userB] = await User.create([
      { email: 'userA@example.com', username: 'userA', passwordHash: '$2a$12$WlOPZ0WTZJxh79cTLbm5V.icQGb0WLpYJWv7jU3LQCOwacdwEKOCG' },
      { email: 'userB@example.com', username: 'userB', passwordHash: '$2a$12$KdZ1q8RwN8RZeUCludC/Yu2BWXLfpw14IujZtCR6fVV7VZxO6Qj1e' }
    ]);

    // 2. Log in as userA and capture the cookies from the response headers.
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'userA@example.com', password: 'PasswordA@123' });
    
    // The 'set-cookie' header contains the authentication cookies we need.
    authCookies = loginResponse.headers['set-cookie'];
  });

  /**
   * @description Runs after EACH test in this suite.
   * Clears all users and follow relationships from the database.
   */
  afterEach(async () => {
    await User.deleteMany({});
    await Follow.deleteMany({});
  });

  // --- Main Test Logic ---

  it('should allow userA to follow userB, then unfollow them, updating counts correctly', async () => {
    // === 1. Initial State Verification ===
    const initialFollowersRes = await request(app).get(`/api/user/${userB._id}/followers/count`);
    expect(initialFollowersRes.body.followerCount).toBe(0);

    const initialFollowingRes = await request(app).get(`/api/user/${userA._id}/following/count`);
    expect(initialFollowingRes.body.followingCount).toBe(0);

    // === 2. Follow Action ===
    const followRes = await request(app)
      .post(`/api/user/${userB._id}/follow`)
      .set('Cookie', authCookies); 
    
    expect(followRes.status).toBe(201);
    expect(followRes.body.message).toBe('User followed successfully.');

    // === 3. State Verification After Follow ===
    const afterFollowFollowersRes = await request(app).get(`/api/user/${userB._id}/followers/count`);
    expect(afterFollowFollowersRes.body.followerCount).toBe(1);

    const afterFollowFollowingRes = await request(app).get(`/api/user/${userA._id}/following/count`);
    expect(afterFollowFollowingRes.body.followingCount).toBe(1);

    // === 4. Unfollow Action ===
    const unfollowRes = await request(app)
      .delete(`/api/user/${userB._id}/follow`)
      .set('Cookie', authCookies); 
    
    expect(unfollowRes.status).toBe(200);
    expect(unfollowRes.body.message).toBe('User unfollowed successfully.');
    
    // === 5. Final State Verification ===
    const finalFollowersRes = await request(app).get(`/api/user/${userB._id}/followers/count`);
    expect(finalFollowersRes.body.followerCount).toBe(0);
    
    const finalFollowingRes = await request(app).get(`/api/user/${userA._id}/following/count`);
    expect(finalFollowingRes.body.followingCount).toBe(0);
  });

  it('should return 409 Conflict when trying to follow a user who is already being followed', async () => {
    // First, follow the user
    await request(app)
      .post(`/api/user/${userB._id}/follow`)
      .set('Cookie', authCookies); // <-- CORRECT: Send the cookie
    
    // Then, try to follow again
    const secondFollowRes = await request(app)
      .post(`/api/user/${userB._id}/follow`)
      .set('Cookie', authCookies); // <-- CORRECT: Send the cookie
    
    expect(secondFollowRes.status).toBe(409);
    expect(secondFollowRes.body.message).toBe('You are already following this user.');
  });

  it('should return 400 Bad Request when a user tries to follow themselves', async () => {
    const res = await request(app)
      .post(`/api/user/${userA._id}/follow`)
      .set('Cookie', authCookies); // <-- CORRECT: Send the cookie

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('You cannot follow yourself.');
  });

  it('should return 404 Not Found when trying to unfollow a user who is not being followed', async () => {
    const res = await request(app)
      .delete(`/api/user/${userB._id}/follow`)
      .set('Cookie', authCookies); // <-- CORRECT: Send the cookie
    
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('You are not following this user.');
  });
});
