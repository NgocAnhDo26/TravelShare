/**
 * @jest-environment node
 */
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../../src/models/user.model';
import Token from '../../src/models/token.model';
import { createMailingService, createToken } from '../../src/services/auth.service';
import * as authServiceModule from '../../src/services/auth.service';

// --- MOCK SETUP ---
const AuthService = authServiceModule.default;
const saltRounds = 12;
jest.mock('../../src/models/user.model');
jest.mock('../../src/models/token.model');
jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }));

const mockedUser = User as jest.Mocked<typeof User>;
const mockedToken = Token as jest.Mocked<typeof Token>;
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
    jest.resetAllMocks();

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

  it('should return 401 for invalid credentials', async () => {
    // Arrange
    if (mockRequest.body) {
      mockRequest.body.email = 'wrongemail@example.com';
      mockRequest.body.password = 'wrongpassword';
    }
    (mockedUser.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    // Act
    await AuthService.login(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Invalid email or password.',
    });
  });

  it('should return 500 for server errors', async () => {
    // Arrange
    if (mockRequest.body) {
      mockRequest.body.email = 'email@mail.com';
      mockRequest.body.password = 'password';
    }
    (mockedUser.findOne as jest.Mock).mockImplementation(() => {
      throw new Error('Database error');
    });

    // Act
    await AuthService.login(mockRequest as Request, mockResponse as Response);
    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Internal server error.',
    });
  });

  it('should create a JWT token', () => {
    // Arrange
    const userId = 'testUserId';
    const token = createToken(userId, 'access');
    const refreshToken = createToken(userId, 'refresh');

    // Assert
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(refreshToken).toBeDefined();
    expect(typeof refreshToken).toBe('string');
    expect(token).not.toEqual(refreshToken);
  });

  it('should return 400 for missing email or password', async () => {
    // Arrange
    if (mockRequest.body) {
      mockRequest.body.email = '';
      mockRequest.body.password = '';
    }

    // Act
    await AuthService.login(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Email and password are required.',
    });
  });
});

describe('AuthService.register', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.resetAllMocks();

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

  it('should register a new user successfully', async () => {
    // --- ARRANGE ---

    // 1. Set up the request body for the new user.
    if (mockRequest.body) {
      mockRequest.body.username = 'newuser';
      mockRequest.body.email = 'email@mail.com';
      mockRequest.body.password = 'validpassword123!H';
    }

    // 2. CRITICAL: Mock findOne to return null, simulating that the user does not exist.
    (mockedUser.findOne as jest.Mock).mockResolvedValue(null);

    // 3. Mock the result of the password hashing.
    const hashedPassword = 'a-very-secure-hash';
    (mockedBcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

    // 4. Mock the .save() method that will be called on the new user instance.
    const mockSave = jest.fn().mockResolvedValue(true);
    // Mock the User constructor to return an object that has our mock .save() method.
    (mockedUser as unknown as jest.Mock).mockImplementation(() => ({
      save: mockSave,
    }));

    // --- ACT ---
    await AuthService.register(
      mockRequest as Request,
      mockResponse as Response,
    );

    // --- ASSERT ---

    // 5. Assert that the password was hashed with the correct salt rounds.
    expect(mockedBcrypt.hash).toHaveBeenCalledWith('validpassword123!H', saltRounds);

    // 6. Assert that the User constructor was called with the correct data.
    expect(User).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'newuser',
        email: 'email@mail.com',
        passwordHash: hashedPassword,
      }),
    );

    // 7. Assert that the .save() method was called on the new user instance.
    expect(mockSave).toHaveBeenCalled();

    // 8. Assert that the correct success response was sent.
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'User registered successfully.',
      }),
    );
  });

  it('should return 400 for missing username, email, or password', async () => {
    // Arrange
    if (mockRequest.body) {
      mockRequest.body.username = '';
      mockRequest.body.email = '';
      mockRequest.body.password = '';
    }

    // Act
    await AuthService.register(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Email, username, and password are required.',
    });
  });

  it('should return 409 for existing email or username', async () => {
    // Arrange
    if (mockRequest.body) {
      mockRequest.body.username = 'existinguser';
      mockRequest.body.email = 'existingemail@mail.com'
      mockRequest.body.password = 'password123';
    }
    // Mock findOne to simulate that the user already exists.
    (mockedUser.findOne as jest.Mock).mockResolvedValue({
      select: jest.fn().mockResolvedValue({}),
    });
    // Act
    await AuthService.register(mockRequest as Request, mockResponse as Response);
    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(409);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Username already exists.',
    });
  });

  it('should return 500 for server errors', async () => {
    // Arrange
    if (mockRequest.body) {
      mockRequest.body.username = 'newuser';
      mockRequest.body.email = 'email@mail.com';
      mockRequest.body.password = 'validpassword123!H';
    }
    (mockedUser.findOne as jest.Mock).mockImplementation(() => {
      throw new Error('Database error');
    }
    );
    // Act
    await AuthService.register(mockRequest as Request, mockResponse as Response);
    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Internal server error.',
    });
  });
});

