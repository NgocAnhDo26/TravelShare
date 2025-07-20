import { vi, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Set up environment variables for testing
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';

// Mock Supabase configuration
vi.mock('../src/config/supabase.config', () => ({
  default: {
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi
        .fn()
        .mockResolvedValue({ data: { path: 'public/mock-path' }, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://mock-supabase.com/public/mock-path' },
      }),
      remove: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

// Mock nodemailer
vi.mock('nodemailer');
import nodemailer from 'nodemailer';

const sendMailMock = vi.fn().mockResolvedValue({ response: '250 OK' });
(nodemailer.createTransport as any) = vi.fn().mockReturnValue({
  sendMail: sendMailMock,
  verify: vi.fn().mockResolvedValue(true),
});
(nodemailer.createTestAccount as any) = vi.fn().mockResolvedValue({
  smtp: { host: 'smtp.ethereal.email', port: 587, secure: false },
  user: 'user',
  pass: 'pass',
});

// Global test setup and teardown
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clear all collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
  
  // Clear all mocks
  vi.clearAllMocks();
});

// Export common test utilities
export { sendMailMock }; 