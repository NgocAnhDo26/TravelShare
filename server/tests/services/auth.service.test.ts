// import request from 'supertest';
// import mongoose from 'mongoose';
// import { MongoMemoryServer } from 'mongodb-memory-server';
// import app from '../../src/app';
// import User from '../../src/models/user.model';

// let mongoServer: MongoMemoryServer;

// beforeAll(async () => {
//   mongoServer = await MongoMemoryServer.create();
//   const uri = mongoServer.getUri();
//   await mongoose.connect(uri);
// });

// afterAll(async () => {
//   await mongoose.disconnect();
//   await mongoServer.stop();
// });

// afterEach(async () => {
//   await User.deleteMany({});
// });

// describe('POST /api/auth/register', () => {
//   it('should create a new user', async () => {
//     const newUser = {
//       email: 'maeve@example.com',
//       username: 'maeve',
//       password: '123456A@abc',
//     };
//     const res = await request(app).post('/api/auth/register').send(newUser);

//     expect(res.statusCode).toBe(201);
//     expect(res.body.name).toBe('Maeve');
//     expect(res.body.email).toBe('maeve@example.com');

//     const userInDb = await User.findOne({ email: 'maeve@example.com' });
//     expect(userInDb).not.toBeNull();
//   });

//   it('should return 500 if data is invalid', async () => {
//     const res = await request(app).post('/api/auth/register').send({}); // no name/email
//     expect(res.statusCode).toBe(500);
//   });
// });

describe('', () => {
  it('', async () => {
    
  });
});
