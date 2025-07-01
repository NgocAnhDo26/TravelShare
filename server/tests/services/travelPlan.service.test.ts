import request from 'supertest';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/app'; // Adjust path to your Express app
import User from '../../src/models/user.model';
import { TravelPlan, ITravelPlan } from '../../src/models/travelPlan.model';

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

// --- API Test Suite for Updating Travel Plans ---
describe('PUT /api/plans/:id', () => {
  let testUser: any;
  let testPlan: ITravelPlan;
  let authCookies: any;

  const userId = new Types.ObjectId('684eab1ae29c4f3e0bd6e94c');
  const userCredentials = {
    email: 'user@example.com',
    password: 'Welcome@01',
  };

  /**
   * @description Runs before EACH test in this suite.
   * 1. Creates the specific test user.
   * 2. Creates a travel plan authored by that user.
   * 3. Logs in as the user to get authentication cookies.
   */
  beforeEach(async () => {
    // 1. Create the user
    testUser = await User.create({
      _id: userId,
      email: userCredentials.email,
      username: 'user',
      // The hash for "Welcome@01"
      passwordHash: '$2b$10$3s.gX.CMbV2L4aR.L5e.9eW1fGtnzmcjfl8mCa5E4tDNj2kTM1zGC',
    });

    // 2. Create a travel plan authored by this user
    testPlan = await TravelPlan.create({
      author: testUser._id,
      title: 'My Trip to Nha Trang',
      destination: {
        placeId: 'ChIJ5R24SHh2cDERWp2w4YxI2gU',
        name: 'Nha Trang',
        address: 'Nha Trang, Khánh Hòa, Vietnam',
      },
      startDate: new Date('2025-12-20T00:00:00.000Z'),
      endDate: new Date('2025-12-25T00:00:00.000Z'),
      privacy: 'public',
    });

    // 3. Log in to get the authentication cookies
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send(userCredentials);
    authCookies = loginResponse.headers['set-cookie'];
  });

  /**
   * @description Runs after EACH test. Clears all data.
   */
  afterEach(async () => {
    await User.deleteMany({});
    await TravelPlan.deleteMany({});
  });

  // --- Main Test Logic ---

  it('should allow the author to update the plan title and dates', async () => {
    const payload = {
      title: 'My Awesome Updated Trip',
      startDate: '01/01/26', // dd/mm/yy format
    };

    const res = await request(app)
      .put(`/api/plans/${testPlan._id}`)
      .set('Cookie', authCookies)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('My Awesome Updated Trip');
    expect(res.body.data.startDate).toBe('2026-01-01T00:00:00.000Z');

    // Verify the change in the database
    const updatedPlan = await TravelPlan.findById(testPlan._id);
    expect(updatedPlan?.title).toBe('My Awesome Updated Trip');
  });

  it('should automatically adjust endDate when startDate is moved after it', async () => {
    const payload = {
      startDate: '30/12/25', // This is after the original endDate of 25/12/25
    };

    const res = await request(app)
      .put(`/api/plans/${testPlan._id}`)
      .set('Cookie', authCookies)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.data.startDate).toBe('2025-12-30T00:00:00.000Z');
    expect(res.body.data.endDate).toBe('2025-12-30T00:00:00.000Z'); // Check for adjustment
  });

  it('should return 403 Forbidden if a non-author tries to update the plan', async () => {
    // Create and log in as another user
    await User.create({
      email: 'otheruser@example.com',
      username: 'otheruser',
      passwordHash: 'a_different_hash',
    });
    const otherUserLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'otheruser@example.com', password: 'some_password' });
    const otherUserCookies = otherUserLogin.headers['set-cookie'];

    const payload = { title: 'Malicious Update' };

    const res = await request(app)
      .put(`/api/plans/${testPlan._id}`)
      .set('Cookie', otherUserCookies) // Use the wrong user's cookies
      .send(payload);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('You are not authorized to edit this travel plan.');
  });

  it('should return 401 Unauthorized if no authentication cookie is provided', async () => {
    const payload = { title: 'Update without login' };

    const res = await request(app)
      .put(`/api/plans/${testPlan._id}`)
      // No .set('Cookie', ...)
      .send(payload);

    expect(res.status).toBe(401);
  });

  it('should return 404 Not Found for a non-existent plan ID', async () => {
    const nonExistentId = new Types.ObjectId();
    const payload = { title: 'Update for a ghost plan' };

    const res = await request(app)
      .put(`/api/plans/${nonExistentId}`)
      .set('Cookie', authCookies)
      .send(payload);

    expect(res.status).toBe(404);
  });

  it('should return 400 Bad Request if the payload is empty', async () => {
    const payload = {}; // Empty object

    const res = await request(app)
      .put(`/api/plans/${testPlan._id}`)
      .set('Cookie', authCookies)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('The request body must contain at least one field to update');
  });
});