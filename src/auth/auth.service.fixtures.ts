import { PasswordReset, RefreshToken, Role, User } from '@prisma/client';

export const mockHashedPassword = '$2b$10$hashedPassword';

export const createMockJwtService = () => ({
  sign: jest.fn().mockReturnValue('fake-jwt-token'),
});

export const createMockConfigService = () => ({
  get: jest.fn().mockReturnValue('10'),
  getOrThrow: jest.fn(),
});

export const createMockNotificationsProducer = () => ({
  notifyPasswordReset: jest.fn().mockResolvedValue(undefined),
  notifyLowStock: jest.fn().mockResolvedValue(undefined),
});

export const fakeUser: Partial<User> = {
  userId: 'uid1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  password: mockHashedPassword,
  role: Role.client,
};

export const fakeRefreshToken: Partial<RefreshToken> = {
  refreshToken: 'fake-jwt-token',
  expiresAt: new Date('2026-08-01'),
  userId: 'uid1',
};

export const fakePasswordReset: Partial<PasswordReset> = {
  resetToken: 'fake-reset-token',
  expiresAt: new Date('2026-08-01'),
  userId: 'uid1',
  consumed: false,
};

export const fakePasswordResetExpired: Partial<PasswordReset> = {
  resetToken: 'expired-token',
  expiresAt: new Date('2020-01-01'),
  userId: 'uid1',
  consumed: false,
};
