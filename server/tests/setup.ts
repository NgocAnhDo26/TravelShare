import { vi, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Set up environment variables for testing
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';

// Suppress console.error for expected test errors
const originalConsoleError = console.error;
const suppressedErrors = [
  'Error deleting image from Supabase:',
  'Failed to delete old cover image:',
  'Token verification error:',
  'Password reset requested for non-existent user:',
];

// Suppress console.log for expected test messages and dotenv
const originalConsoleLog = console.log;
const suppressedLogs = [
  'Password reset requested for non-existent user:',
  '[dotenv@',
  'injecting env',
];

console.log = (...args) => {
  const message = args.join(' ');
  const shouldSuppress = suppressedLogs.some((log) => message.includes(log));
  if (!shouldSuppress) {
    originalConsoleLog(...args);
  }
};

console.error = (...args) => {
  const message = args.join(' ');
  const shouldSuppress = suppressedErrors.some((error) =>
    message.includes(error),
  );
  if (!shouldSuppress) {
    originalConsoleError(...args);
  }
};

// Mock Supabase configuration
vi.mock('../src/config/supabase.config', () => ({
  default: {
    storage: {
      // Add the missing methods for bucket operations
      listBuckets: vi.fn().mockResolvedValue({
        data: [
          { name: 'avatars' },
          { name: 'post-images' },
          { name: 'post-covers' },
        ],
        error: null
      }),
      createBucket: vi.fn().mockResolvedValue({
        data: { name: 'test-bucket' },
        error: null
      }),
      // Keep existing methods
      from: vi.fn().mockReturnValue({
        upload: vi
          .fn()
          .mockResolvedValue({ data: { path: 'public/mock-path' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://mock-supabase.com/public/mock-path' },
        }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
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

// Utility function to suppress console.error for specific test contexts
export const suppressConsoleError = (callback: () => void | Promise<void>) => {
  const originalError = console.error;
  console.error = vi.fn();

  try {
    callback();
  } finally {
    console.error = originalError;
  }
};

// Utility function to suppress console.error for async test contexts
export const suppressConsoleErrorAsync = async (
  callback: () => Promise<void>,
) => {
  const originalError = console.error;
  console.error = vi.fn();

  try {
    await callback();
  } finally {
    console.error = originalError;
  }
};
