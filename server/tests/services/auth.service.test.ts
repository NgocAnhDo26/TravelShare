/**
 * @jest-environment node
 */
import { Request, Response } from 'express'; // Ensure Request and Response are imported
import bcrypt from 'bcrypt';
import User from '../../src/models/user.model';
import AuthService, { createToken } from '../../src/services/auth.service';

// --- MOCK SETUP ---
jest.mock('../../src/models/user.model');
jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }));

const mockedUser = User as jest.Mocked<typeof User>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService.login', () => {
  const originalEnv = process.env;

  beforeAll(() => {
    process.env.JWT_SECRET = 'your-test-secret';
    process.env.JWT_REFRESH_SECRET = 'your-test-refresh-secret';
  });

  afterAll(() => {
    process.env = originalEnv;
  });
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create the mock objects. They only need the properties and methods
    // that are actually used by the function under test.
    mockRequest = {
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
  });

  it('should log in a user successfully with valid credentials', async () => {
    // Arrange
    if (mockRequest.body) {
      mockRequest.body.email = 'test@example.com';
      mockRequest.body.password = 'password123';
    }
    const fakeUser = {
      _id: 'someUserId',
      username: 'testuser',
      passwordHash: 'hashedPassword',
      select: jest.fn().mockReturnThis(),
    };
    (mockedUser.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(fakeUser),
    });
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

    // Act: FIX #2: Use type assertions for BOTH arguments in the function call.
    await AuthService.login(mockRequest as Request, mockResponse as Response);

    // Assert
    // The status and json properties exist on our mockResponse, so this is safe.
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Login successful.',
      userId: 'someUserId',
      username: 'testuser',
    });
  });
});