describe('AuthService.forgotPassword', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.resetAllMocks();

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

  it('should handle forgot password request', async () => {
    // Arrange
    if (mockRequest.body) {
      mockRequest.body.email = 'test@example.com'
    }
    // Mock findOne to simulate that the user exists.
    const mockUser = {
      _id: 'someUserId',
      email: 'test@example.com',
      save: jest.fn().mockResolvedValue(true),
    };
    (mockedUser.findOne as jest.Mock).mockResolvedValue(mockUser);
    const mockTokenSave = jest.fn().mockResolvedValue(true);
    // Mock the Token model to simulate creating a reset token.
    (mockedToken as unknown as jest.Mock).mockImplementation(() => ({
      userId: mockUser._id,
      token: 'resetToken',
      expires: new Date(Date.now() + 3600000), // 1 hour from now
      save: mockTokenSave,
    }));
    const mailingServiceSpy = jest.spyOn(authServiceModule, 'createMailingService');
    const mockSendMail = jest.fn().mockResolvedValue(true);
    // Mock the mailing service to simulate sending an email.
    mailingServiceSpy.mockReturnValue({
      sendMail: mockSendMail,
    } as unknown as ReturnType<typeof createMailingService>);
    
    // Act
    await AuthService.forgotPassword(mockRequest as Request, mockResponse as Response);
    
    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Password reset link sent to your email.',
    }));
    expect(mockResponse.json).toHaveBeenCalledTimes(1);
  });
  
})

describe('AuthService.resetPassword', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.resetAllMocks();

    // Create the mock objects. They only need the properties and methods
    // that are actually used by the function under test.
    mockRequest = {
      body: {},
      params: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
  });

  it('should reset password successfully', async () => {
    // Arrange
    if (mockRequest.body) {
      mockRequest.body.token = 'valid-reset-token';
      mockRequest.body.newPassword = 'newpassword123';
    }
    
    // Mock findOne to simulate that the token exists and is valid.
    const mockToken = {
      userId: 'someUserId',
      token: 'valid-reset-token',
      purpose: 'password-reset',
      isUsed: false,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      save: jest.fn().mockResolvedValue(true),
    };
    (mockedToken.findOne as jest.Mock).mockResolvedValue(mockToken);
    
    // Mock findById to simulate that the user exists.
    const mockUser = {
      _id: 'someUserId',
      passwordHash: 'old-hash',
      save: jest.fn().mockResolvedValue(true),
    };
    (mockedUser.findById as jest.Mock).mockResolvedValue(mockUser);
    
    // Mock the result of the password hashing.
    const hashedPassword = 'new-hashed-password';
    (mockedBcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
    
    // Act
    await AuthService.resetPassword(mockRequest as Request, mockResponse as Response);
    
    // Assert
    expect(mockedToken.findOne).toHaveBeenCalledWith({ 
      token: 'valid-reset-token',
      purpose: 'password-reset'
    });
    expect(mockedUser.findById).toHaveBeenCalledWith('someUserId');
    expect(mockedBcrypt.hash).toHaveBeenCalledWith('newpassword123', saltRounds);
    expect(mockUser.save).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Password reset successfully.',
    }));
  });
});