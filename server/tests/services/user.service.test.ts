import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/app';
import User from '../../src/models/user.model';
import bcrypt from 'bcrypt';

let mongoServer: MongoMemoryServer;
let authenticatedUserId: string;
let authenticatedToken: string;

jest.setTimeout(60000); 

beforeAll(async () => {
    console.log('Starting beforeAll hook: Initializing MongoMemoryServer and connecting Mongoose...');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('Finished beforeAll hook: MongoMemoryServer connected.');
}, 60000);

afterAll(async () => {
    console.log('Starting afterAll hook: Disconnecting Mongoose and stopping MongoMemoryServer...');
    await mongoose.disconnect();
    await mongoServer.stop();
    console.log('Finished afterAll hook.');
}, 30000);

beforeEach(async () => {
    console.log('Starting beforeEach hook: Clearing collections and creating test user directly...');

    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
    console.log('Collections cleared.');

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('Password123!', saltRounds);

    const createdUser = await User.create({
        email: 'testuser@example.com',
        username: 'testuser',
        passwordHash: passwordHash,
        registrationDate: new Date(),
        displayName: 'Test User',
        avatarUrl: 'http://example.com/default_avatar.png',
    });
    authenticatedUserId = createdUser._id.toString();
    authenticatedToken = 'mock_token';

    console.log('User created directly in beforeEach. Ready for test execution.');
});

jest.mock('../../src/middlewares/authJwt', () => ({
    verifyToken: (req: any, res: any, next: any) => {
       
        req.user = authenticatedUserId;
        next();
    },
}));

// --- Test Suites ---

describe('User Service Unit Tests', () => {
    describe('GET /api/users/edit-profile', () => {
        it('should return the profile of the authenticated user', async () => {
            const res = await request(app)
                .get('/api/users/edit-profile') 
                .set('Authorization', `Bearer ${authenticatedToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.email).toBe('testuser@example.com');
            expect(res.body.username).toBe('testuser');
            expect(res.body).toHaveProperty('displayName');
            expect(res.body.displayName).toBe('Test User');
            expect(res.body).toHaveProperty('avatarUrl');
            expect(res.body.avatarUrl).toBe('http://example.com/default_avatar.png'); 
            expect(res.body._id).toBe(authenticatedUserId);
        });

        it('should return 404 if the user is not found (post-deletion scenario)', async () => {
        
            await User.findByIdAndDelete(authenticatedUserId);

            const res = await request(app)
                .get('/api/users/edit-profile') 
                .set('Authorization', `Bearer ${authenticatedToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('error', 'User not found.');
        });

        it('should return 400 if authenticated user ID format is invalid (mocked scenario)', async () => {
            const originalUserId = authenticatedUserId; 
            authenticatedUserId = 'invalid-id-format'; 

            const res = await request(app)
                .get('/api/users/edit-profile') 
                .set('Authorization', `Bearer ${authenticatedToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('error', 'Invalid user ID format.');

            authenticatedUserId = originalUserId; 
        });

        it('should return 500 for internal server errors during profile retrieval', async () => {
            
            jest.spyOn(User, 'findById').mockImplementationOnce(() => {
                throw new Error('Database error');
            });

            const res = await request(app)
                .get('/api/users/edit-profile') 
                .set('Authorization', `Bearer ${authenticatedToken}`);

            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty('error', 'Internal server error.');

            jest.restoreAllMocks(); 
        });
    });

    describe('PUT /api/users/profile', () => { 
        it('should update the authenticated user\'s profile successfully with multiple fields', async () => {
            const updateData = {
                displayName: 'Test User New Display',
                email: 'newemail@example.com',
                fileUrl: 'http://example.com/new_avatar.png',
            };

            const res = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${authenticatedToken}`)
                .send(updateData);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Profile updated successfully.');
            expect(res.body.user.displayName).toBe(updateData.displayName);
            expect(res.body.user.email).toBe(updateData.email);
            expect(res.body.user.avatarUrl).toBe(updateData.fileUrl);

            const userInDb = await User.findById(authenticatedUserId);
            expect(userInDb?.displayName).toBe(updateData.displayName);
            expect(userInDb?.email).toBe(updateData.email);
            expect(userInDb?.avatarUrl).toBe(updateData.fileUrl);
        });

        it('should update only the provided fields and keep others unchanged', async () => {
           
            const initialUser = await User.findById(authenticatedUserId);
            const updateData = {
                displayName: 'Only Display Name Updated',
            };

            const res = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${authenticatedToken}`)
                .send(updateData);

            expect(res.statusCode).toBe(200);
            expect(res.body.user.displayName).toBe(updateData.displayName);
            expect(res.body.user.username).toBe(initialUser?.username);
            expect(res.body.user.email).toBe(initialUser?.email);
            expect(res.body.user.avatarUrl).toBe(initialUser?.avatarUrl);
        });

        it('should return 409 if the new username already exists for another user', async () => {
            await User.create({
                email: 'anotheruser@example.com',
                username: 'anotheruser',
                passwordHash: 'some_hash', 
            });

            const updateData = {
                username: 'anotheruser',
            };

            const res = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${authenticatedToken}`)
                .send(updateData);

            expect(res.statusCode).toBe(409);
            expect(res.body).toHaveProperty('error', 'Username already exists.');
        });

        it('should allow updating username to the same username as the current user', async () => {
            const initialUser = await User.findById(authenticatedUserId);
            const updateData = {
                username: initialUser?.username, 
            };

            const res = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${authenticatedToken}`)
                .send(updateData);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Profile updated successfully.');
            expect(res.body.user.username).toBe(initialUser?.username);
        });

        it('should return 409 if the new email already exists for another user', async () => {
            
            await User.create({
                email: 'existingemail@example.com',
                username: 'existingusername',
                passwordHash: 'some_hash',
            });

            const updateData = {
                email: 'existingemail@example.com',
            };

            const res = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${authenticatedToken}`)
                .send(updateData);

            expect(res.statusCode).toBe(409);
            expect(res.body).toHaveProperty('error', 'Email already exists.');
        });

        it('should allow updating email to the same email as the current user', async () => {
            const initialUser = await User.findById(authenticatedUserId);
            const updateData = {
                email: initialUser?.email, 
            };

            const res = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${authenticatedToken}`)
                .send(updateData);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Profile updated successfully.');
            expect(res.body.user.email).toBe(initialUser?.email);
        });


        it('should return 404 if the user to update is not found (post-deletion scenario)', async () => {
     
            await User.findByIdAndDelete(authenticatedUserId);

            const updateData = { displayName: 'Non Existent User' };

            const res = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${authenticatedToken}`)
                .send(updateData);

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('error', 'User not found.');
        });

        it('should return 400 if authenticated user ID format is invalid (mocked scenario)', async () => {
            const originalUserId = authenticatedUserId;
            authenticatedUserId = 'invalid-id-format'; 

            const updateData = { displayName: 'Test' };
            const res = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${authenticatedToken}`)
                .send(updateData);

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('error', 'Invalid user ID format.');

            authenticatedUserId = originalUserId; 
        });

        it('should return 500 for internal server errors during update', async () => {
       
            jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => {
                throw new Error('Database error during update');
            });

            const updateData = { displayName: 'Error User' };
            const res = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${authenticatedToken}`)
                .send(updateData);

            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty('error', 'Internal server error.');

            jest.restoreAllMocks(); 
        });
    });
});