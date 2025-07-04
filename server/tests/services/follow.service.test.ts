import request from 'supertest';
import mongoose, { Document } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/app';
import User from '../../src/models/user.model';
import Follow from '../../src/models/follow.model';

let mongoServer: MongoMemoryServer;

// --- Mock Supabase ---
jest.mock('../../src/config/supabase.config', () => ({
  __esModule: true,
  default: {
    storage: {
      from: jest.fn().mockReturnThis(),
      upload: jest
        .fn()
        .mockResolvedValue({ data: { path: 'public/mock-path' }, error: null }),
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: 'https://mock-supabase.com/public/mock-path' },
      }),
    },
  },
}));

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
  let authCookies: any;

  /**
   * @description Runs before EACH test in this suite.
   * 1. Creates two users, 'userA' and 'userB'.
   * 2. Logs in as 'userA' to capture the authentication cookies.
   */
  beforeEach(async () => {
    // 1. Create users directly in the database
    [userA, userB] = await User.create([
      {
        email: 'userA@example.com',
        username: 'userA',
        passwordHash:
          '$2a$12$WlOPZ0WTZJxh79cTLbm5V.icQGb0WLpYJWv7jU3LQCOwacdwEKOCG', // "PasswordA@123"
      },
      {
        email: 'userB@example.com',
        username: 'userB',
        passwordHash:
          '$2a$12$KdZ1q8RwN8RZeUCludC/Yu2BWXLfpw14IujZtCR6fVV7VZxO6Qj1e', // "PasswordB@123"
      },
    ]);

    // 2. Log in as userA and capture the cookies from the response headers.
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'userA@example.com', password: 'PasswordA@123' });

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
    // 1. Follow Action
    const followRes = await request(app)
      .post(`/api/users/${userB._id}/follow`)
      .set('Cookie', authCookies);

    expect(followRes.status).toBe(201);
    expect(followRes.body.message).toBe('User followed successfully.');

    // 2. State Verification After Follow
    const userA_afterFollow = await User.findById(userA._id);
    const userB_afterFollow = await User.findById(userB._id);
    expect(userA_afterFollow?.followingCount).toBe(1);
    expect(userB_afterFollow?.followerCount).toBe(1);
    const followDoc = await Follow.findOne({
      follower: userA._id,
      following: userB._id,
    });
    expect(followDoc).not.toBeNull();

    // 3. Unfollow Action
    const unfollowRes = await request(app)
      .delete(`/api/users/${userB._id}/unfollow`)
      .set('Cookie', authCookies);

    expect(unfollowRes.status).toBe(200);
    expect(unfollowRes.body.message).toBe('User unfollowed successfully.');

    // 4. State Verification After Unfollow
    const userA_afterUnfollow = await User.findById(userA._id);
    const userB_afterUnfollow = await User.findById(userB._id);
    expect(userA_afterUnfollow?.followingCount).toBe(0);
    expect(userB_afterUnfollow?.followerCount).toBe(0);
    const noFollowDoc = await Follow.findOne({
      follower: userA._id,
      following: userB._id,
    });
    expect(noFollowDoc).toBeNull();
  });

  it('should return 409 Conflict when trying to follow a user who is already being followed', async () => {
    // First, follow the user
    await request(app)
      .post(`/api/users/${userB._id}/follow`)
      .set('Cookie', authCookies);

    // Then, try to follow again
    const secondFollowRes = await request(app)
      .post(`/api/users/${userB._id}/follow`)
      .set('Cookie', authCookies);

    expect(secondFollowRes.status).toBe(409);
    expect(secondFollowRes.body.message).toBe(
      'You are already following this user.',
    );
  });

  it('should return 400 Bad Request when a user tries to follow themselves', async () => {
    const res = await request(app)
      .post(`/api/users/${userA._id}/follow`)
      .set('Cookie', authCookies);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('You cannot follow yourself.');
  });

  it('should return 404 Not Found when trying to unfollow a user who is not being followed', async () => {
    const res = await request(app)
      .delete(`/api/users/${userB._id}/unfollow`)
      .set('Cookie', authCookies);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('You are not following this user.');
  });

  it('should return 404 when trying to follow a non-existent user', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/users/${nonExistentId}/follow`)
      .set('Cookie', authCookies);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('One or both users do not exist.');
  });
});